
#### 개요
Anthropic이 개발한 대규모 언어 모델(LLM) API로, 안전성과 유용성을 중심으로 설계된 상용 AI 서비스이다.

#### 역할 (Synapse 프로젝트 내)
- 노트 내용을 분석하여 학습 카드(앞면/뒷면) 자동 생성
- 한국어 Q&A 카드 생성을 위한 전문 프롬프트 처리
- 노트 요약 및 핵심 개념 추출
- RAG 파이프라인의 최종 응답 생성 (컨텍스트 기반 질의응답)
- Server-Sent Events(SSE) 스트리밍 응답으로 실시간 카드 생성 UX 제공
- `llm_usage_logs` 테이블에 토큰 사용량 기록 (비용 추적)

#### 선택 이유
- 한국어 처리 능력이 GPT-4o 대비 동등 이상이며, 긴 컨텍스트(200K 토큰)에서 일관된 품질 유지
- Anthropic의 Constitutional AI 접근법으로 유해 콘텐츠 생성 위험 최소화
- Claude 3.5 Sonnet 기준 GPT-4o 대비 20~30% 저렴한 토큰 비용
- 프롬프트 캐싱(Prompt Caching) 기능으로 반복 시스템 프롬프트 비용 최대 90% 절감
- Python SDK(`anthropic`) 및 스트리밍 지원이 FastAPI와 자연스럽게 통합

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **Anthropic Claude 3.5 Sonnet** | 긴 컨텍스트, 안전성, 프롬프트 캐싱, 합리적 비용 | 자체 호스팅 불가, API 의존성 | **선택** |
| OpenAI GPT-4o | 생태계 성숙, Function Calling 완성도 | 비용 높음, 컨텍스트 128K 제한 | 미선택 |
| Google Gemini 1.5 Pro | 컨텍스트 1M, 멀티모달 | 한국어 품질 불안정, API 안정성 이슈 | 미선택 |
| Meta Llama 3 (자체 호스팅) | 비용 절감, 데이터 보안 | GPU 인프라 비용, 운영 부담, 품질 격차 | 미선택 |
| Mistral Large | 유럽 GDPR 친화적 | 한국어 지원 미흡, 생태계 작음 | 미선택 |

#### 기술적 이점
- **프롬프트 캐싱**: 시스템 프롬프트(카드 생성 지침 ~2,000 토큰)를 캐시하여 반복 호출 비용 90% 절감
- **스트리밍**: SSE로 카드 생성 결과를 실시간 스트리밍하여 체감 응답 속도 대폭 향상
- **200K 컨텍스트**: 긴 노트(100페이지 이상)도 단일 호출로 처리 가능
- **구조화 출력**: JSON 모드 활용으로 카드 앞면/뒷면 파싱 오류 제거

#### 핵심 기능
- `claude-3-5-sonnet-20241022` 모델 사용 (카드 생성, Q&A)
- `claude-3-haiku-20240307` 모델 사용 (요약 등 경량 작업)
- Messages API (`/v1/messages`) 호출
- 스트리밍: `stream=True` 파라미터
- 프롬프트 캐싱: `cache_control: {"type": "ephemeral"}` 블록 지정
- 입력 토큰 / 출력 토큰 / 캐시 토큰 각각 추적

#### 프로젝트 내 사용 위치
- **AI Service** (FastAPI): 모든 Claude API 호출의 단일 진입점
  - `POST /ai/cards/generate` → Claude Sonnet 호출
  - `POST /ai/notes/summarize` → Claude Haiku 호출
  - `POST /ai/ask` → RAG 파이프라인 최종 응답 생성

#### 설정 가이드

```python
# AI Service - config.py
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")  # AWS Secrets Manager에서 주입
CLAUDE_CARD_MODEL = "claude-3-5-sonnet-20241022"
CLAUDE_SUMMARY_MODEL = "claude-3-haiku-20240307"
MAX_TOKENS_CARD = 2048
MAX_TOKENS_SUMMARY = 512

# 카드 생성 프롬프트 (한국어 Q&A 특화)
CARD_SYSTEM_PROMPT = """당신은 교육 전문가입니다. 주어진 노트 내용을 분석하여
간결하고 명확한 학습 카드를 생성합니다.
규칙:
1. 앞면: 핵심 개념 또는 질문 (1~2문장)
2. 뒷면: 명확한 답변 또는 설명 (3~5문장)
3. 한국어로 작성
4. JSON 배열 형식으로 반환: [{"front": "...", "back": "..."}]
"""

# 스트리밍 호출 예시
async def generate_cards_stream(note_content: str):
    async with anthropic.AsyncAnthropic() as client:
        async with client.messages.stream(
            model=CLAUDE_CARD_MODEL,
            max_tokens=MAX_TOKENS_CARD,
            system=[{
                "type": "text",
                "text": CARD_SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"}  # 프롬프트 캐싱
            }],
            messages=[{"role": "user", "content": note_content}]
        ) as stream:
            async for text in stream.text_stream:
                yield f"data: {text}\n\n"

# 토큰 사용량 기록
async def log_usage(usage: Usage, tenant_id: UUID, user_id: UUID, feature: str):
    await db.execute("""
        INSERT INTO llm_usage_logs
        (tenant_id, user_id, model, feature, input_tokens, output_tokens,
         cache_read_tokens, cache_creation_tokens, cost_usd)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
                $5 * 0.000003 + $6 * 0.000015)
    """, tenant_id, user_id, CLAUDE_CARD_MODEL, feature,
        usage.input_tokens, usage.output_tokens,
        usage.cache_read_input_tokens, usage.cache_creation_input_tokens)
```

#### 트러블슈팅

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| `overloaded_error` (529) | Claude API 과부하 | Exponential backoff 재시도 (최대 3회, 1s/2s/4s 간격) |
| 스트리밍 중단 | 네트워크 타임아웃 | `httpx` 클라이언트 `timeout=120` 설정 |
| JSON 파싱 실패 | 모델이 JSON 형식 미준수 | 응답에서 ```json 블록 추출 후 파싱, 실패 시 재호출 |
| 토큰 초과 | 긴 노트 입력 | 청크별 분할 생성 후 병합 |
| 캐시 미적용 | 프롬프트 1024 토큰 미만 | 시스템 프롬프트 최소 1024 토큰 확보 |

#### 참고 자료
- 공식 문서: https://docs.anthropic.com/en/api/getting-started
- 프롬프트 캐싱: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
- 스트리밍: https://docs.anthropic.com/en/api/messages-streaming
- 모델 비교: https://docs.anthropic.com/en/docs/about-claude/models

---
