
#### 개요
검색 증강 생성(RAG)은 LLM의 응답을 외부 지식 기반에서 검색한 관련 문서로 보강하는 아키텍처 패턴이다.

#### 역할 (Synapse 프로젝트 내)
- 사용자의 자연어 질의에 대해 본인의 노트에서 관련 내용을 검색하여 근거 기반 답변 생성
- pgvector 시맨틱 검색과 Elasticsearch BM25 키워드 검색을 결합한 하이브리드 검색 구현
- RRF(Reciprocal Rank Fusion) 알고리즘으로 두 검색 결과를 통합하여 최종 컨텍스트 구성
- 응답에 출처 노트 링크 포함 (인용 투명성)
- 컨텍스트 윈도우 관리: 상위 5개 청크, 최대 4000 토큰

#### 선택 이유
- 순수 LLM 방식 대비 환각(Hallucination) 대폭 감소 — 사용자 본인 노트 기반 응답
- 모델 재훈련 없이 실시간 지식 베이스 업데이트 반영
- 하이브리드 검색으로 시맨틱 + 키워드 양쪽 강점 활용 (한국어 고유명사에 BM25 유리)
- RRF는 복잡한 파라미터 튜닝 없이 안정적인 순위 통합 가능

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **하이브리드 RAG (pgvector + ES + RRF)** | 한국어 정확도, 안정성, 인프라 재사용 | 구현 복잡도 | **선택** |
| 순수 벡터 검색 RAG | 구현 단순 | 키워드 매칭 약함, 고유명사 누락 | 미선택 |
| 순수 BM25 RAG | 키워드 정확, 구현 쉬움 | 의미적 유사도 반영 불가 | 미선택 |
| LlamaIndex / LangChain | 프레임워크 지원, 빠른 구현 | 의존성 과다, 커스터마이징 어려움 | 미선택 |
| Weaviate / Pinecone | 전용 벡터 DB, 성능 | 추가 인프라 비용, 기존 PG 포기 | 미선택 |

#### 기술적 이점
- **하이브리드 검색 정확도**: 시맨틱 검색 단독 대비 Recall@5 약 15% 향상 (내부 테스트)
- **인프라 재사용**: 기존 PostgreSQL + Elasticsearch 활용으로 추가 인프라 비용 없음
- **RRF k=60**: 순위 통합 시 이상값에 강건한 특성, 추가 튜닝 불필요
- **출처 인용**: 답변에 노트 ID와 청크 위치 포함으로 사용자 신뢰도 향상

#### 핵심 기능 및 아키텍처

```
사용자 질의
    ↓
질의 임베딩 생성 (OpenAI text-embedding-3-small)
    ↓
[병렬 검색]
├── pgvector ANN 검색 (cosine similarity, top-20)
│   └── SELECT ... ORDER BY embedding <=> $1 LIMIT 20
└── Elasticsearch BM25 검색 (nori 형태소, top-20)
    └── multi_match query
    ↓
RRF 점수 통합 (k=60)
    RRF(d) = Σ 1/(k + rank_i(d))
    ↓
상위 5개 청크 선택 + 컨텍스트 구성 (최대 4000 토큰)
    ↓
Claude API 호출 (컨텍스트 + 질의 + 인용 지시)
    ↓
출처 노트 링크 포함 응답 반환
```

#### 프로젝트 내 사용 위치
- **AI Service** (FastAPI): `POST /ai/ask` 엔드포인트
- **Note Service** → Kafka → AI Service: 노트 저장 시 자동 임베딩 갱신

#### 설정 가이드

```python
# rag_pipeline.py
RRF_K = 60
TOP_K_RETRIEVAL = 20   # 각 검색기에서 가져올 청크 수
TOP_K_CONTEXT = 5      # 최종 컨텍스트 청크 수
MAX_CONTEXT_TOKENS = 4000

async def hybrid_search(query: str, tenant_id: UUID,
                         user_id: UUID) -> list[Chunk]:
    query_embedding = await embed_query(query)

    # 병렬 검색
    pg_results, es_results = await asyncio.gather(
        pgvector_search(query_embedding, tenant_id, user_id, TOP_K_RETRIEVAL),
        elasticsearch_search(query, tenant_id, user_id, TOP_K_RETRIEVAL)
    )

    # RRF 통합
    scores: dict[str, float] = {}
    chunk_map: dict[str, Chunk] = {}

    for rank, chunk in enumerate(pg_results):
        scores[chunk.id] = scores.get(chunk.id, 0) + 1 / (RRF_K + rank + 1)
        chunk_map[chunk.id] = chunk

    for rank, chunk in enumerate(es_results):
        scores[chunk.id] = scores.get(chunk.id, 0) + 1 / (RRF_K + rank + 1)
        chunk_map[chunk.id] = chunk

    # 상위 K개 반환
    ranked_ids = sorted(scores, key=scores.get, reverse=True)[:TOP_K_CONTEXT]
    return [chunk_map[cid] for cid in ranked_ids]

async def pgvector_search(embedding, tenant_id, user_id, k):
    return await db.fetch("""
        SELECT nc.id, nc.note_id, nc.content, n.title,
               1 - (nc.embedding <=> $1::vector) AS similarity
        FROM note_chunks nc
        JOIN notes n ON n.id = nc.note_id
        WHERE n.tenant_id = $2 AND n.user_id = $3
          AND n.deleted_at IS NULL
        ORDER BY nc.embedding <=> $1::vector
        LIMIT $4
    """, str(embedding), tenant_id, user_id, k)
```

#### 트러블슈팅

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| 관련 청크 미검색 | 임베딩 갱신 지연 (Kafka 처리 딜레이) | 검색 전 마지막 임베딩 타임스탬프 확인 |
| 컨텍스트 토큰 초과 | 청크가 너무 길 경우 | 청크별 토큰 수 계산 후 MAX_CONTEXT_TOKENS 초과 시 잘라냄 |
| 한국어 BM25 품질 저하 | nori 분석기 미적용 | ES 인덱스 `analyzer: nori` 설정 확인 |
| RRF 점수 동점 | 두 검색 모두 같은 순위 | 동점 시 pgvector similarity 우선 정렬 |

#### 참고 자료
- RRF 논문: https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf
- pgvector ANN: https://github.com/pgvector/pgvector#approximate-nearest-neighbor-indexing
- Elasticsearch hybrid search: https://www.elastic.co/guide/en/elasticsearch/reference/current/knn-search.html

---
