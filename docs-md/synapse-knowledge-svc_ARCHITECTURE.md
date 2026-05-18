# synapse-knowledge-svc — ARCHITECTURE

> **Wiki 03번** 기준선 + **03-D 어댑터 표준** 적용
> **Version**: v2.0 | **Updated**: 2026-05-18
> 본 문서는 레포 구조와 platform-svc 패턴(Spring Modulith)을 기반으로 작성됨. README가 아직 부트스트랩 단계이므로 일부는 표준 패턴 추정.

---

## 1. 책임 범위

Synapse의 **지식 도메인** — 노트 작성/관리, 위키링크 기반 그래프, 검색.

| 모듈 (추정) | Wiki 03.2.4 책임 |
|------------|-----------------|
| `note` | 노트 CRUD (Markdown), 위키링크 `[[]]` 파싱, 버전 관리, 첨부파일(S3), Elasticsearch 인덱싱 |
| `graph` | 백링크, 그래프 시각화 데이터, PageRank, 클러스터링 |
| `chunking` | Markdown → 청크 분할 → AI 임베딩 생성 요청 (learning-svc 호출) |
| `shared` | 공통 (TenantContext, Outbox, CloudEvents 등) |

⚠️ AI 임베딩 자체는 **learning-svc(Python)에 위임**. 이 레포는 청크 텍스트 생성 + 결과 저장만.

---

## 2. 레포 구조 (실제)

```
synapse-knowledge-svc/
├── .github/
├── docs/                                   # 아키텍처/가이드 문서
├── gradle/wrapper/
├── src/                                    # 단일 src 폴더
│   ├── main/
│   │   ├── java/io/synapse/knowledge/      # 루트 패키지 (추정)
│   │   │   ├── KnowledgeApplication.java
│   │   │   ├── note/                       # Modulith 모듈 (추정)
│   │   │   ├── graph/                      # Modulith 모듈 (추정)
│   │   │   ├── chunking/                   # Modulith 모듈 (추정)
│   │   │   └── shared/
│   │   └── resources/
│   │       ├── application.yml
│   │       └── db/migration/               # Flyway
│   └── test/
├── build.gradle.kts                        # 단일 빌드 파일
├── settings.gradle.kts
├── README.md
└── SECRETS.md
```

⚠️ 현재 상태: 부트스트랩 초기 (10 commits). README는 "상세 내용은 곧 추가됩니다" — 모듈 구조는 platform-svc의 Spring Modulith 패턴을 따르는 것으로 추정.

---

## 3. Modulith 모듈별 책임 + 03-D Port/Adapter

### 3.1 `note` 모듈

**도메인**: Note (Aggregate), NoteVersion, NoteLink (위키링크), NoteTag, Attachment

**비즈니스 규칙**:
- 본문은 Markdown 텍스트
- 저장 시 위키링크 자동 파싱 → `note_links` 동기화
- 변경 시 이전 버전을 `note_versions`에 보관
- 삭제는 소프트 (`deleted_at`) → 30일 후 하드 삭제

**Inbound**:
- REST: `/api/v1/notes/**`, `/notes/{id}/attachments`, `/search/notes`
- gRPC: `NoteService.GetForLearning` (learning-svc가 카드 생성 시 호출), `NoteService.UpdateChunks` (learning-svc AI가 임베딩 결과 콜백)
- Module API: `NoteApi` (graph 모듈에서 호출)
- Kafka Listener: `user.deleted`, `tenant.deleted`, `subscription.changed`

**Outbound Port → Adapter** (03-D):
| Port (도메인) | Adapter (인프라) | 호출 대상 |
|---------------|-----------------|----------|
| `ObjectStoragePort` | `S3AttachmentAdapter` | AWS S3 (Presigned URL) |
| `SearchIndexPort` | `ElasticsearchIndexAdapter` | Elasticsearch (`notes` 인덱스, nori 분석기) |
| `MarkdownParserPort` | `CommonMarkAdapter` | CommonMark 라이브러리 |
| `WikiLinkParserPort` | `WikiLinkParserAdapter` | 자체 구현 (정규식 + 토큰화) |
| `NoteEventPublisher` | `NoteEventKafkaAdapter` (Outbox) | Kafka |

### 3.2 `graph` 모듈

**도메인**: 별도 Aggregate 없음 (CQRS Read Model). note 모듈의 데이터를 재구성:
- 노드: notes
- 엣지: note_links
- 가중치: `note_pagerank` (일 1회 배치)
- 클러스터: `note_clusters` (Louvain 알고리즘, 주 1회)

**Inbound**:
- REST: `/api/v1/graph/notes/{id}/backlinks`, `/neighborhood`, `/pagerank/top`, `/clusters`
- gRPC: `GraphService.GetBacklinksBatch`
- Cron Job: PageRank (일 1회), Clustering (주 1회)

**Outbound Port → Adapter**:
| Port | Adapter | 호출 대상 |
|------|---------|----------|
| `NoteReadPort` | `NoteApiAdapter` (Modulith 모듈 간) | note 모듈 |
| `GraphAnalyticsPort` | `JpaGraphAdapter` | PostgreSQL (note_links, note_pagerank) |
| `BacklinkCachePort` | `RedisBacklinkAdapter` | Redis (10분 TTL) |

