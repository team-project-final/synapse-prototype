# synapse-learning-svc — ARCHITECTURE

> **Wiki 03번** 기준선 + **03-D 어댑터 표준** 적용
> **Version**: v2.0 | **Updated**: 2026-05-18
> 본 문서는 레포의 실제 폴리글랏 디렉토리 구조(`learning-card/` Java + `learning-ai/` Python)를 기반으로 작성됨.

---

## 1. 책임 범위

Synapse의 **학습 도메인** + **AI 컴퓨트**. SRS 기반 카드 학습(Java) + LLM 기반 카드 자동 생성/시맨틱 검색/Q&A(Python).

| 서브 프로젝트 | 언어 | Wiki 03.2.4 책임 |
|--------------|------|-----------------|
| **`learning-card/`** | Java/Spring Boot 4 | 카드/덱 CRUD, SRS 스케줄링, 복습 큐/제출, 세션, 진도 통계 |
| **`learning-ai/`** | Python/FastAPI | 카드 자동 생성, 시맨틱 검색, 하이브리드 검색, Q&A (RAG), 시맨틱 캐시, 사용량 추적 |

⚠️ **폴리글랏 레포 — 단일 GitHub 레포에 Java + Python 별도 디렉토리** (settings.gradle.kts는 Java만 다룸).

---

## 2. 레포 구조 (실제)

```
synapse-learning-svc/
├── .github/
├── docs/
├── learning-card/                          # ★ Java 영역 (Spring Boot)
│   ├── src/
│   │   ├── main/java/io/synapse/learning/card/
│   │   │   ├── CardApplication.java
│   │   │   ├── card/                       # Modulith 모듈 (추정)
│   │   │   ├── deck/
│   │   │   ├── review/
│   │   │   ├── session/
│   │   │   ├── srs/
│   │   │   └── shared/
│   │   └── resources/
│   ├── build.gradle.kts                    # 모듈 빌드
│   └── Dockerfile
├── learning-ai/                            # ★ Python 영역 (FastAPI)
│   ├── pyproject.toml
│   ├── poetry.lock
│   ├── ai_service/
│   │   ├── __init__.py
│   │   ├── main.py                         # FastAPI 진입점
│   │   ├── api/                            # REST 엔드포인트
│   │   ├── grpc/                           # gRPC 서버
│   │   ├── domain/
│   │   │   ├── model/
│   │   │   └── port/                       # ★ Outbound Port
│   │   ├── application/                    # UseCase
│   │   ├── infrastructure/
│   │   │   └── adapter/                    # ★ Adapter 구현
│   │   │       ├── outbound/
│   │   │       │   ├── openai/
│   │   │       │   ├── pgvector/
│   │   │       │   ├── elasticsearch/
│   │   │       │   └── redis/
│   │   │       └── inbound/
│   │   ├── config.py
│   │   └── observability.py
│   ├── tests/
│   └── Dockerfile
├── settings.gradle.kts                     # Java 모듈만 (learning-card)
├── README.md
└── SECRETS.md
```

⚠️ 현재 상태: 12 commits, 부트스트랩 초기. README는 "상세 내용 곧 추가". 구조는 디렉토리 + Wiki 03번 기반 추정.

---

## 3. learning-card (Java) — Modulith 모듈

### 3.1 모듈 구조 (Spring Modulith 추정)

```
io.synapse.learning.card/
├── card/                                   # 카드 CRUD
├── deck/                                   # 덱 관리
├── review/                                 # 복습 + SRS 알고리즘
├── session/                                # 학습 세션
├── srs/                                    # SM-2 알고리즘 (도메인 정책)
└── shared/                                 # 공통 (TenantContext, Outbox, ...)
```

### 3.2 도메인 핵심

```
Deck (Aggregate Root)
  ├─ DeckSettings
  └─ Cards (1:N)

Card (Aggregate Root)
  ├─ CardContent (front, back, cloze, ...)
  ├─ SrsState (interval, ease_factor, due_date)
  └─ ReviewHistory

ReviewSession (Aggregate)
  ├─ startedAt, completedAt
  ├─ targetCount
  ├─ Reviews (N)
  └─ stats
```

