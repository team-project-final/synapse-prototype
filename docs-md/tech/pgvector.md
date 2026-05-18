
#### 개요
PostgreSQL의 오픈소스 벡터 유사도 검색 확장으로, 고차원 벡터(임베딩)를 PostgreSQL 테이블에 저장하고 코사인 유사도, L2 거리, 내적 등으로 유사도 검색을 수행한다.

#### 역할
Synapse의 AI 기반 시맨틱 검색과 RAG 파이프라인의 핵심 저장소이다. OpenAI `text-embedding-3-small` 모델로 생성한 1,536차원 노트 임베딩을 `notes_embeddings` 테이블에 저장한다. 사용자 쿼리 임베딩과의 코사인 유사도로 의미적으로 가장 관련 있는 노트를 검색한다. Elasticsearch BM25 전문 검색과 결합한 하이브리드 검색(RRF 알고리즘)을 구현한다.

#### 선택 이유
PostgreSQL 내에서 벡터 검색을 처리함으로써 별도의 벡터 DB(Pinecone, Weaviate, Qdrant) 도입 없이 트랜잭션 일관성을 유지하면서 벡터 검색을 수행할 수 있다. 노트 삭제 시 임베딩도 ON DELETE CASCADE로 자동 삭제되어 데이터 정합성이 보장된다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **pgvector** | PostgreSQL 통합, 트랜잭션 일관성, 추가 인프라 불필요 | 전용 벡터 DB 대비 대규모 성능 | ✅ 선택 |
| Pinecone | 완전 관리형, 대규모 벡터 특화 | 벤더 종속, 비용, PostgreSQL과 분리 | ❌ |
| Weaviate | 오픈소스, 멀티 모달 | 별도 인프라, 운영 복잡도 | ❌ |
| Qdrant | 고성능, Rust 기반, 필터링 강력 | 별도 인프라 | 장기 검토 |
| Elasticsearch kNN | ES와 통합 | 임베딩-노트 트랜잭션 일관성 유지 어려움 | ❌ |

#### 기술적 이점
- **HNSW 인덱스**: 근사 최근접 이웃(ANN) 검색으로 수백만 벡터에서도 빠른 검색
- **IVFFlat 인덱스**: 메모리 효율적 인덱스 (정확도 vs 속도 트레이드오프)
- **트랜잭션 일관성**: 노트 저장과 임베딩 저장이 동일 트랜잭션
- **멀티 테넌시 필터링**: `WHERE tenant_id = ?` 필터와 함께 벡터 검색
- **하이브리드 검색**: SQL 쿼리 내에서 벡터 검색 + BM25 결과 결합 가능

#### 핵심 기능
- `vector(1536)` — 1536차원 벡터 타입 (OpenAI text-embedding-3-small)
- `<=>` — 코사인 거리 연산자
- `<->` — L2 유클리드 거리 연산자
- `<#>` — 내적(음수) 연산자
- `CREATE INDEX USING hnsw` — HNSW 근사 검색 인덱스

#### 프로젝트 내 사용 위치
- `notes_embeddings` 테이블 — 노트 청크별 임베딩 저장
- `synapse-learning-svc/learning-ai/app/services/rag_service.py` — LangChain PGVector 통합
- `synapse-learning-svc/learning-ai/app/services/search_service.py` — 하이브리드 검색

#### 설정 가이드

```sql
-- pgvector 확장 설치
CREATE EXTENSION IF NOT EXISTS vector;

-- 노트 임베딩 테이블
CREATE TABLE notes_embeddings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id     UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tenant_id   UUID NOT NULL,
    chunk_index SMALLINT NOT NULL DEFAULT 0,
    chunk_text  TEXT NOT NULL,
    embedding   vector(1536) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HNSW 인덱스 — 코사인 유사도 검색 최적화
CREATE INDEX idx_notes_embeddings_hnsw
    ON notes_embeddings
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- 테넌트 필터 인덱스
CREATE INDEX idx_notes_embeddings_tenant
    ON notes_embeddings(tenant_id, note_id);

-- Row Level Security
ALTER TABLE notes_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY notes_embeddings_tenant_isolation ON notes_embeddings
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

```sql
-- 시맨틱 검색 쿼리 — 코사인 유사도 상위 5개
-- (LangChain PGVector가 내부적으로 생성하는 쿼리 형식)
SELECT
    ne.note_id,
    ne.chunk_text,
    n.title,
    1 - (ne.embedding <=> $1::vector) AS similarity
FROM notes_embeddings ne
JOIN notes n ON n.id = ne.note_id
WHERE ne.tenant_id = $2::uuid
  AND 1 - (ne.embedding <=> $1::vector) > 0.7   -- 유사도 임계값
ORDER BY ne.embedding <=> $1::vector
LIMIT 5;

-- 하이브리드 검색: pgvector + 전문 검색 결합 (RRF)
WITH vector_results AS (
    SELECT note_id,
           ROW_NUMBER() OVER (ORDER BY embedding <=> $1::vector) AS rank
    FROM notes_embeddings
    WHERE tenant_id = $2::uuid
    LIMIT 20
),
text_results AS (
    SELECT id AS note_id,
           ROW_NUMBER() OVER (
               ORDER BY ts_rank(
                   to_tsvector('korean', title || ' ' || content),
                   plainto_tsquery('korean', $3)
               ) DESC
           ) AS rank
    FROM notes
    WHERE tenant_id = $2::uuid
      AND to_tsvector('korean', title || ' ' || content)
          @@ plainto_tsquery('korean', $3)
    LIMIT 20
)
SELECT COALESCE(v.note_id, t.note_id) AS note_id,
       1.0 / (60 + COALESCE(v.rank, 1000)) +
       1.0 / (60 + COALESCE(t.rank, 1000)) AS rrf_score
FROM vector_results v
FULL OUTER JOIN text_results t ON v.note_id = t.note_id
ORDER BY rrf_score DESC
LIMIT 10;
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| 벡터 검색 느림 (순차 스캔) | HNSW 인덱스 미생성 또는 비활성화 | `EXPLAIN ANALYZE`로 Index Scan 확인, `SET enable_seqscan = off` |
| `ef_search` 낮아 정확도 부족 | 기본 `ef_search=40` | `SET hnsw.ef_search = 100;` 세션 설정 |
| 임베딩 차원 불일치 | OpenAI 모델 변경 | 모델 변경 시 `ALTER COLUMN embedding TYPE vector(새차원)` |
| 트랜잭션 중 임베딩 저장 느림 | HNSW 인덱스 업데이트 비용 | 인덱스 업데이트를 비동기 Kafka 이벤트로 분리 |
| 테넌트 필터 + 벡터 검색 성능 | 필터 후 벡터 검색 순서 | `WHERE tenant_id = ?` 조건을 먼저 평가되도록 인덱스 설계 |

#### 참고 자료
- pgvector GitHub: https://github.com/pgvector/pgvector
- HNSW 인덱스: https://github.com/pgvector/pgvector#hnsw
- LangChain PGVector: https://python.langchain.com/docs/integrations/vectorstores/pgvector/

---