### 3.3 `chunking` 모듈

**도메인**: NoteChunk (note_id, chunk_index, content, token_count, embedding)

**청킹 전략**: 500 토큰 단위 + 50 토큰 overlap (Phase 1)

**Inbound**:
- Kafka Listener: `note.created`, `note.updated`, `note.deleted` (note 모듈 발행)

**처리 흐름**:
```
1. 멱등성 체크 (processed_events)
2. Note 본문 조회 (NoteApi via 모듈 간 호출)
3. Markdown 파싱 + 청킹 (코드 블록/표 보존)
4. 청크 텍스트 저장 (note_chunks, embedding=NULL)
5. learning-svc AIService.Embed 호출 (gRPC, batch)
6. 임베딩 결과를 note_chunks에 UPDATE
7. processed_events 기록
```

**Outbound Port → Adapter**:
| Port | Adapter | 호출 대상 |
|------|---------|----------|
| `NoteReadPort` | `NoteApiAdapter` | note 모듈 |
| `ChunkRepository` (도메인 Port) | `JpaChunkAdapter` | PostgreSQL/pgvector |
| `AIEmbeddingPort` | `AIServiceGrpcAdapter` | **learning-svc gRPC** |
| `ChunkingEventPublisher` | `ChunkingEventKafkaAdapter` | Kafka (`chunk.generated`) |

### 3.4 `shared` 모듈

공통 인프라:
- TenantContext + Interceptor (RLS — Wiki 03.3)
- Outbox 공통 (03-A.6)
- CloudEvents 빌더/파서
- OpenTelemetry 설정
- Idempotency Helper

---

## 4. 외부 인터페이스 요약

### 4.1 REST (Gateway 경유)

| 경로 | 모듈 | 비고 |
|------|------|------|
| `/api/v1/notes/**` | note | CRUD, 버전, 위키링크 목록 |
| `/api/v1/notes/{id}/attachments` | note | Presigned URL 발급 |
| `/api/v1/search/notes` | note | Elasticsearch 풀텍스트 |
| `/api/v1/graph/notes/{id}/backlinks` | graph | 백링크 |
| `/api/v1/graph/notes/{id}/neighborhood` | graph | 인접 그래프 |
| `/api/v1/graph/pagerank/top` | graph | 중요 노트 Top N |
| `/api/v1/graph/clusters` | graph | 클러스터 목록 |

상세는 Wiki 04 참조.

### 4.2 gRPC (Internal)

```protobuf
service NoteService {
  rpc GetForLearning(GetForLearningRequest) returns (NoteForLearning);  // learning-svc 호출
  rpc UpdateChunks(UpdateChunksRequest) returns (UpdateChunksResponse); // learning-svc AI 콜백
}

service GraphService {
  rpc GetBacklinksBatch(BacklinksBatchRequest) returns (BacklinksBatchResponse);
}
```

### 4.3 Kafka

**Producer** (Outbox):
- `note.created`, `note.updated`, `note.deleted` (note 모듈)
- `graph.notes.linked` (note 모듈 — 위키링크 파싱 결과)
- `chunk.generated` (chunking 모듈)

**Consumer**:
- `note.*` → chunking 모듈 (내부 모듈이지만 Kafka 경유로 디커플링)
- `user.deleted`, `tenant.deleted`, `subscription.changed` → note 모듈

---

## 5. 데이터 저장소

### 5.1 PostgreSQL + pgvector

| 테이블 | 모듈 | 비고 |
|--------|------|------|
| `notes` | note | RLS, soft delete |
| `note_versions` | note | 최근 50개 유지 |
| `note_links` | note | INDEX(source_note_id), INDEX(target_note_id) |
| `note_tags` | note | M:N |
| `note_attachments` | note | S3 키 참조 |
| `note_chunks` | chunking | `embedding vector(N)`, HNSW INDEX |
| `note_pagerank` | graph | 일 1회 갱신 |
| `note_clusters` | graph | 주 1회 갱신 |
| `outbox_event` | 모든 모듈 | 03-A.6 |
| `processed_events` | 모든 모듈 | 멱등성 |

### 5.2 pgvector 인덱스 (HNSW)

