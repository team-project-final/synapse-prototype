
#### 개요
LLM 애플리케이션 개발을 위한 Python 프레임워크로, 프롬프트 관리, 체인 구성, RAG 파이프라인, 에이전트, 메모리 등을 추상화한다.

#### 역할
Synapse AI Service의 핵심 오케스트레이션 레이어이다. (1) **카드 자동 생성**: 노트 내용 → 청킹 → LLM 프롬프트 → 구조화된 카드 출력, (2) **RAG 파이프라인**: 사용자 쿼리 → 임베딩 → pgvector 유사도 검색 → 컨텍스트 주입 → LLM 응답, (3) **노트 요약**, (4) **시맨틱 태그 추출**을 LCEL(LangChain Expression Language)로 구현한다.

#### 선택 이유
LangChain은 LLM 애플리케이션 개발의 사실상 표준 프레임워크로, OpenAI/Anthropic/HuggingFace 등 다양한 LLM 제공자를 통일된 인터페이스로 추상화한다. 프롬프트 템플릿, 출력 파서, pgvector 통합이 모두 내장되어 AI 기능 개발 속도를 크게 향상시킨다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **LangChain 1.x** | 가장 성숙한 LLM 프레임워크, 방대한 통합, 활발한 업데이트 | 빠른 API 변경, 과도한 추상화 우려 | ✅ 선택 |
| LlamaIndex | 문서 인덱싱/RAG 특화 | 범용성 낮음 | 보조 사용 검토 |
| 직접 OpenAI SDK | 최대 제어권, 의존성 최소 | 반복 코드 많음, 기능 직접 구현 | 단순 호출에 사용 |
| Haystack | 엔터프라이즈 RAG | 작은 커뮤니티 | ❌ |

#### 기술적 이점
- **LCEL**: `|` 연산자로 체인 구성, 병렬 실행, 스트리밍 지원
- **구조화 출력**: `with_structured_output()` + Pydantic으로 JSON 강제
- **pgvector 통합**: `PGVector` 벡터 스토어로 PostgreSQL 임베딩 검색
- **스트리밍**: `astream()` / `astream_events()`로 토큰 단위 스트리밍
- **콜백**: 디버깅, 로깅, 비용 추적 시스템

#### 핵심 기능
- `ChatOpenAI`: OpenAI 채팅 모델 래퍼
- `ChatPromptTemplate`: 프롬프트 관리
- `PGVector`: PostgreSQL pgvector 통합 벡터 스토어
- `RecursiveCharacterTextSplitter`: 텍스트 청킹
- `PydanticOutputParser`: LLM 출력 구조화

#### 프로젝트 내 사용 위치
- `synapse-learning-svc/learning-ai/app/services/card_generator.py`
- `synapse-learning-svc/learning-ai/app/services/rag_service.py`
- `synapse-learning-svc/learning-ai/app/services/summarizer.py`
- `synapse-learning-svc/learning-ai/app/services/embedder.py`

#### 설정 가이드

```python
# app/services/card_generator.py — LCEL 카드 생성 체인
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field

class FlashCard(BaseModel):
    front: str = Field(description="카드 앞면 (질문)")
    back: str = Field(description="카드 뒷면 (답변)")
    hint: str = Field(description="힌트")
    difficulty: int = Field(ge=1, le=5, description="난이도 1-5")

class FlashCardList(BaseModel):
    cards: list[FlashCard]

class CardGeneratorService:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)
        self.parser = PydanticOutputParser(pydantic_object=FlashCardList)
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "교육 전문가로서 플래시카드를 생성하세요.\n{format_instructions}"),
            ("human", "다음 내용으로 {count}개의 카드를 생성하세요:\n\n{content}"),
        ])
        # LCEL 체인
        self.chain = (
            self.prompt.partial(
                format_instructions=self.parser.get_format_instructions())
            | self.llm
            | self.parser
        )

    async def generate(self, content: str, card_count: int = 5) -> list[FlashCard]:
        result = await self.chain.ainvoke({"content": content, "count": card_count})
        return result.cards
```

```python
# app/services/rag_service.py — RAG 파이프라인
from langchain_community.vectorstores.pgvector import PGVector
from langchain_openai import OpenAIEmbeddings
from langchain_core.runnables import RunnablePassthrough

class RAGService:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        self.vectorstore = PGVector(
            collection_name="note_embeddings",
            connection_string=settings.DB_URL,
            embedding_function=self.embeddings,
        )

    async def query(self, question: str, tenant_id: str) -> str:
        retriever = self.vectorstore.as_retriever(
            search_kwargs={"k": 5,
                           "filter": {"tenant_id": tenant_id}})
        rag_chain = (
            {"context": retriever, "question": RunnablePassthrough()}
            | self.rag_prompt
            | self.llm
        )
        return await rag_chain.ainvoke(question)
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| 구조화 출력 파싱 실패 | LLM이 JSON 형식 무시 | `with_structured_output()` + `mode="json"` 사용 |
| 임베딩 비용 급증 | 매 요청마다 임베딩 재생성 | Redis 임베딩 캐싱 (`CacheBackedEmbeddings`) |
| RAG 검색 품질 낮음 | 청킹 크기 부적합 | `chunk_size=500, chunk_overlap=100` 튜닝 |
| LangChain API 호환성 오류 | 버전 업그레이드 시 breaking change | `langchain-core`, `langchain`, `langchain-community` 버전 고정 |
| 스트리밍 연결 끊김 | uvicorn timeout | `--timeout 120` 증가, SSE keepalive 추가 |

#### 참고 자료
- LangChain 공식: https://python.langchain.com/docs/
- LCEL 가이드: https://python.langchain.com/docs/expression_language/
- LangChain + pgvector: https://python.langchain.com/docs/integrations/vectorstores/pgvector/

---
