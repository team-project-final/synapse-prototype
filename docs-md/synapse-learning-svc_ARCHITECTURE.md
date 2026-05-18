# synapse-learning-svc — ARCHITECTURE

> **Synapse Wiki**: [03_프로젝트_아키텍처_정의서](https://github.com/team-project-final/documents/wiki/03_%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8_%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98_%EC%A0%95%EC%9D%98%EC%84%9C) 기준선
> **Version**: v1.0 | **Updated**: 2026-05-18

---

## 1. 책임 범위

Synapse의 **학습 도메인** + **AI 컴퓨트** 담당. SRS 기반 카드 학습과 LLM 기반 카드 자동 생성/시맨틱 검색/Q&A.

| 포함 서비스 | 언어 | Wiki 03.2.4 책임 |
|------------|------|-----------------|
| **Card Service** | Java/Spring Boot 4 | 카드/덱 CRUD, SRS 스케줄링 (SM-2), 복습 큐/제출, 세션 |
| **AI Service** | Python/FastAPI | 카드 자동 생성, 시맨틱 검색, 하이브리드 검색, Q&A (RAG), 시맨틱 캐시, 사용량 추적 |

⚠️ **폴리글랏 레포** — 단일 GitHub 레포에 Java 모듈 + Python 모듈 공존.

---

## 2. 레포 구조 (폴리글랏)

```
synapse-learning-svc/
├── java/                                # Java 영역 (Gradle)
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   ├── card-service/
│   │   ├── src/main/java/io/synapse/learning/card/
│   │   │   ├── CardApplication.java
│   │   │   ├── domain/
│   │   │   │   ├── card/                # Card Aggregate
│   │   │   │   ├── deck/                # Deck Aggregate
│   │   │   │   ├── review/              # Review + SrsState
│   │   │   │   ├── session/             # ReviewSession
│   │   │   │   └── srs/                 # SM-2 알고리즘
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   │   ├── persistence/         # JPA
│   │   │   │   ├── redis/               # 복습 큐 캐시
│   │   │   │   ├── grpc/                # AI Service 클라이언트
│   │   │   │   └── outbox/
│   │   │   └── interfaces/
│   │   │       ├── rest/
│   │   │       ├── grpc/                # ProgressService 제공 (engagement svc가 호출)
│   │   │       └── kafka/
│   │   └── src/main/resources/
│   ├── learning-common/                 # Java 공통
│   │   └── src/main/java/io/synapse/learning/common/
│   └── proto/                           # gRPC 정의 (java + python 공유)
├── python/                              # Python 영역 (Poetry)
│   ├── pyproject.toml
│   ├── poetry.lock
│   ├── ai_service/                      # FastAPI 앱
│   │   ├── __init__.py
│   │   ├── main.py                      # FastAPI 진입점
│   │   ├── api/                         # REST 엔드포인트
│   │   │   ├── routes/
│   │   │   │   ├── generate.py          # 카드 생성
│   │   │   │   ├── search.py            # 시맨틱/하이브리드 검색
│   │   │   │   ├── qa.py                # RAG Q&A
│   │   │   │   └── embed.py             # 임베딩 생성
│   │   ├── grpc/                        # gRPC 서버
│   │   │   ├── ai_servicer.py
│   │   │   └── server.py
│   │   ├── domain/
│   │   │   ├── card_generator/          # LLM 프롬프트 + 파싱
│   │   │   ├── retriever/               # pgvector + ES 하이브리드
│   │   │   ├── reranker/                # RRF + Cross-encoder
│   │   │   └── cache/                   # 시맨틱 캐시
│   │   ├── infrastructure/
│   │   │   ├── llm/                     # OpenAI/Anthropic 클라이언트
│   │   │   ├── pgvector_repo.py
│   │   │   ├── elasticsearch_repo.py
│   │   │   ├── redis_cache.py
│   │   │   └── usage_tracker.py
│   │   ├── config.py
│   │   └── observability.py
│   ├── tests/
│   └── Dockerfile
├── docker/
│   ├── card-service.Dockerfile
│   └── ai-service.Dockerfile
└── docker-compose.dev.yml
```

### 언어 간 분리 원칙

| 책임 | Java | Python |
|------|------|--------|
| 비즈니스 도메인 로직 | ✅ | ❌ |
| LLM/임베딩 호출 | ❌ | ✅ |
| 사용자 응답 (REST) | ✅ (Card) | ✅ (AI 직결: `/api/v1/ai/**`) |
| 데이터 영속화 | ✅ (도메인) | ✅ (캐시, 사용량) |
| 멤버십/권한 | ✅ | ✅ (Card svc 검증 위임) |

---

## 3. 도메인 모델 핵심

### 3.1 Card Service (Java)

```
Deck (Aggregate Root)
  ├─ DeckSettings
  └─ Cards (1:N)
       └─ Card (Aggregate Root within Deck)
            ├─ CardContent (front, back, cloze, ...)
            ├─ SrsState (interval, ease_factor, due_date)
            └─ ReviewHistory
```

**SM-2 알고리즘 핵심 로직**:

```java
public class Sm2Algorithm {
    
    public SrsState calculateNext(SrsState current, ReviewRating rating) {
        // rating: AGAIN(1) / HARD(2) / GOOD(3) / EASY(4)
        double easeFactor = current.easeFactor();
        int interval = current.interval();
        int repetitions = current.repetitions();
        
        if (rating == ReviewRating.AGAIN) {
            // 실패: 처음부터
            return new SrsState(
                interval: 0,
                easeFactor: Math.max(1.3, easeFactor - 0.2),
                repetitions: 0,
                dueDate: now().plusMinutes(10)
            );
        }
        
        // 성공
        repetitions += 1;
        easeFactor = easeFactor + (0.1 - (4 - rating.value()) * (0.08 + (4 - rating.value()) * 0.02));
        easeFactor = Math.max(1.3, easeFactor);
        
        if (repetitions == 1)      interval = 1;
        else if (repetitions == 2) interval = 6;
        else                       interval = (int) Math.round(interval * easeFactor);
        
        return new SrsState(
            interval, easeFactor, repetitions,
            dueDate: now().plusDays(interval)
        );
    }
}
```

⚠️ FSRS 알고리즘으로 마이그레이션 검토 중 (Phase 2). 03-C의 dual-write 패턴으로 점진 전환 예정.

### 3.2 ReviewSession

```
ReviewSession
  ├─ startedAt, completedAt
  ├─ targetCount
  ├─ reviews (N)
  └─ stats (correctCount, avgTime, ...)
```

세션은 사용자 학습 흐름의 단위 — 통계 + 게임화 트리거.

### 3.3 AI Service (Python)

도메인 모델은 가벼움 (영속 도메인 아님):

```python
@dataclass
class GenerationRequest:
    note_id: UUID
    tenant_id: UUID
    user_id: UUID
    card_types: list[Literal["basic", "cloze"]]
    max_cards: int = 10
    language: str = "ko"

@dataclass
class GeneratedCard:
    front: str
    back: str
    type: Literal["basic", "cloze"]
    source_chunk_id: UUID
    confidence: float
```

영속 데이터:
- `ai_usage_logs`: 토큰 사용량/비용
- `semantic_cache`: 쿼리 임베딩 + 응답 캐시

---

## 4. 외부 인터페이스

### 4.1 REST API (Gateway 경유)

**Card Service** (`/api/v1/cards/**`, `/decks/**`, `/reviews/**`, `/sessions/**`):

| 경로 | 동작 |
|------|------|
| `GET /api/v1/decks` | 덱 목록 |
| `POST /api/v1/decks` | 덱 생성 |
| `GET /api/v1/cards?deckId=` | 카드 목록 |
| `POST /api/v1/cards` | 카드 수동 생성 |
| `GET /api/v1/reviews/due` | 오늘 복습할 카드 (Redis 캐시) |
| `POST /api/v1/reviews` | 복습 제출 + SRS 계산 |
| `POST /api/v1/sessions/start` | 학습 세션 시작 |
| `POST /api/v1/sessions/{id}/complete` | 세션 완료 |

**AI Service** (`/api/v1/ai/**`):

| 경로 | 동작 |
|------|------|
| `POST /api/v1/ai/cards/generate` | 노트 → AI 카드 생성 (server-streaming SSE) |
| `POST /api/v1/ai/search/semantic` | 시맨틱 검색 |
| `POST /api/v1/ai/search/hybrid` | 하이브리드 검색 (BM25 + 벡터, RRF) |
| `POST /api/v1/ai/qa` | RAG Q&A (server-streaming SSE) |

⚠️ Gateway가 직접 `learning-svc-py:8000`으로 라우팅 (Java Card 서비스를 경유하지 않음).

### 4.2 gRPC API

**Card Service 제공** (engagement svc가 호출):
```protobuf
service ProgressService {
  rpc GetStats(GetStatsRequest) returns (ProgressStats);
  rpc GetReviewedToday(ReviewedTodayRequest) returns (ReviewedTodayResponse);
}
```

**AI Service 제공** (knowledge svc, Card svc가 호출):
```protobuf
service AIService {
  rpc Embed(EmbedRequest) returns (EmbedResponse);
  rpc EmbedBatch(EmbedBatchRequest) returns (EmbedBatchResponse);
  rpc GenerateCard(GenerateCardRequest) returns (stream GenerateCardChunk);  // streaming
}
```

⚠️ Python에서 gRPC 서버 구현 시 `grpcio` + `protobuf` 사용. 비동기 처리에 `asyncio` 기반.

### 4.3 Kafka

**Producer (Card Service)**:
- `card.created`
- `card.updated`
- `card.reviewed`  ← engagement 소비
- `card.review.due` ← notification 소비 (일 1회 배치)

**Producer (AI Service)**:
- `ai.generation.completed` ← Card svc가 소비하여 카드 자동 저장
- `ai.usage.recorded` ← billing svc가 소비 (사용량 제한)

**Consumer (Card Service)**:
- `user.deleted` → 해당 사용자 카드 삭제
- `tenant.deleted` → 해당 테넌트 카드 삭제
- `subscription.changed` → Feature Flag (AI 카드 생성 횟수 제한)
- `chunking.completed` → AI 카드 후보 큐 enqueue

**Consumer (AI Service)**:
- `chunk.generated` → 임베딩 생성 (chunking-worker가 gRPC로도 호출하지만 대량 처리 시 비동기)

---

## 5. 데이터 저장소

### 5.1 PostgreSQL (`learning` 스키마)

| 테이블 | 서비스 | 비고 |
|--------|--------|------|
| `decks` | card | RLS |
| `cards` | card | RLS |
| `srs_states` | card | 1:1 with cards |
| `reviews` | card | append-only (Event Sourcing 부분 적용) |
| `review_sessions` | card | 세션 단위 통계 |
| `ai_usage_logs` | ai | 토큰/비용 추적 |
| `semantic_cache` | ai | 쿼리 임베딩 + 응답 |
| `outbox_event` | card | Outbox |
| `processed_events` | card, ai | 멱등성 |

### 5.2 Redis

| 키 패턴 | 서비스 | 용도 | TTL |
|---------|--------|------|-----|
| `card:due:{userId}` | card | 오늘 복습할 카드 ID 리스트 | 1d (00:00 갱신) |
| `card:session:{sessionId}` | card | 진행 중 세션 상태 | 1h |
| `ai:cache:{queryHash}` | ai | 시맨틱 캐시 키 인덱스 | 7d |
| `ai:ratelimit:{userId}` | ai | AI 호출 빈도 제한 | 1m/1h/1d |
| `ai:streaming:{sessionId}` | ai | SSE 진행 상태 | 30s |

### 5.3 pgvector / Elasticsearch

AI Service는 knowledge-svc의 `note_chunks` (pgvector) 를 **읽기 전용** 으로 사용.

쓰기는 chunking-worker → AI Service.EmbedBatch → 결과를 AI Service가 knowledge.NoteService.UpdateChunks로 콜백.

---

## 6. AI Service 세부 설계

### 6.1 LLM 호출 전략

| 작업 | 1차 모델 | Fallback |
|------|---------|----------|
| 카드 생성 | OpenAI `gpt-4o-mini` | Anthropic `claude-3-haiku` |
| Q&A | OpenAI `gpt-4o` | Anthropic `claude-3-5-sonnet` |
| 임베딩 | OpenAI `text-embedding-3-small` | (Fallback 없음, 일관성 중요) |
| Reranker | Cohere `rerank-multilingual-v3.0` | (선택, BM25+벡터 RRF로 대체 가능) |

### 6.2 시맨틱 캐시

```python
async def query_with_cache(query: str, tenant_id: UUID) -> Response:
    query_vec = await embed(query)
    
    # Redis에서 유사 쿼리 후보 조회 (벡터 인덱스)
    similar = await pgvector_repo.find_similar_cached_queries(
        query_vec, tenant_id, top_k=5, threshold=0.95
    )
    
    if similar:
        cached = similar[0]
        if cached.similarity >= 0.95 and is_fresh(cached.created_at):
            return cached.response                 # 캐시 히트
    
    # 캐시 미스 → LLM 호출
    response = await llm.generate(query, retrieved_context)
    await cache_response(query, query_vec, response, tenant_id)
    return response
```

캐시 적중률 모니터링 → 비용 절감 효과 측정.

### 6.3 RAG 파이프라인

```
1. 사용자 쿼리 → 임베딩 생성
2. 검색
   - pgvector: 의미 유사 청크 Top 20
   - Elasticsearch: BM25 청크 Top 20
   - RRF (Reciprocal Rank Fusion) 결합 → Top 10
3. (선택) Cohere Reranker → Top 5
4. LLM 프롬프트 구성 (system + retrieved context + user query)
5. server-streaming 응답
6. 사용량 기록 (토큰, 비용, 모델, 캐시 히트 여부)
```

### 6.4 사용량 제한

플랜별 (Wiki 03.2.3 참조):
- Free: AI 호출 10/day
- Pro: AI 호출 500/month
- Team: AI 호출 1000/month
- Enterprise: 협상

```python
# 호출 전 검사
async def check_quota(user_id: UUID, tenant_id: UUID) -> None:
    plan = await get_plan(tenant_id)
    used = await usage_repo.get_monthly_usage(user_id, tenant_id)
    
    if used >= plan.ai_quota:
        raise QuotaExceededError(...)
```

---

## 7. 빌드 / 배포

### 7.1 Java 빌드

```bash
cd java
./gradlew :card-service:bootJar
```

### 7.2 Python 빌드

```bash
cd python
poetry install --no-dev
poetry run python -m grpc_tools.protoc \
  --python_out=ai_service/grpc/gen \
  --grpc_python_out=ai_service/grpc/gen \
  ../java/proto/synapse/internal/learning/v1/*.proto
```

### 7.3 Docker 이미지

```dockerfile
# docker/card-service.Dockerfile
FROM eclipse-temurin:21-jre-alpine
COPY java/card-service/build/libs/*.jar app.jar
EXPOSE 8080 9090
ENTRYPOINT ["java", "-XX:+UseZGC", "-jar", "/app.jar"]
```

```dockerfile
# docker/ai-service.Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY python/pyproject.toml python/poetry.lock ./
RUN pip install poetry && poetry config virtualenvs.create false && \
    poetry install --no-dev --no-root
COPY python/ai_service ./ai_service
EXPOSE 8000 9090
CMD ["uvicorn", "ai_service.main:app", "--host", "0.0.0.0", "--port", "8000", \
     "--workers", "4", "--loop", "uvloop"]
```

### 7.4 K8s 배포 특성

| 서비스 | 인스턴스 | CPU | Memory | 특이사항 |
|--------|---------|-----|--------|---------|
| card-service | 2~4 | 250m | 512Mi | 일반 Spring Boot |
| ai-service | 2~8 | 1000m | 2Gi | LLM 호출 시 GIL 회피 위해 worker 다수, IPv6 동시 비동기 |

ai-service의 HPA는 **CPU + 큐 lag** 기반.

---

## 8. 관측성

### 8.1 메트릭

| 메트릭 | 서비스 | 라벨 |
|--------|--------|------|
| `card_reviews_total` | card | `rating`, `tenant` |
| `card_sm2_calculation_seconds` | card | - |
| `ai_generation_total` | ai | `model`, `cardType`, `result` |
| `ai_generation_duration_seconds` | ai | `model` |
| `ai_tokens_used_total` | ai | `model`, `type` (input/output), `tenant` |
| `ai_cache_hit_rate` | ai | `queryType` |
| `ai_quota_exceeded_total` | ai | `tenant`, `plan` |

### 8.2 로그 (AI Service Python)

`structlog` 사용, 표준 JSON 포맷 (Wiki 03-A.7.2와 동일):

```python
log.info("ai.generation.completed",
    note_id=note_id, tenant_id=tenant_id, user_id=user_id,
    model="gpt-4o-mini", input_tokens=1234, output_tokens=567,
    cards_generated=5, duration_ms=1200, cache_hit=False)
```

### 8.3 추적

OpenTelemetry — Java는 자동 계측, Python은 `opentelemetry-instrumentation-fastapi` + `opentelemetry-instrumentation-grpc`.

---

## 9. 보안

| 항목 | 구현 |
|------|------|
| 카드/리뷰 접근 | RLS: 본인 데이터만 |
| AI 호출 인증 | JWT (Gateway 통과 후 X-User-Id/X-Tenant-Id 헤더) |
| LLM 응답 sanitize | XSS 방지 (Markdown 렌더 시 클라이언트가 처리, 서버는 `<script>` 등 차단) |
| Prompt Injection 방어 | system prompt 분리, user input은 명확히 구분 |
| OpenAI API Key 노출 방지 | Secrets Manager + Python `pydantic.SecretStr` |
| 사용량 추적 무결성 | `ai_usage_logs`는 append-only |

---

## 10. 로컬 개발

### 10.1 인프라

```bash
docker compose -f docker-compose.dev.yml up -d \
  postgres-pgvector redis kafka schema-registry
```

### 10.2 Card Service

```bash
cd java
./gradlew :card-service:bootRun --args='--spring.profiles.active=dev'
```

### 10.3 AI Service

```bash
cd python
poetry shell
export OPENAI_API_KEY=sk-...                    # 테스트용 (이상값 응답 가능)
export ANTHROPIC_API_KEY=sk-ant-...
poetry run uvicorn ai_service.main:app --reload --port 8000
```

### 10.4 LLM mocking (CI/통합 테스트)

```bash
# OpenAI mock 서버 사용
docker run -p 4010:4010 stoplight/prism mock /spec/openai.yaml
```

또는 `vcr.py` / `respx`로 HTTP 응답 녹화.

### 10.5 테스트

```bash
# Java
./gradlew test integrationTest

# Python
cd python
poetry run pytest                              # 단위
poetry run pytest -m integration               # 통합 (Testcontainers)
poetry run pytest -m e2e                       # E2E (LLM 실제 호출, 별도 환경)
```

---

## 11. 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| SRS due 카드 누락 | TZ 불일치 (UTC ↔ KST) | 모든 timestamp `TIMESTAMPTZ`, 계산은 UTC, 표시만 KST |
| AI 생성 응답 너무 느림 | 컨텍스트 길이 큼 | 청크 Top 5로 제한, max_tokens 줄임 |
| AI 호출 quota 초과 (FREE) | 정상 동작 | UI에서 명확히 안내, Pro 업그레이드 CTA |
| 시맨틱 캐시 부정확 | threshold 너무 낮음 | 0.95 → 0.97 상향 |
| Python gRPC OOM | 동시 요청 많음 | worker 증설 + 메모리 한도 조정 |
| Card → AI gRPC deadline 초과 | AI 응답 30s+ | streaming으로 전환, 클라이언트 SSE 직접 받기 |

---

## 12. 참고 문서

- **Wiki 03_프로젝트_아키텍처_정의서** (Card/AI Service)
- **Wiki 02_ERD_문서** — 학습 도메인 테이블
- **Wiki 04_API_명세서**
- **03-A_통신_운영_상세서** — gRPC streaming, Resilience4j
- **03-B_내부외부_경계_보안_명세** — OpenAI API Key 관리
- **03-C_이벤트_스키마_진화_가이드** — card.reviewed, ai.* 스키마
- [SuperMemo SM-2 Algorithm](https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method)
- [FSRS Algorithm](https://github.com/open-spaced-repetition/fsrs4anki/wiki)
- [Reciprocal Rank Fusion](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf)
