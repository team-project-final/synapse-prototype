
#### 개요
데이터베이스 스키마 변경을 버전 관리하는 오픈소스 마이그레이션 도구로, SQL 또는 Java 기반 마이그레이션 스크립트를 순서대로 실행하고 이력을 관리한다.

#### 역할
Synapse의 PostgreSQL 스키마 변경 이력 관리 전담 도구이다. 서비스 시작 시 미적용 마이그레이션을 자동 실행하여 코드와 DB 스키마의 동기화를 보장한다. Kubernetes 환경에서 여러 파드가 동시 시작할 때 분산 락으로 마이그레이션 중복 실행을 방지한다.

#### 선택 이유
Spring Boot Auto-configuration으로 별도 설정 없이 통합되며, 마이그레이션 이력을 `flyway_schema_history` 테이블에 기록하여 추적 가능성을 보장한다. Liquibase 대비 단순한 SQL 파일 기반 접근으로 팀 학습 곡선이 낮다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **Flyway 10.x** | SQL 기반 단순성, Spring 자동 통합, 분산 락 | XML/YAML 미지원 (SQL/Java만) | ✅ 선택 |
| Liquibase | XML/YAML/JSON/SQL 모두 지원, 롤백 용이 | 복잡한 설정, 높은 학습 곡선 | ❌ |
| Hibernate DDL Auto | 자동 스키마 생성 | 프로덕션 사용 위험, 이력 관리 없음 | ❌ (개발 환경만) |

#### 기술적 이점
- **체크섬 검증**: 기존 마이그레이션 파일 수정 시 오류로 안전 보장
- **분산 락**: K8s 다중 파드 동시 시작 시 중복 방지
- **Baseline**: 기존 DB에 Flyway 도입 시 현재 상태 기준점 설정
- **Repair**: 실패한 마이그레이션 상태 복구 명령

#### 핵심 기능
- `V{version}__{description}.sql` — 버전 마이그레이션
- `R__{description}.sql` — 반복 실행 마이그레이션 (뷰, 함수)
- `flyway_schema_history` — 마이그레이션 이력 테이블

#### 프로젝트 내 사용 위치
- `synapse-note/src/main/resources/db/migration/`
- `synapse-auth/src/main/resources/db/migration/`
- 네이밍 규칙: `V{YYYYMMDD}{NN}__{서비스명}_{설명}.sql`

#### 설정 가이드

```yaml
# application.yml — Flyway 설정
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: false
    validate-on-migrate: true
    out-of-order: false
    schemas: public
    table: flyway_schema_history
```

```sql
-- V20240101_01__note_service_initial_schema.sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE notes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    author_id   UUID NOT NULL,
    title       VARCHAR(500) NOT NULL,
    content     TEXT,
    is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notes_tenant_author ON notes(tenant_id, author_id);
CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC)
    WHERE is_deleted = FALSE;
CREATE INDEX idx_notes_fts ON notes
    USING GIN(to_tsvector('korean', title || ' ' || COALESCE(content, '')));

-- V20240115_01__note_service_add_tags.sql
ALTER TABLE notes ADD COLUMN tags TEXT[] DEFAULT '{}';
CREATE INDEX idx_notes_tags ON notes USING GIN(tags);
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| `Validate failed: checksum mismatch` | 적용된 마이그레이션 파일 수정 | 절대 수정 금지, 새 마이그레이션 파일 추가 |
| K8s에서 마이그레이션 중복 실행 | 여러 파드 동시 시작 | `flyway.lock-retry-count=50` 설정 |
| `OutOfOrder` 오류 | 브랜치 병합 시 버전 충돌 | 버전 번호 날짜+순번 형식으로 충돌 방지 |
| baseline 오류 | 기존 DB에 Flyway 첫 적용 | `baseline-on-migrate=true` 일회성 설정 |

#### 참고 자료
- Flyway 공식: https://flywaydb.org/documentation/
- Spring Boot Flyway: https://docs.spring.io/spring-boot/docs/current/reference/html/howto.html#howto.data-initialization.migration-tool.flyway

---