### 3.3 SM-2 알고리즘 (도메인 정책)

```java
public class Sm2Algorithm {
    public SrsState calculateNext(SrsState current, ReviewRating rating) {
        // AGAIN(1) / HARD(2) / GOOD(3) / EASY(4)
        if (rating == ReviewRating.AGAIN) {
            return new SrsState(
                0,
                Math.max(1.3, current.easeFactor() - 0.2),
                0,
                Instant.now().plus(Duration.ofMinutes(10))
            );
        }
        int reps = current.repetitions() + 1;
        double ef = current.easeFactor()
            + (0.1 - (4 - rating.value()) * (0.08 + (4 - rating.value()) * 0.02));
        ef = Math.max(1.3, ef);
        int interval = switch (reps) {
            case 1 -> 1;
            case 2 -> 6;
            default -> (int) Math.round(current.interval() * ef);
        };
        return new SrsState(interval, ef, reps,
            Instant.now().plus(Duration.ofDays(interval)));
    }
}
```

⚠️ FSRS 알고리즘 마이그레이션 검토 중. 03-C dual-write로 점진 전환 예정.

### 3.4 03-D Port/Adapter (card 측)

| Port (도메인) | Adapter (인프라) | 호출 대상 |
|---------------|-----------------|----------|
| `NotePort` | `NoteGrpcAdapter` | **knowledge-svc** `NoteService.GetForLearning` |
| `AICardGeneratorPort` | `AIServiceGrpcAdapter` | **learning-ai (Python)** `AIService.GenerateCard` |
| `UserPort` | `UserGrpcAdapter` | **platform-svc** `UserService.GetById` |
| `CardEventPublisher` | `CardEventKafkaAdapter` (Outbox) | Kafka (`card.*` 토픽) |
| `ReviewQueueCachePort` | `RedisReviewQueueAdapter` | Redis (오늘 due 카드) |
| `DeckCopyPort` (inbound for community-svc) | `DeckServiceGrpcAdapter` | community-svc가 호출 |

### 3.5 외부 인터페이스 (card)

**REST (Gateway 경유)**:
- `/api/v1/cards/**`
- `/api/v1/decks/**`
- `/api/v1/reviews/**`
- `/api/v1/sessions/**`

**gRPC 제공**:
- `ProgressService.GetStats` — engagement-svc 호출
- `DeckService.Copy` — community-svc 호출

**Kafka Producer** (Outbox):
- `card.created`, `card.updated`, `card.deleted`, `card.reviewed`, `card.review.due` (일 1회 배치)

**Kafka Consumer**:
- `user.deleted`, `tenant.deleted` → 카드 데이터 정리
- `subscription.changed` → Feature Flag (AI 호출 횟수 등)
- `chunk.generated` → 카드 자동 생성 대기열 (Phase 2)

---

## 4. learning-ai (Python) — Hexagonal

### 4.1 패키지 구조 (03-D 적용)

```
ai_service/
├── main.py                                 # FastAPI app
├── api/
│   ├── routes/
│   │   ├── generate.py                     # /ai/cards/generate (SSE)
│   │   ├── search.py                       # /ai/search/{semantic|hybrid}
│   │   ├── qa.py                           # /ai/qa (SSE)
│   │   └── embed.py                        # /ai/embed (internal)
│   └── deps.py                             # DI (Provider via fastapi.Depends)
├── grpc/
│   ├── ai_servicer.py                      # AIService gRPC 구현
│   └── server.py
├── domain/
│   ├── model/                              # GenerationRequest, GeneratedCard, ...
│   └── port/
│       ├── llm_port.py
│       ├── reranker_port.py
│       ├── vector_store_port.py
│       ├── search_index_port.py
│       ├── note_update_port.py
│       └── cache_port.py
├── application/                            # UseCase
│   ├── generate_cards_usecase.py
│   ├── semantic_search_usecase.py
│   ├── hybrid_search_usecase.py
│   ├── qa_usecase.py
│   └── embed_usecase.py
├── infrastructure/
│   ├── adapter/
│   │   ├── outbound/
│   │   │   ├── openai_adapter.py           # LLMPort 구현 (OpenAI)
│   │   │   ├── anthropic_adapter.py        # LLMPort 구현 (Fallback)
│   │   │   ├── cohere_reranker_adapter.py  # RerankerPort 구현
│   │   │   ├── pgvector_adapter.py         # VectorStorePort 구현
│   │   │   ├── elasticsearch_adapter.py    # SearchIndexPort 구현
│   │   │   ├── note_grpc_adapter.py        # NoteUpdatePort 구현 (knowledge-svc)
│   │   │   └── redis_cache_adapter.py      # CachePort 구현 (시맨틱 캐시)
│   │   └── inbound/
│   │       ├── rest/                       # FastAPI routes
│   │       └── grpc/                       # gRPC servicer
│   └── config/
├── config.py
└── observability.py
```

