
#### 개요
LLM API 호출 비용 절감을 위해 의미적으로 유사한 이전 질의의 응답을 재사용하는 캐싱 레이어이다.

#### 역할 (Synapse 프로젝트 내)
- 동일하거나 의미적으로 유사한 AI 질의(코사인 유사도 ≥ 0.95)에 대해 LLM 재호출 없이 캐시된 응답 반환
- 카드 생성 요청: SHA-256 해시 기반 정확 캐시 (TTL 24시간)
- 시맨틱 검색 질의: 벡터 유사도 기반 근사 캐시 (TTL 5분)
- `semantic_cache` Redis 키 공간에 질의 벡터 + 응답 저장
- 캐시 히트 횟수 추적 → 비용 절감 지표 대시보드 반영

#### 선택 이유
- 동일 노트에 대한 반복적인 카드 생성 요청이 많은 패턴에서 비용 절감 효과 극대화
- Redis의 낮은 지연 시간으로 캐시 조회 오버헤드 최소화 (<1ms)
- pgvector를 이용한 캐시 벡터 검색으로 추가 인프라 없이 구현 가능
- 팀/엔터프라이즈 플랜에서 동일 조직 내 유사 질의 공유 캐시로 비용 추가 절감

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **SHA-256 + 코사인 유사도 하이브리드** | 정확 매칭 + 근사 매칭 모두 처리 | 구현 복잡도 | **선택** |
| 단순 키-값 캐시 (정확 매칭만) | 구현 단순 | 재표현된 동일 질의 캐시 미스 | 미선택 |
| GPTCache 라이브러리 | 기능 풍부 | 의존성 과다, 커스터마이징 제한 | 미선택 |
| 캐시 미적용 | 구현 없음 | LLM 비용 무제한 증가 | 미선택 |

#### 기술적 이점
- **비용 절감**: 카드 생성 요청 중 30~40%가 캐시 히트로 예상 (동일 노트 반복 편집 패턴)
- **응답 속도**: 캐시 히트 시 응답 시간 3~5초 → 50ms 이하로 단축
- **비용 가시성**: 절감된 토큰 수 및 비용을 대시보드에서 실시간 확인

#### 핵심 기능

```
[카드 생성 캐시]
요청 수신
  → SHA-256(note_id + user_id + generation_params) 계산
  → Redis GET semantic_cache:{hash}
  → 히트: 캐시 응답 반환 (TTL 갱신)
  → 미스: Claude API 호출 → 응답 저장 (TTL 86400초)

[시맨틱 질의 캐시]
질의 수신
  → 질의 임베딩 생성
  → pgvector에서 코사인 유사도 ≥ 0.95 캐시 검색
  → 히트: 캐시 응답 반환 (TTL 300초)
  → 미스: RAG 파이프라인 실행 → 결과 저장
```

#### 프로젝트 내 사용 위치
- **AI Service** (FastAPI): 모든 LLM 호출 전 캐시 체크 미들웨어
- **Redis 7 Cluster**: 캐시 저장소 (키 공간: `synapse:ai:cache:*`)
- **PostgreSQL** (pgvector): 시맨틱 캐시 벡터 인덱스

#### 설정 가이드

```python
# semantic_cache.py
SIMILARITY_THRESHOLD = 0.95   # 코사인 유사도 임계값
CARD_CACHE_TTL = 86400        # 24시간 (초)
SEARCH_CACHE_TTL = 300        # 5분 (초)

async def get_card_cache(note_id: UUID, params: dict) -> str | None:
    key = f"synapse:ai:cache:card:{hashlib.sha256(
        f'{note_id}{json.dumps(params, sort_keys=True)}'.encode()
    ).hexdigest()}"
    cached = await redis.get(key)
    if cached:
        await redis.incr(f"synapse:ai:cache:hits:card")
        return cached.decode()
    return None

async def set_card_cache(note_id: UUID, params: dict,
                          response: str) -> None:
    key = f"synapse:ai:cache:card:{hashlib.sha256(
        f'{note_id}{json.dumps(params, sort_keys=True)}'.encode()
    ).hexdigest()}"
    await redis.setex(key, CARD_CACHE_TTL, response)

async def get_semantic_query_cache(query_embedding: list[float],
                                    tenant_id: UUID) -> str | None:
    result = await db.fetchrow("""
        SELECT response_text, hit_count
        FROM semantic_query_cache
        WHERE tenant_id = $1
          AND created_at > NOW() - INTERVAL '5 minutes'
          AND 1 - (query_embedding <=> $2::vector) >= $3
        ORDER BY query_embedding <=> $2::vector
        LIMIT 1
    """, tenant_id, str(query_embedding), SIMILARITY_THRESHOLD)

    if result:
        await db.execute("""
            UPDATE semantic_query_cache SET hit_count = hit_count + 1
            WHERE id = $1
        """, result['id'])
        return result['response_text']
    return None
```

#### 트러블슈팅

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| 캐시 히트율 저조 | 임계값 0.95가 너무 엄격 | A/B 테스트로 0.92~0.95 조정 |
| Redis 메모리 과다 | TTL 미설정 또는 대형 응답 | 응답 압축(gzip) 적용, TTL 검토 |
| 잘못된 캐시 응답 | 노트 수정 후 구캐시 반환 | note.updated 이벤트 시 관련 캐시 무효화 |
| pgvector 캐시 인덱스 누락 | 벡터 인덱스 미생성 | `CREATE INDEX ON semantic_query_cache USING ivfflat (query_embedding vector_cosine_ops)` |

#### 참고 자료
- Redis 공식 문서: https://redis.io/docs/manual/keyspace-notifications/
- pgvector 코사인 유사도: https://github.com/pgvector/pgvector#distance-functions

---
