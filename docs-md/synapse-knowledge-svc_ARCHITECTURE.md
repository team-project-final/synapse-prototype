# synapse-knowledge-svc — ARCHITECTURE

> **Synapse Wiki**: [03_프로젝트_아키텍처_정의서](https://github.com/team-project-final/documents/wiki/03_%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8_%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98_%EC%A0%95%EC%9D%98%EC%84%9C) 기준선
> **Version**: v1.0 | **Updated**: 2026-05-18

---

## 1. 책임 범위

Synapse의 **지식 그래프 도메인** 담당. 노트 작성/관리 + 위키링크 기반 그래프 + 검색을 위한 청킹/임베딩.

| 포함 서비스 | Wiki 03.2.4 책임 |
|------------|-----------------|
| **Note Service** | 노트 CRUD (Markdown), 위키링크 `[[링크]]` 파싱, 버전 관리, 첨부파일(S3) |
| **Graph Service** | 백링크 조회, 그래프 시각화 데이터, PageRank, 클러스터링 |
| **Chunking Worker** | Kafka 컨슈머 — 노트 → 청크 분할 → 임베딩 생성 요청 |

⚠️ **AI 임베딩 자체는 learning-svc(Python)에 위임**. 이 레포는 청크 텍스트 생성 + 결과 저장만 담당.

---

## 2. 레포 구조 (Gradle 멀티모듈)

```
synapse-knowledge-svc/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle/libs.versions.toml
├── knowledge-common/                   # 공통 모듈
│   ├── src/main/java/io/synapse/knowledge/common/
│   │   ├── markdown/                   # Markdown 파서 (CommonMark)
│   │   ├── wikilink/                   # [[링크]] 파서
│   │   ├── chunking/                   # 청킹 알고리즘
│   │   ├── tenant/
│   │   ├── outbox/
│   │   └── observability/
├── note-service/                       # 독립 Spring Boot 앱
│   ├── src/main/java/io/synapse/knowledge/note/
│   │   ├── NoteApplication.java
│   │   ├── domain/
│   │   │   ├── note/                   # Note Aggregate
│   │   │   ├── version/                # NoteVersion
│   │   │   ├── link/                   # NoteLink (위키링크)
│   │   │   └── attachment/             # Attachment
│   │   ├── application/
│   │   ├── infrastructure/
│   │   │   ├── persistence/            # JPA
│   │   │   ├── elasticsearch/          # 검색 인덱서
│   │   │   ├── s3/                     # 첨부파일 업로드
│   │   │   └── outbox/
│   │   └── interfaces/
│   │       ├── rest/
│   │       ├── grpc/                   # NoteService gRPC (Card svc가 호출)
│   │       └── kafka/                  # (구독: user.deleted 등)
│   └── src/main/resources/
├── graph-service/                      # 독립 Spring Boot 앱
│   ├── src/main/java/io/synapse/knowledge/graph/
│   │   ├── GraphApplication.java
│   │   ├── domain/
│   │   ├── application/
│   │   │   ├── pagerank/               # PageRank 알고리즘
│   │   │   └── clustering/             # 커뮤니티 검출
│   │   ├── infrastructure/
│   │   └── interfaces/
│   └── src/main/resources/
└── chunking-worker/                    # 독립 Spring Boot 앱 (헤드리스)
    ├── src/main/java/io/synapse/knowledge/chunking/
    │   ├── ChunkingApplication.java
    │   ├── application/
    │   │   ├── chunker/                # 텍스트 분할 로직
    │   │   └── orchestrator/           # AI svc 호출 흐름
    │   ├── infrastructure/
    │   │   ├── kafka/                  # note.created/updated 소비
    │   │   ├── grpc/                   # learning-svc AI 호출
    │   │   └── persistence/            # note_chunks 저장
    │   └── interfaces/
    │       └── kafka/                  # 컨슈머 진입점
    └── src/main/resources/
```

### 모듈 의존성

```
[note-service]      ─┐
[graph-service]     ─┼→ [knowledge-common] ─→ [synapse-shared]
[chunking-worker]   ─┘
```

---

## 3. 도메인 모델 핵심

### 3.1 Note Aggregate

```
Note (Aggregate Root)
  ├─ NoteVersion (version histroy)
  ├─ NoteLink (위키링크: source_note_id → target_note_title|id)
  ├─ Tag (M:N)
  └─ Attachment (S3 키 참조)
```

**Aggregate Root**: `Note`

비즈니스 규칙:
- 노트 본문은 Markdown 텍스트로 저장
- 저장 시 위키링크 자동 파싱 → `note_links` 동기화
- 변경 시 이전 버전을 `note_versions`에 보관
- 노트 삭제는 **소프트 삭제** (`deleted_at` 설정) → 30일 후 하드 삭제

### 3.2 Graph 도메인 (CQRS Read-only)

Graph Service는 별도 Aggregate 보유하지 않음. Note Service의 데이터를 **Read Model**로 재구성:
- 노드: notes 테이블 (제목, ID, 태그)
- 엣지: note_links 테이블
- 가중치: PageRank 결과 (별도 `note_pagerank` 테이블, 일 1회 배치 갱신)
- 클러스터: `note_clusters` 테이블 (Louvain 알고리즘)

### 3.3 NoteChunk

```
NoteChunk
  ├─ note_id (FK)
  ├─ chunk_index
  ├─ content (텍스트)
  ├─ token_count
  ├─ embedding (vector, pgvector)
  └─ created_at
```

청킹 전략 (Phase 1): 500 토큰 단위 + 50 토큰 overlap.

---

## 4. 외부 인터페이스

### 4.1 REST API (Gateway 경유)

| 경로 | 서비스 | 주요 동작 |
|------|--------|----------|
| `/api/v1/notes/**` | note-service | CRUD, 버전 조회, 검색, 위키링크 목록 |
| `/api/v1/notes/{id}/attachments` | note-service | Presigned URL 발급 (직접 S3 업로드) |
| `/api/v1/search/notes` | note-service | Elasticsearch 풀텍스트 검색 |
| `/api/v1/graph/notes/{id}/backlinks` | graph-service | 백링크 목록 |
| `/api/v1/graph/notes/{id}/neighborhood` | graph-service | 인접 그래프 데이터 |
| `/api/v1/graph/pagerank/top` | graph-service | 중요 노트 Top N |
| `/api/v1/graph/clusters` | graph-service | 클러스터 목록 |

Wiki 04번 API 명세서 참조.

### 4.2 gRPC API (내부 전용)

```protobuf
// synapse-shared/proto/synapse/internal/knowledge/v1/note_service.proto
service NoteService {
  // Card Service가 카드 생성 시 호출
  rpc GetForLearning(GetForLearningRequest) returns (NoteForLearning);
  
  // AI Service가 청크 임베딩 결과 저장 시 호출
  rpc UpdateChunks(UpdateChunksRequest) returns (UpdateChunksResponse);
}

message NoteForLearning {
  string note_id = 1;
  string tenant_id = 2;
  string title = 3;
  string content_markdown = 4;
  repeated string tags = 5;
  repeated ChunkRef chunks = 6;
}
```

```protobuf
// graph_service.proto
service GraphService {
  rpc GetBacklinksBatch(BacklinksBatchRequest) returns (BacklinksBatchResponse);
}
```

### 4.3 Kafka

**Producer**:
- `note.created` ← note-service
- `note.updated` ← note-service
- `note.deleted` ← note-service
- `graph.notes.linked` ← note-service (위키링크 파싱 결과)

**Consumer**:
- `user.deleted` → note-service (해당 사용자 노트 일괄 삭제)
- `tenant.deleted` → note-service (테넌트 노트 전체 삭제)
- `subscription.changed` → note-service (Feature Flag: 노트 최대 개수 제한)
- `note.created` / `note.updated` → chunking-worker (청킹 처리)
- `note.deleted` → chunking-worker (청크 + 임베딩 삭제)

상세 페이로드는 Wiki 03.4 + 03-C 참조.

---

## 5. 데이터 저장소

### 5.1 PostgreSQL (`knowledge` 스키마)

| 테이블 | 용도 | 비고 |
|--------|------|------|
| `notes` | 노트 본문 (Markdown) | RLS 적용 |
| `note_versions` | 버전 이력 | 최근 50개만 유지 |
| `note_links` | 위키링크 (source → target) | 검색용 INDEX |
| `note_tags` | 태그 매핑 | M:N |
| `note_chunks` | 청크 + pgvector 임베딩 | HNSW INDEX |
| `note_attachments` | S3 키 + 메타데이터 | 본체는 S3 |
| `note_pagerank` | PageRank 점수 캐시 | 일 1회 갱신 |
| `note_clusters` | 클러스터 결과 | 주 1회 갱신 |
| `outbox_event` | Outbox 패턴 | 03-A.6 참조 |
| `processed_events` | 멱등성 | 03-A.5.3 참조 |

### 5.2 pgvector 인덱스 설정

```sql
CREATE INDEX idx_note_chunks_embedding 
  ON note_chunks 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

검색 쿼리:
```sql
SELECT note_id, chunk_index, content,
       1 - (embedding <=> :query_vector) AS similarity
FROM note_chunks
WHERE tenant_id = :tenant_id
ORDER BY embedding <=> :query_vector
LIMIT 20;
```

### 5.3 Elasticsearch

인덱스: `notes-{tenant_id}` 또는 `notes` (전체) + tenant_id 필터.

매핑 (한국어 nori 분석기):
```json
{
  "mappings": {
    "properties": {
      "tenant_id": { "type": "keyword" },
      "user_id": { "type": "keyword" },
      "title": { "type": "text", "analyzer": "nori" },
      "content": { "type": "text", "analyzer": "nori" },
      "tags": { "type": "keyword" },
      "created_at": { "type": "date" },
      "updated_at": { "type": "date" }
    }
  }
}
```

Kafka `note.created/updated/deleted` 컨슈머가 ES 동기화 담당 (note-service 내부 indexer 모듈).

### 5.4 Redis

| 키 패턴 | 용도 | TTL |
|---------|------|-----|
| `note:hot:{noteId}` | 자주 조회되는 노트 캐시 | 5m |
| `graph:backlinks:{noteId}` | 백링크 결과 캐시 | 10m |
| `graph:neighborhood:{noteId}` | 그래프 시각화 데이터 | 5m |

### 5.5 S3

- 버킷: `synapse-attachments-{env}`
- 키 패턴: `{tenant_id}/{note_id}/{attachment_id}/{filename}`
- 업로드: Pre-signed PUT URL 발급 (서버 경유 안 함)
- 다운로드: Pre-signed GET URL (TTL 1시간)

---

## 6. 외부 의존성

### 6.1 다른 svc 호출 (gRPC)

| Caller | Callee | 용도 |
|--------|--------|------|
| `note-service` | `platform/AuthService.Introspect` | JWT 검증 (이미 Gateway에서 처리되나 추가 방어) |
| `chunking-worker` | `learning/AIService.Embed` | 청크 → 임베딩 벡터 |
| `note-service` | `learning/AIService.Embed` (쿼리 시) | 검색 쿼리 임베딩 |

### 6.2 외부 API

이 레포는 직접 외부 API를 호출하지 않음 (Wiki 03번에 따라 AI 호출은 learning-svc 경유).

S3는 AWS SDK 사용 (IRSA로 IAM 인증).

---

## 7. 빌드 / 배포

### 7.1 빌드

```bash
./gradlew clean build                    # 전체 모듈
./gradlew :note-service:bootJar          # 단일 서비스
./gradlew :chunking-worker:bootJar
```

### 7.2 Docker 이미지

각 서비스별 별도 이미지:
- `ghcr.io/team-project-final/note-service:{version}`
- `ghcr.io/team-project-final/graph-service:{version}`
- `ghcr.io/team-project-final/chunking-worker:{version}`

### 7.3 K8s 배포 특성

| 서비스 | 인입 | 특이사항 |
|--------|------|---------|
| note-service | Gateway + gRPC | 일반 Deployment |
| graph-service | Gateway + gRPC | Read 위주, 캐시 적극 활용 |
| chunking-worker | Kafka only (헤드리스) | HTTP 노출 없음, K8s Service 미생성 |

### 7.4 Cron Job (Graph Service)

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: pagerank-batch
spec:
  schedule: "0 3 * * *"                  # 매일 새벽 3시
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: pagerank
              image: ghcr.io/team-project-final/graph-service:{version}
              command: ["java", "-jar", "/app.jar", "--job=pagerank"]
```

---

## 8. 청킹 워커 상세 (chunking-worker)

### 8.1 처리 흐름

```
[Kafka] note.created
   ↓
[chunking-worker]
1. 멱등성 체크 (processed_events)
2. Note 본문 조회 (PostgreSQL)
3. Markdown 파싱 + 코드 블록/표 보존 청킹
4. 청크 텍스트 저장 (note_chunks, embedding은 NULL)
5. learning-svc/AIService.Embed gRPC 호출 (batch)
6. 임베딩 결과를 note_chunks에 UPDATE
7. processed_events 기록
```

### 8.2 실패 시나리오

| 실패 | 처리 |
|------|------|
| AI Service 일시 장애 | Resilience4j Retry (3회) → 실패 시 DLQ |
| 텍스트가 너무 큼 (>50K 토큰) | 청킹 자체는 성공, 임베딩만 보류 (별도 큐) |
| pgvector INSERT 실패 | Transactional 전체 롤백, Kafka offset 미커밋 → 재처리 |

### 8.3 처리량 목표

- 노트 작성 → 청크 임베딩 완료까지 p95 < 10s
- 동시 처리량: 100 노트/초 (concurrency 3, 인스턴스 5)

---

## 9. 관측성

### 9.1 메트릭

| 메트릭 | 서비스 | 라벨 |
|--------|--------|------|
| `note_operations_total` | note | `operation`, `tenant` |
| `note_search_duration_seconds` | note | `searchType` (text/semantic/hybrid) |
| `graph_pagerank_duration_seconds` | graph | - |
| `chunking_processed_total` | chunking | `result` |
| `chunking_duration_seconds` | chunking | - |
| `elasticsearch_sync_lag_seconds` | note | - |

### 9.2 로그 컨텍스트

표준 필드 + 도메인 필드:
```json
{ "noteId":"...", "wordCount":1234, "chunkCount":12 }
```

### 9.3 알람

- ES 인덱스 동기화 lag > 60s → 알람
- 청킹 워커 Kafka lag > 1000 → 알람
- PageRank 배치 실패 → 알람

---

## 10. 보안

| 항목 | 구현 |
|------|------|
| 노트 접근 제어 | RLS: `user_id = current_user_id() AND tenant_id = current_tenant_id()` |
| 첨부파일 접근 | S3 Presigned URL (TTL 1h) + 서버 측 권한 재확인 |
| Markdown XSS | 클라이언트 렌더링이지만 서버에서도 위험 태그 sanitize |
| 위키링크 권한 | 다른 사용자 노트로의 링크는 표시만, 클릭 시 권한 검증 |
| 청크 본문 노출 | RLS 적용, AI Service도 Tenant Context로 격리 |

---

## 11. 로컬 개발

### 11.1 의존 인프라

```bash
docker compose -f docker-compose.dev.yml up -d \
  postgres-pgvector elasticsearch redis kafka schema-registry minio
```

- pgvector: `pgvector/pgvector:pg16`
- Elasticsearch: `8.x` + nori 플러그인
- minio: S3 호환 로컬

### 11.2 초기 설정

```bash
# Flyway 마이그레이션
./gradlew :note-service:flywayMigrate

# Elasticsearch 인덱스 생성 (init script)
./scripts/init-elasticsearch.sh

# MinIO 버킷 생성
mc mb minio/synapse-attachments-dev
```

### 11.3 실행

```bash
./gradlew :note-service:bootRun --args='--spring.profiles.active=dev'
./gradlew :graph-service:bootRun --args='--spring.profiles.active=dev'
./gradlew :chunking-worker:bootRun --args='--spring.profiles.active=dev'
```

### 11.4 샘플 데이터

```bash
# synapse-data-mocking 레포의 스크립트 사용
git clone https://github.com/team-project-final/synapse-data-mocking
cd synapse-data-mocking && npm run seed:knowledge
```

---

## 12. 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| pgvector 쿼리 느림 | HNSW 인덱스 누락 또는 파라미터 부적절 | `EXPLAIN ANALYZE`로 확인, `ef_search` 조정 |
| ES 검색 결과 누락 | 인덱싱 lag | Kafka 컨슈머 lag 확인, 강제 reindex |
| 청크가 너무 많아짐 | 노트 크기 큼 + overlap 큼 | 청크 크기/overlap 정책 재검토 |
| 위키링크 깨짐 | 노트 이름 변경 시 처리 안 됨 | `note.updated` 이벤트에서 backlink 갱신 트리거 |
| PageRank 결과 이상 | 노트 그래프가 너무 sparse | 최소 임계치(예: 노드 10개 이상) 적용 |

---

## 13. 참고 문서

- **Wiki 03_프로젝트_아키텍처_정의서** (Note/Graph/AI 서비스)
- **Wiki 02_ERD_문서** — 테이블 상세
- **Wiki 04_API_명세서**
- **03-A_통신_운영_상세서** — gRPC/Outbox/멱등성
- **03-B_내부외부_경계_보안_명세** — RLS, mTLS
- **03-C_이벤트_스키마_진화_가이드** — note.* 이벤트 스키마
- [pgvector](https://github.com/pgvector/pgvector)
- [Elasticsearch nori](https://www.elastic.co/guide/en/elasticsearch/plugins/current/analysis-nori.html)
- [CommonMark Spec](https://commonmark.org/)