```sql
CREATE INDEX idx_note_chunks_embedding
  ON note_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### 5.3 Elasticsearch (8.x + nori)

- 인덱스: `notes` (테넌트 필터)
- 필드: `tenant_id`(keyword), `title`(nori), `content`(nori), `tags`(keyword)
- 동기화: note 모듈의 Kafka `note.*` Listener가 indexer에 라우팅

### 5.4 Redis

| 키 패턴 | 모듈 | TTL |
|---------|------|-----|
| `note:hot:{noteId}` | note | 5m |
| `graph:backlinks:{noteId}` | graph | 10m |
| `graph:neighborhood:{noteId}` | graph | 5m |

### 5.5 S3

- 버킷: `synapse-attachments-{env}`
- 키: `{tenant_id}/{note_id}/{attachment_id}/{filename}`
- 업로드: Presigned PUT URL (서버 미경유)
- 다운로드: Presigned GET URL (TTL 1h)

---

## 6. 외부 의존성

이 레포는 **외부 SaaS API를 직접 호출하지 않음**. AI 임베딩은 learning-svc 경유.

| 호출 대상 | 방식 | 위치 |
|----------|------|------|
| learning-svc `AIService.Embed` | gRPC | chunking 모듈의 `AIServiceGrpcAdapter` |
| platform-svc `AuthService.Introspect` | gRPC | shared 모듈 (모든 REST에서 사용) |
| S3 | AWS SDK | note 모듈의 `S3AttachmentAdapter` |
| Elasticsearch | Java REST Client | note 모듈의 `ElasticsearchIndexAdapter` |

---

## 7. 빌드 / 배포

### 7.1 빌드

```bash
./gradlew build
./gradlew test
./gradlew test --tests "*ModuleStructureTest"
```

### 7.2 Docker

단일 이미지: `ghcr.io/team-project-final/synapse-knowledge-svc:{version}`

### 7.3 K8s

- 단일 Deployment
- HPA: CPU + Kafka consumer lag (chunking 모듈) 기반

---

## 8. 관측성

### 8.1 메트릭

| 메트릭 | 모듈 | 라벨 |
|--------|------|------|
| `note_operations_total` | note | `operation`, `tenant` |
| `note_search_duration_seconds` | note | `searchType` |
| `chunking_processed_total` | chunking | `result` |
| `chunking_duration_seconds` | chunking | - |
| `graph_pagerank_duration_seconds` | graph | - |
| `elasticsearch_sync_lag_seconds` | note | - |

### 8.2 알람

- ES 인덱스 lag > 60s
- chunking Kafka lag > 1000
- PageRank 배치 실패

---

## 9. 보안

| 항목 | 구현 |
|------|------|
| 노트 접근 | RLS: `tenant_id` + `user_id` |
| 첨부파일 | S3 Presigned URL + 서버 권한 재확인 |
| 위키링크 권한 | 표시는 자유, 클릭 시 권한 검증 |
| Markdown XSS | 서버 sanitize (위험 태그 제거) |
| AI 호출 시 컨텍스트 격리 | TenantContext propagation을 gRPC metadata로 전파 |

---

## 10. 로컬 개발

### 10.1 인프라

```bash
docker compose -f docker-compose.dev.yml up -d \
  postgres-pgvector elasticsearch redis kafka schema-registry minio
```

- `pgvector/pgvector:pg16`
- Elasticsearch 8.x + nori
- MinIO (S3 호환)

### 10.2 초기화

```bash
./gradlew flywayMigrate
./scripts/init-elasticsearch.sh
mc mb minio/synapse-attachments-dev
```

### 10.3 실행

```bash
./gradlew bootRun --args='--spring.profiles.active=local'
```

---

## 11. 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| pgvector 쿼리 느림 | HNSW 인덱스 누락 또는 `ef_search` 낮음 | `SET hnsw.ef_search = 100` |
| ES 검색 결과 누락 | 인덱싱 lag | Consumer lag 확인, 강제 reindex |
| 위키링크 깨짐 (노트 이름 변경 시) | `note.updated` 처리 누락 | backlink 갱신 트리거 확인 |
| 청크 너무 많음 | 노트 큼 + overlap 큼 | 청크 크기 정책 재검토 |
| PageRank 이상값 | 그래프가 너무 sparse | 최소 임계치(노드 10+) 적용 |

---

## 12. 안티패턴 (03-D)

- ❌ Controller가 Elasticsearch RestClient 직접 호출 — `SearchIndexPort` 경유
- ❌ chunking 모듈이 learning-svc gRPC stub 직접 import — `AIEmbeddingPort` 경유
- ❌ graph 모듈이 `note.internal.NoteRepository` 직접 import — `NoteApi` (모듈 API) 사용
- ❌ S3 키를 도메인 Aggregate에 노출 — Attachment VO 안에 캡슐화
- ❌ pgvector 쿼리를 도메인 서비스에서 직접 작성 — Repository로 추출

---

## 13. 현재 상태

- 부트스트랩 초기 단계 (10 commits)
- README 상세 내용 추가 예정
- 본 ARCHITECTURE는 platform-svc의 패턴 기반 추정 포함

---

## 14. 참고

- **Wiki 03** (Note/Graph/AI 서비스)
- **Wiki 02** — 테이블 ERD
- **Wiki 04** — REST API
- **03-A** — gRPC, Outbox, 멱등성
- **03-B** — RLS, mTLS
- **03-C** — note.* 이벤트 스키마
- **03-D** — Port/Adapter 표준
- [pgvector HNSW](https://github.com/pgvector/pgvector)
- [Elasticsearch nori](https://www.elastic.co/guide/en/elasticsearch/plugins/current/analysis-nori.html)
- [CommonMark Spec](https://commonmark.org/)
