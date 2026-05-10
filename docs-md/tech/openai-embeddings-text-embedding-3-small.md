
#### 개요
OpenAI가 제공하는 텍스트 임베딩 API로, 텍스트를 고차원 벡터로 변환하여 의미론적 유사도 계산을 가능하게 한다.

#### 역할 (Synapse 프로젝트 내)
- 노트 청크(500 토큰 단위)를 1536차원 벡터로 변환
- 변환된 벡터를 PostgreSQL `pgvector` 확장의 `note_chunks.embedding` 컬럼에 저장
- RAG 파이프라인에서 사용자 질의 임베딩 생성 (시맨틱 검색)
- 시맨틱 캐시의 질의 유사도 비교용 벡터 생성
- Kafka `note.created` / `note.updated` 이벤트 수신 후 비동기 임베딩 처리

#### 선택 이유
- `text-embedding-3-small`: 1536차원, 비용 $0.02/1M 토큰으로 경쟁 모델 대비 최저가
- `text-embedding-3-large` 대비 성능 차이 미미하나 비용은 5배 저렴
- OpenAI Embeddings API의 안정성 및 높은 가동률(99.9% SLA)
- pgvector와의 호환성 검증 완료 (1536차원 `vector` 타입 지원)
- 한국어 텍스트 임베딩 품질이 다국어 모델 중 상위권

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **OpenAI text-embedding-3-small** | 저비용, 안정성, 한국어 품질 | API 의존성, 자체 호스팅 불가 | **선택** |
| Cohere embed-multilingual-v3 | 다국어 특화, 1024차원 | 비용 높음, 생태계 작음 | 미선택 |
| BGE-M3 (자체 호스팅) | 무료, 데이터 보안 | GPU 필요, 운영 부담, 지연 시간 | 미선택 |
| Sentence-BERT (ko-sbert) | 한국어 특화 | 성능 한계, 업데이트 느림 | 미선택 |
| Voyage AI voyage-3 | 높은 검색 정확도 | 신규 서비스 리스크, 비용 | 미선택 |

#### 기술적 이점
- **비용 효율**: 노트 100만 토큰 임베딩 시 $0.02 (경쟁사 대비 5~10배 저렴)
- **배치 처리**: 최대 2048개 텍스트 동시 임베딩으로 처리 효율 극대화
- **차원 축소**: `dimensions` 파라미터로 256/512/1536 선택 가능 (저장 비용 절감)
- **정규화 벡터**: 반환 벡터가 기본 정규화되어 cosine similarity 계산 최적화

#### 핵심 기능
- 모델: `text-embedding-3-small` (1536차원, 8191 토큰 최대 입력)
- 청킹 전략: 500 토큰 슬라이딩 윈도우, 50 토큰 오버랩
- 배치 API: 한 번의 호출로 최대 2048개 청크 처리
- 비동기 처리: Kafka Consumer → AI Service → OpenAI API → pgvector 저장

#### 프로젝트 내 사용 위치
- **AI Service** (FastAPI): 임베딩 생성 전담
  - Kafka `note.created` 소비 → 청킹 → 임베딩 → pgvector 저장
  - `POST /ai/search/semantic` → 질의 임베딩 생성 → pgvector ANN 검색

#### 설정 가이드

```python
# embedding_service.py
from openai import AsyncOpenAI
import tiktoken

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 1536
CHUNK_SIZE = 500        # 토큰 단위
CHUNK_OVERLAP = 50      # 오버랩 토큰
BATCH_SIZE = 100        # 배치당 청크 수

encoder = tiktoken.get_encoding("cl100k_base")

def chunk_text(text: str) -> list[str]:
    """500 토큰 슬라이딩 윈도우 청킹"""
    tokens = encoder.encode(text)
    chunks = []
    start = 0
    while start < len(tokens):
        end = min(start + CHUNK_SIZE, len(tokens))
        chunk_tokens = tokens[start:end]
        chunks.append(encoder.decode(chunk_tokens))
        if end == len(tokens):
            break
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks

async def embed_chunks(chunks: list[str]) -> list[list[float]]:
    """배치 임베딩 생성"""
    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    all_embeddings = []
    for i in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[i:i + BATCH_SIZE]
        response = await client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=batch,
            dimensions=EMBEDDING_DIMENSIONS
        )
        all_embeddings.extend([e.embedding for e in response.data])
    return all_embeddings

# pgvector 저장 (PostgreSQL)
# note_chunks 테이블: embedding vector(1536)
async def save_chunks(note_id: UUID, chunks: list[str],
                       embeddings: list[list[float]]):
    await db.executemany("""
        INSERT INTO note_chunks
        (note_id, chunk_index, content, embedding, token_count)
        VALUES ($1, $2, $3, $4::vector, $5)
        ON CONFLICT (note_id, chunk_index) DO UPDATE
        SET content = EXCLUDED.content,
            embedding = EXCLUDED.embedding
    """, [(note_id, i, c, str(e), len(encoder.encode(c)))
          for i, (c, e) in enumerate(zip(chunks, embeddings))])
```

#### 트러블슈팅

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| `RateLimitError` | TPM/RPM 초과 | 429 응답 시 `retry-after` 헤더 준수, 지수 백오프 |
| 벡터 차원 불일치 | pgvector 컬럼 설정 오류 | `ALTER TABLE note_chunks ALTER COLUMN embedding TYPE vector(1536)` |
| 청킹 과다 | 노트가 매우 긴 경우 | 청크 수 상한(500개) 설정, 초과 시 요약 후 재청킹 |
| 한국어 토큰 과다 | 한국어는 영어 대비 토큰 효율 낮음 | CHUNK_SIZE를 400으로 조정 검토 |
| 임베딩 재생성 누락 | Kafka 메시지 유실 | Consumer Group 오프셋 관리, Dead Letter Topic 설정 |

#### 참고 자료
- 공식 문서: https://platform.openai.com/docs/guides/embeddings
- 모델 카드: https://platform.openai.com/docs/models/text-embedding-3-small
- pgvector 연동: https://github.com/pgvector/pgvector#storing

---
