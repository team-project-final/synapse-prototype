
#### 개요
Apache Lucene 기반의 분산 전문 검색 및 분석 엔진으로, JSON 문서 색인, BM25 스코어링, 복잡한 쿼리 DSL, 집계 분석을 제공한다.

#### 역할
Synapse의 노트/카드 전문 검색 엔진이다. 사용자가 입력한 키워드로 제목, 본문, 태그를 BM25 알고리즘으로 검색하고, nori 한국어 형태소 분석기로 한국어 검색 품질을 향상시킨다. Kafka의 `note.created`, `note.updated`, `note.deleted` 이벤트를 소비하여 비동기적으로 인덱스를 업데이트한다. pgvector 코사인 유사도 검색과 BM25 검색 결과를 RRF(Reciprocal Rank Fusion)로 결합하는 하이브리드 검색의 한 축을 담당한다.

#### 선택 이유
PostgreSQL의 내장 전문 검색(`tsvector`)은 기본 기능은 충분하나, 한국어 형태소 분석, 형광 처리(highlighting), 오타 허용(fuzzy), 자동완성(completion suggester), 패싯 집계(aggregation) 등 Synapse가 목표하는 검색 UX에는 부족하다. Elasticsearch는 이 모든 기능을 제공하며, nori 플러그인으로 한국어 형태소 분석을 지원한다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **Elasticsearch 8** | 최강 전문 검색, nori 한국어 지원, 집계 분석, 광범위한 쿼리 DSL | 운영 복잡도, 메모리 사용량, 라이선스 변경 이력 | ✅ 선택 |
| OpenSearch | AWS 관리형, Elasticsearch fork, 오픈소스 | ES 대비 늦은 기능 반영 | 장기 AWS 마이그레이션 시 검토 |
| Typesense | 빠른 설정, 오픈소스 | 한국어 형태소 분석 제한, 집계 기능 약함 | ❌ |
| Meilisearch | 빠른 설정, 오타 허용 | 한국어 지원 제한, 대규모 문서 성능 | ❌ |
| PostgreSQL FTS | 추가 인프라 없음 | 한국어 형태소 부족, 고급 검색 기능 제한 | ❌ (폴백으로만) |

#### 기술적 이점
- **BM25 스코어링**: TF-IDF 개선 알고리즘으로 관련성 높은 문서 우선 정렬
- **nori 형태소 분석**: "학습하다" → "학습", "학습" 등 어근으로 분석하여 검색 정확도 향상
- **Highlighting**: 검색어 매칭 부분을 `<em>` 태그로 강조 반환
- **Completion Suggester**: 자동완성 제안 기능
- **비동기 인덱싱**: Kafka 이벤트 소비로 Write 성능에 영향 없이 인덱스 업데이트

#### 핵심 기능
- `multi_match` 쿼리: 여러 필드에 걸친 검색
- `bool` 쿼리: must/should/must_not 조합
- `highlight`: 검색어 하이라이팅
- `aggregation`: 태그별, 날짜별 집계
- `index.routing`: 테넌트별 인덱스 분리 또는 라우팅

#### 프로젝트 내 사용 위치
- `synapse-note/src/main/java/search/NoteSearchService.java` — 검색 로직
- `synapse-note/src/main/java/consumer/NoteIndexConsumer.java` — Kafka 이벤트 소비 → ES 인덱싱
- 인덱스: `synapse-notes-{tenantId}` (테넌트별 인덱스) 또는 `synapse-notes` (단일 인덱스 + 라우팅)

#### 설정 가이드

```json
// 노트 인덱스 매핑 — nori 분석기 적용
PUT /synapse-notes
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "analysis": {
      "analyzer": {
        "korean_analyzer": {
          "type": "custom",
          "tokenizer": "nori_tokenizer",
          "filter": [
            "nori_part_of_speech",
            "nori_readingform",
            "lowercase",
            "stop"
          ]
        },
        "korean_search_analyzer": {
          "type": "custom",
          "tokenizer": "nori_tokenizer",
          "filter": ["nori_part_of_speech", "lowercase"]
        }
      },
      "tokenizer": {
        "nori_tokenizer": {
          "type": "nori_tokenizer",
          "decompound_mode": "mixed"
        }
      },
      "filter": {
        "nori_part_of_speech": {
          "type": "nori_part_of_speech",
          "stoptags": ["E", "IC", "J", "MAG", "MAJ", "MM",
                       "SP", "SSC", "SSO", "SC", "SE",
                       "XPN", "XSA", "XSN", "XSV", "UNA",
                       "VSV"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "note_id":    { "type": "keyword" },
      "tenant_id":  { "type": "keyword" },
      "author_id":  { "type": "keyword" },
      "title": {
        "type": "text",
        "analyzer": "korean_analyzer",
        "search_analyzer": "korean_search_analyzer",
        "fields": { "keyword": { "type": "keyword" } }
      },
      "content": {
        "type": "text",
        "analyzer": "korean_analyzer",
        "search_analyzer": "korean_search_analyzer"
      },
      "tags": {
        "type": "keyword"
      },
      "updated_at": { "type": "date" },
      "is_deleted": { "type": "boolean" }
    }
  }
}
```

```java
// NoteSearchService.java — 검색 쿼리
@Service
public class NoteSearchService {

    private final ElasticsearchClient esClient;

    public SearchResponse<NoteDocument> search(
            UUID tenantId, String query, int page, int size) throws IOException {

        return esClient.search(s -> s
            .index("synapse-notes")
            .query(q -> q.bool(b -> b
                .filter(f -> f.term(t -> t
                    .field("tenant_id")
                    .value(tenantId.toString())))
                .filter(f -> f.term(t -> t
                    .field("is_deleted")
                    .value(false)))
                .must(m -> m.multiMatch(mm -> mm
                    .query(query)
                    .fields("title^3", "content^1", "tags^2")  // 필드별 부스팅
                    .type(TextQueryType.BestFields)
                    .fuzziness("AUTO")))
            ))
            .highlight(h -> h
                .fields("title", f -> f.numberOfFragments(0))
                .fields("content", f -> f
                    .numberOfFragments(3)
                    .fragmentSize(150)))
            .from(page * size)
            .size(size),
            NoteDocument.class
        );
    }
}
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| nori 플러그인 없음 오류 | ES 시작 시 플러그인 미설치 | `elasticsearch-plugin install analysis-nori` |
| 검색 결과 없음 (한국어) | analyzer 미설정 | 인덱스 매핑에 `korean_analyzer` 적용 확인 |
| 인덱스 분열(Split) 오류 | Primary shard 수 초과 | 인덱스 재생성 (`reindex` API) |
| Kafka 이벤트 인덱싱 지연 | Consumer lag 증가 | Consumer 파티션 수 증가, 병렬 처리 |
| 힙 메모리 OOM | 대용량 집계 쿼리 | `indices.breaker.total.limit=70%` 조정, 집계 쿼리 최적화 |
| Yellow 상태 (replica unassigned) | 단일 노드에 replica 배치 불가 | 개발: `number_of_replicas: 0`, 프로덕션: 노드 추가 |

#### 참고 자료
- Elasticsearch 8 공식: https://www.elastic.co/guide/en/elasticsearch/reference/8.0/
- nori 분석기: https://www.elastic.co/guide/en/elasticsearch/plugins/current/analysis-nori.html
- BM25: https://www.elastic.co/blog/practical-bm25-part-1-how-shards-affect-relevance-scoring-in-elasticsearch

---