### 4.2 03-D Port/Adapter (AI 측)

| Port | Adapter | 호출 대상 |
|------|---------|----------|
| `LLMPort` | `OpenAIAdapter`, `AnthropicAdapter` | OpenAI / Anthropic API |
| `RerankerPort` | `CohereRerankerAdapter` (선택) | Cohere rerank API |
| `VectorStorePort` | `PgvectorAdapter` | pgvector (knowledge schema, read-only) |
| `SearchIndexPort` | `ElasticsearchAdapter` | Elasticsearch (BM25) |
| `NoteUpdatePort` | `NoteGrpcAdapter` | knowledge-svc `NoteService.UpdateChunks` (콜백) |
| `CachePort` | `RedisCacheAdapter` | Redis (시맨틱 캐시) |
| `UsageRecorderPort` | `PostgresUsageAdapter` | `ai_usage_logs` 테이블 |

### 4.3 LLM 호출 전략

| 작업 | 1차 모델 | Fallback |
|------|---------|----------|
| 카드 생성 | OpenAI `gpt-4o-mini` | Anthropic `claude-3-haiku` |
| Q&A (RAG) | OpenAI `gpt-4o` | Anthropic `claude-3-5-sonnet` |
| 임베딩 | OpenAI `text-embedding-3-small` | (없음, 일관성 중요) |
| Reranker | Cohere `rerank-multilingual-v3.0` | BM25+벡터 RRF |

### 4.4 RAG 파이프라인 (UseCase)

```
QaUseCase.execute(query, user_id, tenant_id):
1. CachePort.find_similar_cached(query)                # 시맨틱 캐시 (threshold 0.95+)
2. if cached: return cached
3. embedding = LLMPort.embed(query)
4. retrieved_pgvector = VectorStorePort.search(embedding, top_k=20, tenant_id)
5. retrieved_bm25    = SearchIndexPort.search(query, top_k=20, tenant_id)
6. merged = RRF(retrieved_pgvector, retrieved_bm25, top_k=10)
7. (선택) reranked = RerankerPort.rerank(query, merged, top_k=5)
8. stream = LLMPort.generate_stream(system, retrieved_context, query)
9. async for chunk in stream: yield chunk
10. UsageRecorderPort.record(user_id, tenant_id, model, tokens, ...)
11. CachePort.cache_response(query, embedding, full_response)
```

### 4.5 외부 인터페이스 (AI)

**REST (Gateway 경유)**:
- `POST /api/v1/ai/cards/generate` — SSE 스트리밍
- `POST /api/v1/ai/search/semantic`
- `POST /api/v1/ai/search/hybrid`
- `POST /api/v1/ai/qa` — SSE 스트리밍

**gRPC 제공**:
- `AIService.Embed(text)` — knowledge-svc chunking이 호출
- `AIService.EmbedBatch(texts)` — batch 임베딩
- `AIService.GenerateCard(req)` — server-streaming, learning-card가 호출

**Kafka**:
- Producer: `ai.usage.recorded` (billing svc가 소비 — 사용량 제한)
- Consumer: 현재 없음 (요청 기반 처리)

