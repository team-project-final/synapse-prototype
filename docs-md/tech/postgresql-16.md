
#### 개요
세계에서 가장 발전된 오픈소스 관계형 데이터베이스로, ACID 트랜잭션, JSONB, CTE, 윈도우 함수, 전문 검색, 파티셔닝 등 엔터프라이즈급 기능을 갖춘 객체-관계형 DBMS이다.

#### 역할
Synapse의 주 데이터베이스(Primary RDBMS)이다. 사용자, 테넌트, 노트, 카드, 복습 이력, 결제, 감사 로그, 커뮤니티, 게임화 데이터의 영구 저장소이다. Row Level Security(RLS)로 테넌트 격리를 DB 레벨에서 강제하고, pgvector 확장으로 AI 임베딩 벡터를 저장·검색한다. 월별 파티셔닝으로 audit_logs와 card_reviews 테이블의 대용량 데이터를 효율적으로 관리한다.

#### 선택 이유
PostgreSQL 16은 논리 복제 성능 개선, 병렬 쿼리 개선, I/O 통계 향상이 포함된 최신 안정 버전이다. pgvector 확장 지원, JSONB 유연성, RLS 기반 멀티 테넌시, 강력한 전문 검색 기능이 Synapse의 모든 데이터 요구사항을 단일 DB 엔진으로 충족시킨다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **PostgreSQL 16** | pgvector, JSONB, RLS, 전문 검색, 파티셔닝 통합 지원 | 수평 확장 제한 (샤딩 복잡) | ✅ 선택 |
| MySQL 8 | 널리 사용됨, 빠른 읽기 | pgvector 미지원, JSONB 성능 낮음, RLS 미지원 | ❌ |
| MongoDB | 유연한 스키마, 수평 확장 | ACID 제한, SQL 미지원, pgvector 없음 | ❌ |
| CockroachDB | 분산 SQL, 수평 확장 | pgvector 미지원, 비용, 복잡성 | ❌ |
| Supabase (managed PG) | 관리형, RLS 내장, pgvector 지원 | 벤더 종속, 대규모 비용 | 장기 검토 |

#### 기술적 이점
- **Row Level Security**: `CREATE POLICY`로 테넌트 격리를 애플리케이션 대신 DB 레벨에서 강제
- **JSONB**: 반정형 데이터(카드 메타데이터, 설정값)를 스키마 변경 없이 저장
- **CTE (Common Table Expressions)**: 복잡한 계층 쿼리를 가독성 있게 표현
- **병렬 쿼리**: 대용량 분석 쿼리를 멀티 CPU 코어로 가속
- **논리 복제**: Read Replica로 읽기 부하 분산

#### 핵심 기능
- **MVCC**: 읽기가 쓰기를 차단하지 않는 동시성 제어
- **파티셔닝**: 범위/목록/해시 파티션으로 대용량 테이블 관리
- **전문 검색**: `tsvector` / `tsquery` + GIN 인덱스
- **확장 시스템**: `pgvector`, `pg_trgm`, `pgcrypto`, `uuid-ossp`
- **LISTEN/NOTIFY**: PostgreSQL 기반 이벤트 알림

#### 프로젝트 내 사용 위치
- 모든 Spring Boot 서비스의 주 데이터베이스
- `synapse-learning-svc/learning-ai/app/services/rag_service.py` — pgvector 임베딩 검색
- AWS RDS PostgreSQL 16 (프로덕션) / Docker PostgreSQL 16-alpine (개발)

#### 설정 가이드

```sql
-- 멀티 테넌시: Row Level Security 설정
-- 테넌트 격리 정책 — notes 테이블
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY notes_tenant_isolation ON notes
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- 현재 테넌트 설정 (Spring Boot에서 매 요청마다 실행)
-- SET app.current_tenant_id = '550e8400-e29b-41d4-a716-446655440000';

-- card_reviews 월별 파티셔닝
CREATE TABLE card_reviews (
    id          UUID NOT NULL DEFAULT gen_random_uuid(),
    card_id     UUID NOT NULL,
    tenant_id   UUID NOT NULL,
    user_id     UUID NOT NULL,
    rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 4),
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (reviewed_at);

-- 월별 파티션 생성 (Flyway 마이그레이션으로 자동 생성)
CREATE TABLE card_reviews_2026_01
    PARTITION OF card_reviews
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE card_reviews_2026_02
    PARTITION OF card_reviews
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- audit_logs 월별 파티셔닝
CREATE TABLE audit_logs (
    id          UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    actor_id    UUID,
    action      VARCHAR(100) NOT NULL,
    resource    VARCHAR(100) NOT NULL,
    payload     JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);
```

```sql
-- UUID v7 생성 함수 (시간 순서 보장)
CREATE OR REPLACE FUNCTION generate_uuid_v7()
RETURNS UUID AS $$
DECLARE
    unix_ts_ms BIGINT;
    uuid_bytes BYTEA;
BEGIN
    unix_ts_ms := EXTRACT(EPOCH FROM clock_timestamp()) * 1000;
    uuid_bytes := decode(lpad(to_hex(unix_ts_ms), 12, '0') ||
                        encode(gen_random_bytes(10), 'hex'), 'hex');
    -- Version 7, Variant 10
    uuid_bytes := set_byte(uuid_bytes, 6,
        (get_byte(uuid_bytes, 6) & 15) | 112);
    uuid_bytes := set_byte(uuid_bytes, 8,
        (get_byte(uuid_bytes, 8) & 63) | 128);
    RETURN encode(uuid_bytes, 'hex')::UUID;
END;
$$ LANGUAGE plpgsql;
```

```yaml
# PostgreSQL 성능 설정 (postgresql.conf)
# AWS RDS db.t3.large (2 vCPU, 8GB RAM) 기준
max_connections = 200
shared_buffers = 2GB               # RAM의 25%
effective_cache_size = 6GB         # RAM의 75%
work_mem = 16MB                    # 복잡한 정렬/해시에 사용
maintenance_work_mem = 512MB       # VACUUM, CREATE INDEX
wal_buffers = 64MB
checkpoint_completion_target = 0.9
random_page_cost = 1.1             # SSD 스토리지
effective_io_concurrency = 200     # SSD 병렬 I/O
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| RLS 정책 미적용 | `SET app.current_tenant_id` 미실행 | Spring Interceptor에서 매 요청마다 설정 확인 |
| 파티션 프루닝 미동작 | `enable_partition_pruning = off` | `SET enable_partition_pruning = on` (기본값) |
| 느린 전문 검색 | GIN 인덱스 미생성 | `CREATE INDEX ... USING GIN(to_tsvector(...))` |
| VACUUM 락 | 대용량 테이블 VACUUM FULL | `VACUUM` (FULL 없이) + autovacuum 튜닝 |
| 연결 수 초과 | 서비스 증가로 max_connections 초과 | PgBouncer 커넥션 풀러 도입 |
| UUID v7 생성 성능 | 함수 호출 오버헤드 | Hibernate `@UuidGenerator(TIME)` 사용 (Java 측 생성) |

#### 참고 자료
- PostgreSQL 16 릴리스 노트: https://www.postgresql.org/docs/16/release-16.html
- Row Level Security: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- 파티셔닝: https://www.postgresql.org/docs/current/ddl-partitioning.html
- PostgreSQL 성능 튜닝: https://pgtune.leopard.in.ua

---