---

## 5. 데이터 저장소

### 5.1 PostgreSQL

| 테이블 | 서비스 | 비고 |
|--------|--------|------|
| `decks` | card | RLS |
| `cards` | card | RLS |
| `srs_states` | card | 1:1 with cards |
| `reviews` | card | append-only (Event Sourcing 부분 적용) |
| `review_sessions` | card | 세션 통계 |
| `ai_usage_logs` | ai | 토큰/비용 추적, append-only |
| `semantic_cache` | ai | 쿼리 임베딩 + 응답 |
| `outbox_event` | card | 03-A.6 |
| `processed_events` | card | 멱등성 |

### 5.2 pgvector (knowledge schema, 읽기만)

AI Service는 `knowledge.note_chunks` 테이블을 **읽기 전용**으로 사용. 쓰기는 chunking-worker → AI.EmbedBatch → 결과를 NoteService.UpdateChunks gRPC 콜백.

### 5.3 Redis

| 키 패턴 | 모듈 | 용도 | TTL |
|---------|------|------|-----|
| `card:due:{userId}:{date}` | card | 오늘 due 카드 ID 리스트 | 자정 갱신 |
| `card:session:{sessionId}` | card | 진행 중 세션 | 1h |
| `ai:cache:{queryHash}` | ai | 시맨틱 캐시 키 | 7d |
| `ai:ratelimit:{userId}:{window}` | ai | 호출 빈도 제한 | 1m/1h/1d |
| `ai:streaming:{sessionId}` | ai | SSE 진행 상태 | 30s |

---

## 6. 외부 의존성

| 호출 대상 | 호출자 | 어댑터 |
|----------|--------|-------|
| OpenAI API | learning-ai | `OpenAIAdapter` (asyncio + httpx) |
| Anthropic API | learning-ai | `AnthropicAdapter` |
| Cohere Rerank API | learning-ai | `CohereRerankerAdapter` |
| knowledge-svc gRPC | both | card: `NoteGrpcAdapter` (NotePort), ai: `NoteGrpcAdapter` (NoteUpdatePort) |
| platform-svc gRPC | card | `UserGrpcAdapter`, `AuthGrpcAdapter` |
| learning-ai gRPC | learning-card | `AIServiceGrpcAdapter` |

---

## 7. 빌드 / 배포

### 7.1 learning-card

```bash
cd learning-card
./gradlew build
./gradlew test
./gradlew test --tests "*ModuleStructureTest"
```

### 7.2 learning-ai

```bash
cd learning-ai
poetry install
poetry run pytest

# gRPC 코드 생성
poetry run python -m grpc_tools.protoc \
  --python_out=ai_service/grpc/gen \
  --grpc_python_out=ai_service/grpc/gen \
  -I../proto ../proto/synapse/internal/learning/v1/*.proto
```

### 7.3 Docker

별도 이미지 2개:
- `ghcr.io/team-project-final/synapse-learning-card:{version}`
- `ghcr.io/team-project-final/synapse-learning-ai:{version}`

```dockerfile
# learning-ai Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml poetry.lock ./
RUN pip install poetry && poetry config virtualenvs.create false && \
    poetry install --no-dev --no-root
COPY ai_service ./ai_service
EXPOSE 8000 9090
CMD ["uvicorn", "ai_service.main:app", "--host", "0.0.0.0", "--port", "8000", \
     "--workers", "4", "--loop", "uvloop"]
```

### 7.4 K8s

| 컨테이너 | HPA 기반 | 특이사항 |
|---------|---------|---------|
| card-svc | CPU + 요청률 | 일반 Spring Boot |
| ai-svc | CPU + 큐 lag | LLM I/O 바운드, workers 다수 |

---

## 8. 관측성

### 8.1 메트릭

| 메트릭 | 위치 | 라벨 |
|--------|------|------|
| `card_reviews_total` | card | `rating`, `tenant` |
| `card_sm2_calculation_seconds` | card | - |
| `ai_generation_total` | ai | `model`, `cardType`, `result` |
| `ai_tokens_used_total` | ai | `model`, `type`, `tenant` |
| `ai_cache_hit_rate` | ai | `queryType` |
| `ai_quota_exceeded_total` | ai | `tenant`, `plan` |

### 8.2 로깅

learning-ai는 `structlog` 사용, JSON 포맷:

```python
log.info("ai.generation.completed",
  note_id=..., tenant_id=..., user_id=...,
  model="gpt-4o-mini", input_tokens=1234, output_tokens=567,
  cards_generated=5, duration_ms=1200, cache_hit=False)
```

### 8.3 추적 (OTel)

- Java: 자동 계측 (OpenTelemetry Java Agent)
- Python: `opentelemetry-instrumentation-fastapi` + `opentelemetry-instrumentation-grpc`

---

## 9. 보안

| 항목 | 구현 |
|------|------|
| 카드/리뷰 접근 | RLS |
| AI 호출 권한 | Gateway JWT 검증 + Tenant Context propagation |
| OpenAI API Key | AWS Secrets Manager + External Secrets Operator + `pydantic.SecretStr` |
| LLM Prompt Injection 방어 | system prompt 분리, user input 명확 구분, output sanitization |
| 사용량 무결성 | `ai_usage_logs` append-only, UNIQUE(request_id) |

---

## 10. 로컬 개발

### 10.1 인프라

```bash
docker compose -f docker-compose.dev.yml up -d \
  postgres-pgvector redis kafka schema-registry
```

### 10.2 learning-card

```bash
cd learning-card
./gradlew bootRun --args='--spring.profiles.active=local'
```

### 10.3 learning-ai

```bash
cd learning-ai
poetry shell
export OPENAI_API_KEY=sk-...
poetry run uvicorn ai_service.main:app --reload --port 8000
```

### 10.4 LLM mocking (CI)

- `respx` 또는 `vcr.py` 사용
- 또는 `stoplight/prism` Docker 컨테이너로 mock 서버

---

## 11. 안티패턴 (03-D)

- ❌ UseCase가 `openai.AsyncClient` 직접 호출 — `LLMPort`만 호출
- ❌ Card 모듈이 `AIServiceBlockingStub` import — `AICardGeneratorPort` 경유
- ❌ proto 모델을 도메인 Card에 노출 — Mapper로 변환
- ❌ Note proto 필드를 UseCase가 직접 접근 — `NoteSnapshot` 도메인 record로 변환
- ❌ Adapter에 비즈니스 (예: RRF 점수 계산) — UseCase로 이동

---

## 12. 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| SRS due 누락 | TZ 불일치 (UTC ↔ KST) | timestamp TIMESTAMPTZ, 계산은 UTC, 표시는 사용자 TZ |
| AI 응답 느림 | 컨텍스트 길이 큼 | 청크 Top 5로 제한, max_tokens 줄임 |
| AI quota 초과 | Free 플랜 정상 | UI 안내 + 업그레이드 CTA |
| 시맨틱 캐시 부정확 | threshold 낮음 | 0.95 → 0.97 |
| Python gRPC OOM | 동시 요청 많음 | workers 증설, 메모리 한도 조정 |
| Card → AI deadline 초과 | AI 응답 30s+ | gRPC streaming, 클라이언트 SSE 직접 |

---

## 13. 현재 상태

- 부트스트랩 초기 (12 commits)
- 디렉토리 골격: `learning-card/` + `learning-ai/` 분리 확인됨
- 구체 구현은 향후 추가 예정

---

## 14. 참고

- **Wiki 03** (Card/AI Service)
- **Wiki 02** — 학습 도메인 테이블
- **Wiki 04** — API
- **03-A** — gRPC streaming, Resilience4j
- **03-B** — OpenAI API Key 관리
- **03-C** — card.reviewed, ai.* 스키마
- **03-D** — Port/Adapter 표준
- [SuperMemo SM-2](https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method)
- [FSRS](https://github.com/open-spaced-repetition/fsrs4anki/wiki)
- [Reciprocal Rank Fusion](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf)
