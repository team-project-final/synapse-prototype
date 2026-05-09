# 2. ERD 문서

> **프로젝트명**: Synapse — 통합 학습-지식 그래프 SaaS
> **버전**: v1.0
> **작성일**: 2026-05-07
> **기술 스택**: Spring Boot 4, Flutter 3.x, FastAPI, PostgreSQL 16, Redis, Elasticsearch, Kafka, K8s

---

## 2.1 데이터베이스 설계 원칙

### 멀티테넌시 전략

- **모델**: Pool (단일 DB, 공유 스키마)
- **격리**: Row Level Security (RLS) + 애플리케이션 레벨 tenant_id 강제 필터
- **인덱스 규칙**: 모든 인덱스는 `tenant_id`를 prefix로 포함

### 공통 컬럼 규약

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID (v7) | PK, 시간 순서 보장 |
| tenant_id | UUID | FK → tenants.id, NOT NULL |
| created_at | TIMESTAMPTZ | 생성 시각, DEFAULT now() |
| updated_at | TIMESTAMPTZ | 수정 시각, 트리거 자동 갱신 |
| deleted_at | TIMESTAMPTZ | 소프트 삭제, NULL = 활성 |

---

## 2.2 ERD 다이어그램

### 2.2.1 테넌시/빌링 도메인

```mermaid
erDiagram
    tenants {
        uuid id PK
        varchar(100) name
        varchar(20) plan "free|pro|team|enterprise"
        varchar(20) status "active|suspended|deleted"
        jsonb settings
        timestamptz created_at
        timestamptz updated_at
    }

    tenant_members {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        varchar(20) role "owner|admin|member"
        timestamptz joined_at
        timestamptz created_at
    }

    plan_quotas {
        uuid id PK
        varchar(20) plan_code PK
        varchar(50) resource_type "notes|cards|ai_generations|storage_bytes"
        bigint max_value
        varchar(20) period "monthly|total"
    }

    subscriptions {
        uuid id PK
        uuid tenant_id FK
        varchar(20) plan_code
        varchar(50) stripe_subscription_id
        varchar(20) status "active|past_due|canceled|trialing"
        timestamptz current_period_start
        timestamptz current_period_end
        timestamptz canceled_at
        timestamptz created_at
    }

    usage_counters {
        uuid id PK
        uuid tenant_id FK
        varchar(50) resource_type
        bigint current_value
        bigint max_value
        varchar(20) period
        date period_start
        timestamptz updated_at
    }

    tenants ||--o{ tenant_members : "has"
    tenants ||--o| subscriptions : "subscribes"
    tenants ||--o{ usage_counters : "tracks"
    plan_quotas }o--|| subscriptions : "defines limits"
```

### 2.2.2 인증/사용자 도메인

```mermaid
erDiagram
    users {
        uuid id PK
        varchar(255) email UK
        varchar(100) display_name
        varchar(512) avatar_url
        varchar(20) status "active|suspended|deleted"
        varchar(10) locale "ko|en|ja"
        timestamptz email_verified_at
        timestamptz last_login_at
        timestamptz created_at
        timestamptz updated_at
    }

    oauth_identities {
        uuid id PK
        uuid user_id FK
        varchar(20) provider "google|github|apple|microsoft"
        varchar(255) provider_user_id
        varchar(512) access_token_enc
        varchar(512) refresh_token_enc
        timestamptz expires_at
        timestamptz created_at
    }

    mfa_credentials {
        uuid id PK
        uuid user_id FK
        varchar(20) type "totp"
        varchar(512) secret_enc
        boolean is_active
        timestamptz verified_at
        timestamptz created_at
    }

    refresh_tokens {
        uuid id PK
        uuid user_id FK
        varchar(512) token_hash
        varchar(50) device_fingerprint
        inet ip_address
        timestamptz expires_at
        timestamptz created_at
    }

    user_settings {
        uuid id PK
        uuid user_id FK
        varchar(20) theme "light|dark|system"
        varchar(10) language "ko|en|ja"
        jsonb review_prefs
        timestamptz updated_at
    }

    data_export_jobs {
        uuid id PK
        uuid user_id FK
        uuid tenant_id FK
        varchar(20) status "pending|processing|completed|failed"
        varchar(20) format "json|markdown|csv"
        varchar(512) download_url
        timestamptz expires_at
        timestamptz completed_at
        timestamptz created_at
    }

    users ||--o{ oauth_identities : "authenticates via"
    users ||--o{ mfa_credentials : "secures with"
    users ||--o{ refresh_tokens : "sessions"
    users ||--|| user_settings : "configures"
    %% 알림 설정은 notification_preferences 테이블로 이관 (Notification Service 소유)
    users ||--o{ data_export_jobs : "exports"
    tenant_members }o--|| users : "belongs to"
```

### 2.2.3 노트 도메인

```mermaid
erDiagram
    notes {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        varchar(500) title
        text content_md
        text content_plain "검색용 평문"
        varchar(20) status "active|archived|trashed"
        int word_count
        jsonb metadata
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    note_versions {
        uuid id PK
        uuid note_id FK
        uuid tenant_id FK
        int version_number
        text content_md
        varchar(500) change_summary
        timestamptz created_at
    }

    note_links {
        uuid id PK
        uuid tenant_id FK
        uuid source_note_id FK
        uuid target_note_id FK
        varchar(50) link_type "wikilink|reference|embed"
        varchar(500) context_snippet
        timestamptz created_at
    }

    note_chunks {
        uuid id PK
        uuid note_id FK
        uuid tenant_id FK
        int chunk_index
        text chunk_text
        vector(1536) embedding
        int token_count
        timestamptz created_at
    }

    tags {
        uuid id PK
        uuid tenant_id FK
        varchar(100) name
        varchar(7) color
        timestamptz created_at
    }

    note_tags {
        uuid note_id FK
        uuid tag_id FK
        timestamptz created_at
    }

    attachments {
        uuid id PK
        uuid note_id FK
        uuid tenant_id FK
        varchar(255) filename
        varchar(100) content_type
        bigint size_bytes
        varchar(512) s3_key
        timestamptz created_at
    }

    bookmarks {
        uuid id PK
        uuid user_id FK
        uuid tenant_id FK
        uuid note_id FK
        timestamptz created_at
    }

    notes ||--o{ note_versions : "versioned"
    notes ||--o{ note_links : "links from"
    notes ||--o{ note_links : "links to"
    notes ||--o{ note_chunks : "chunked"
    notes ||--o{ note_tags : "tagged"
    notes ||--o{ attachments : "attaches"
    notes ||--o{ bookmarks : "bookmarked"
    tags ||--o{ note_tags : "applied to"
```

### 2.2.4 카드/SRS 도메인

```mermaid
erDiagram
    card_decks {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        varchar(200) name
        text description
        varchar(7) color
        varchar(20) status "active|archived"
        int card_count
        int new_cards_per_day "기본 20"
        timestamptz created_at
        timestamptz updated_at
    }

    cards {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        uuid deck_id FK
        uuid source_note_id FK "nullable"
        uuid source_chunk_id FK "nullable"
        varchar(20) card_type "basic|cloze|reverse"
        text front_content
        text back_content
        varchar(20) status "new|learning|review|suspended"
        float easiness_factor "SM-2 EF, 기본 2.5"
        int interval_days
        int repetitions
        int lapses
        timestamptz due_date
        timestamptz last_reviewed_at
        timestamptz created_at
        timestamptz updated_at
    }

    card_reviews {
        uuid id PK
        uuid tenant_id FK
        uuid card_id FK
        uuid session_id FK
        int rating "1=again, 2=hard, 3=good, 4=easy"
        int time_spent_ms
        float prev_ef
        float new_ef
        int prev_interval
        int new_interval
        timestamptz reviewed_at
    }

    review_sessions {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        uuid deck_id FK
        int total_cards
        int completed_cards
        int correct_count
        int again_count
        bigint total_time_ms
        varchar(20) status "in_progress|completed|abandoned"
        timestamptz started_at
        timestamptz ended_at
    }

    card_decks ||--o{ cards : "contains"
    cards ||--o{ card_reviews : "reviewed"
    cards }o--o| notes : "sourced from"
    review_sessions ||--o{ card_reviews : "includes"
    card_decks ||--o{ review_sessions : "session for"
```

### 2.2.5 AI/RAG 도메인

```mermaid
erDiagram
    semantic_cache {
        uuid id PK
        uuid tenant_id FK
        varchar(64) query_hash "SHA-256"
        text query_text
        vector(1536) query_embedding
        jsonb result_data
        int hit_count
        timestamptz expires_at
        timestamptz created_at
    }

    llm_usage_logs {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        varchar(50) model "gpt-4o|gpt-4o-mini|text-embedding-3-small"
        varchar(50) operation "card_generate|semantic_search|qa|summarize"
        int input_tokens
        int output_tokens
        int total_tokens
        numeric(10_4) cost_usd
        int latency_ms
        varchar(20) status "success|error|timeout"
        jsonb metadata
        timestamptz created_at
    }

    llm_feedback {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        uuid usage_log_id FK
        int rating "1-5"
        text comment
        varchar(20) feedback_type "quality|relevance|accuracy"
        timestamptz created_at
    }

    llm_usage_logs ||--o{ llm_feedback : "receives"
```

### 2.2.6 감사 도메인

```mermaid
erDiagram
    audit_logs {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        varchar(50) action "note.create|card.review|auth.login|billing.subscribe"
        varchar(50) resource_type "note|card|deck|user|subscription"
        uuid resource_id
        jsonb old_value
        jsonb new_value
        inet ip_address
        varchar(512) user_agent
        timestamptz created_at
    }

    processed_events {
        uuid id PK
        varchar(100) event_id UK "Kafka 메시지 ID"
        varchar(50) topic
        varchar(20) status "processed|failed|skipped"
        int retry_count
        timestamptz processed_at
        timestamptz created_at
    }
```

### 2.2.7 커뮤니티 도메인

```mermaid
erDiagram
    study_groups {
        uuid id PK
        uuid tenant_id FK
        varchar(200) name
        text description
        uuid owner_user_id FK
        int max_members "DEFAULT 30"
        varchar(20) join_type "open|approval|invite"
        varchar(20) status "active|archived|suspended"
        varchar(512) avatar_url
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    study_group_members {
        uuid id PK
        uuid group_id FK
        uuid user_id FK
        uuid tenant_id FK
        varchar(20) role "owner|admin|member"
        varchar(20) status "active|invited|banned"
        timestamptz joined_at
        timestamptz created_at
    }

    shared_decks {
        uuid id PK
        uuid tenant_id FK
        uuid deck_id FK
        uuid shared_by_user_id FK
        varchar(20) share_type "public|group|link"
        uuid target_group_id FK "nullable"
        varchar(20) share_token "nullable, 12-char base62, set only when share_type=link"
        boolean allow_copy
        int download_count "DEFAULT 0"
        numeric(3_2) rating_avg
        int rating_count "DEFAULT 0"
        varchar(20) status "active|reported|removed"
        timestamptz created_at
        timestamptz updated_at
    }

    shared_deck_ratings {
        uuid id PK
        uuid tenant_id FK
        uuid shared_deck_id FK
        uuid user_id FK
        int rating "1-5"
        text comment "nullable"
        timestamptz created_at
    }

    shared_notes {
        uuid id PK
        uuid tenant_id FK
        uuid note_id FK
        uuid shared_by_user_id FK
        varchar(20) share_type "public|group|link"
        uuid target_group_id FK "nullable"
        varchar(20) share_token "nullable, 12-char base62"
        boolean allow_copy
        varchar(20) status "active|reported|removed"
        timestamptz created_at
        timestamptz updated_at
    }

    deck_copies {
        uuid id PK
        uuid tenant_id FK
        uuid original_shared_deck_id FK
        uuid copied_deck_id FK
        uuid user_id FK
        timestamptz created_at
    }

    reports {
        uuid id PK
        uuid tenant_id FK
        uuid reporter_user_id FK
        varchar(50) target_type "shared_deck|shared_note|study_group|user"
        uuid target_id
        varchar(50) reason "spam|abuse|inappropriate|copyright|other"
        text description
        varchar(20) status "pending|reviewed|resolved|dismissed"
        uuid reviewed_by_user_id FK
        timestamptz reviewed_at
        varchar(50) action_taken "nullable"
        timestamptz created_at
    }

    study_groups ||--o{ study_group_members : "has members"
    study_groups }o--|| users : "owned by"
    study_group_members }o--|| users : "belongs to"
    shared_decks }o--|| card_decks : "shares"
    shared_decks }o--|| users : "shared by"
    shared_decks }o--o| study_groups : "shared to group"
    shared_deck_ratings }o--|| shared_decks : "rates"
    shared_deck_ratings }o--|| users : "rated by"
    shared_notes }o--|| notes : "shares"
    shared_notes }o--|| users : "shared by"
    shared_notes }o--o| study_groups : "shared to group"
    deck_copies }o--|| shared_decks : "copied from"
    deck_copies }o--|| users : "copied by"
    reports }o--|| users : "reported by"
    reports }o--o| users : "reviewed by"
```

> **MVP 제외 항목**: `shared_notes.allow_edit` — OT/CRDT 기반 협업 편집이 필요하므로 Phase 3+ 이후 구현 예정.

### 2.2.8 게이미피케이션 도메인

```mermaid
erDiagram
    user_profiles_gamification {
        uuid id PK
        uuid user_id FK
        uuid tenant_id FK
        int level "DEFAULT 1"
        bigint total_xp "DEFAULT 0"
        int current_streak "DEFAULT 0"
        int longest_streak "DEFAULT 0"
        varchar(50) title "nullable"
        varchar(50) avatar_frame "nullable"
        timestamptz created_at
        timestamptz updated_at
    }

    xp_events {
        uuid id PK
        uuid user_id FK
        uuid tenant_id FK
        varchar(50) event_type "review_complete|note_create|card_create|streak_bonus|group_activity|deck_share|first_review|perfect_session"
        int xp_amount
        uuid source_id "nullable"
        varchar(50) source_type "nullable"
        timestamptz created_at
    }

    badges {
        uuid id PK
        varchar(50) code UK
        varchar(100) name
        text description
        varchar(512) icon_url
        varchar(20) category "learning|social|streak|milestone"
        jsonb criteria_json "schema: {type: threshold|count|streak, field: string, value: number, period: all|weekly|monthly}"
        int xp_reward "DEFAULT 0"
        timestamptz created_at
    }

    user_badges {
        uuid id PK
        uuid user_id FK
        uuid tenant_id FK
        uuid badge_id FK
        timestamptz earned_at
        timestamptz created_at
    }

    level_definitions {
        uuid id PK
        int level_number UK
        bigint required_xp
        varchar(50) title
        jsonb rewards_json "nullable"
        timestamptz created_at
    }

    leaderboards {
        uuid id PK
        uuid tenant_id FK
        uuid group_id "nullable"
        varchar(20) scope "global|group|weekly|monthly"
        date period_start
        date period_end
        timestamptz created_at
    }

    leaderboard_entries {
        uuid id PK
        uuid leaderboard_id FK
        uuid user_id FK
        uuid tenant_id FK
        bigint score
        int rank
        timestamptz created_at
        timestamptz updated_at
    }

    user_profiles_gamification ||--|| users : "extends"
    xp_events }o--|| users : "earned by"
    user_badges }o--|| users : "awarded to"
    user_badges }o--|| badges : "instance of"
    leaderboard_entries }o--|| leaderboards : "part of"
    leaderboard_entries }o--|| users : "ranked user"
```

> **리더보드 스코프 주의**: `global` 스코프는 테넌트 전체 기준이며 RLS 정책을 준수합니다 (타 테넌트 데이터 노출 없음).

### 2.2.9 알림 도메인

```mermaid
erDiagram
    notification_templates {
        uuid id PK
        varchar(50) code UK
        varchar(500) title_template
        text body_template
        varchar(20) channel "push|email|in_app"
        varchar(50) category
        timestamptz created_at
    }

    notifications {
        uuid id PK
        uuid user_id FK
        uuid tenant_id FK
        varchar(50) template_code
        varchar(500) title
        text body
        varchar(20) channel "push|email|in_app"
        varchar(50) category "review_reminder|share|group|achievement|system"
        jsonb data_json
        boolean is_read "DEFAULT false"
        timestamptz read_at "nullable"
        timestamptz created_at
    }

    notification_preferences {
        uuid id PK
        uuid user_id FK
        uuid tenant_id FK
        varchar(50) category
        boolean push_enabled "DEFAULT true"
        boolean email_enabled "DEFAULT true"
        boolean in_app_enabled "DEFAULT true"
        time quiet_hours_start "nullable"
        time quiet_hours_end "nullable"
        timestamptz updated_at
    }

    device_tokens {
        uuid id PK
        uuid user_id FK
        uuid tenant_id FK
        varchar(20) platform "ios|android|web"
        varchar(512) token
        boolean is_active "DEFAULT true"
        timestamptz last_used_at
        timestamptz created_at
        timestamptz updated_at
    }

    notifications }o--|| users : "sent to"
    notifications }o--|| notification_templates : "based on"
    notification_preferences }o--|| users : "configured by"
    device_tokens }o--|| users : "registered by"
```

> **data_json 예시**:
> - `review_reminder`: `{"dueCount": 15, "deckName": "프로그래밍"}`
> - `share`: `{"sharedBy": "김시냅스", "deckTitle": "ML기초"}`
> - `achievement`: `{"badgeCode": "STREAK_7", "badgeName": "일주일 전사"}`
> - `group`: `{"groupName": "ML스터디", "action": "new_member"}`

---

## 2.3 인덱스 설계 규칙

### 네이밍 컨벤션

```
idx_{table}_{columns}
uq_{table}_{columns}
```

### 핵심 인덱스

| 테이블 | 인덱스 | 컬럼 | 타입 |
|--------|--------|------|------|
| notes | idx_notes_tenant_user | (tenant_id, user_id, deleted_at) | B-tree |
| notes | idx_notes_tenant_status | (tenant_id, status, updated_at DESC) | B-tree |
| note_links | idx_note_links_target | (tenant_id, target_note_id) | B-tree |
| note_chunks | idx_note_chunks_embedding | (embedding) | IVFFlat (lists=100) |
| cards | idx_cards_tenant_due | (tenant_id, user_id, status, due_date) | B-tree |
| cards | idx_cards_deck | (tenant_id, deck_id, status) | B-tree |
| card_reviews | idx_card_reviews_card | (tenant_id, card_id, reviewed_at DESC) | B-tree |
| audit_logs | idx_audit_tenant_time | (tenant_id, created_at DESC) | B-tree |
| semantic_cache | idx_semantic_cache_hash | (tenant_id, query_hash) | B-tree |
| semantic_cache | idx_semantic_cache_vec | (query_embedding) | HNSW (m=16, ef=64) |
| study_groups | idx_study_groups_tenant | (tenant_id, status, created_at DESC) | B-tree |
| study_groups | idx_study_groups_owner | (tenant_id, owner_user_id) | B-tree |
| study_group_members | idx_sgm_group | (tenant_id, group_id, status) | B-tree |
| study_group_members | idx_sgm_user | (tenant_id, user_id, status) | B-tree |
| uq_sgm_group_user | uq_study_group_members_group_user | (group_id, user_id) | UNIQUE |
| shared_decks | idx_shared_decks_tenant | (tenant_id, share_type, status) | B-tree |
| shared_decks | idx_shared_decks_group | (tenant_id, target_group_id, status) | B-tree |
| shared_decks | idx_shared_decks_token | (share_token) WHERE share_token IS NOT NULL | B-tree |
| shared_notes | idx_shared_notes_tenant | (tenant_id, share_type, status) | B-tree |
| shared_notes | idx_shared_notes_token | (share_token) WHERE share_token IS NOT NULL | B-tree |
| reports | idx_reports_tenant_status | (tenant_id, status, created_at DESC) | B-tree |
| xp_events | idx_xp_events_user | (tenant_id, user_id, created_at DESC) | B-tree |
| user_badges | idx_user_badges_user | (tenant_id, user_id, earned_at DESC) | B-tree |
| leaderboard_entries | idx_lb_entries_leaderboard | (leaderboard_id, rank ASC) | B-tree |
| notifications | idx_notifications_user | (tenant_id, user_id, is_read, created_at DESC) | B-tree |
| device_tokens | idx_device_tokens_user | (tenant_id, user_id, is_active) | B-tree |

### 파티셔닝 전략

```sql
-- audit_logs: 월별 파티셔닝
CREATE TABLE audit_logs (
    ...
) PARTITION BY RANGE (created_at);

CREATE TABLE audit_logs_2026_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- card_reviews: 월별 파티셔닝
CREATE TABLE card_reviews (
    ...
) PARTITION BY RANGE (reviewed_at);
```

---

## 2.4 RLS 정책 예시

### 기본 RLS 정책

```sql
-- notes 테이블 RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY notes_tenant_isolation ON notes
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY notes_user_access ON notes
    FOR ALL
    USING (
        tenant_id = current_setting('app.current_tenant_id')::uuid
        AND (
            user_id = current_setting('app.current_user_id')::uuid
            OR current_setting('app.current_role') = 'admin'
        )
    );
```

### 테넌트 컨텍스트 설정

```sql
-- 요청마다 Gateway에서 설정
SET LOCAL app.current_tenant_id = 'tenant-uuid-here';
SET LOCAL app.current_user_id = 'user-uuid-here';
SET LOCAL app.current_role = 'member';
```

### 커뮤니티 도메인 RLS 정책

```sql
-- shared_decks: tenant_id 격리 + share_type 기반 접근 제어
ALTER TABLE shared_decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY shared_decks_access ON shared_decks
    FOR SELECT
    USING (
        tenant_id = current_setting('app.current_tenant_id')::uuid
        AND status = 'active'
        AND (
            -- public: 테넌트 내 전체 접근
            share_type = 'public'
            -- group: 그룹 멤버만 접근
            OR (share_type = 'group' AND EXISTS (
                SELECT 1 FROM study_group_members sgm
                WHERE sgm.group_id = shared_decks.target_group_id
                  AND sgm.user_id = current_setting('app.current_user_id')::uuid
                  AND sgm.status = 'active'
            ))
            -- link: share_token 일치 시 접근 (애플리케이션 레벨에서 토큰 검증)
            OR share_type = 'link'
            -- 공유자 본인은 항상 접근 가능
            OR shared_by_user_id = current_setting('app.current_user_id')::uuid
        )
    );

-- study_groups: tenant_id 격리 + 멤버 가시성
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY study_groups_access ON study_groups
    FOR SELECT
    USING (
        tenant_id = current_setting('app.current_tenant_id')::uuid
        AND (
            join_type = 'open'
            OR owner_user_id = current_setting('app.current_user_id')::uuid
            OR EXISTS (
                SELECT 1 FROM study_group_members sgm
                WHERE sgm.group_id = study_groups.id
                  AND sgm.user_id = current_setting('app.current_user_id')::uuid
                  AND sgm.status = 'active'
            )
        )
    );

-- notifications: user_id + tenant_id 격리
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_user_isolation ON notifications
    FOR ALL
    USING (
        tenant_id = current_setting('app.current_tenant_id')::uuid
        AND user_id = current_setting('app.current_user_id')::uuid
    );
```

---

## 2.5 데이터 흐름 요약

```
노트 작성 → notes INSERT
         → note_versions INSERT (비동기)
         → note_links UPSERT (위키링크 파싱)
         → note_chunks INSERT (청킹 + 임베딩, 비동기)
         → Elasticsearch 인덱싱 (Kafka)

카드 생성 → cards INSERT
         → card_decks.card_count UPDATE

복습 제출 → card_reviews INSERT
         → cards UPDATE (SM-2 계산)
         → review_sessions UPDATE
         → usage_counters INCREMENT (Kafka)
         → Kafka: card.reviewed 발행

[커뮤니티 도메인]
덱 공유   → shared_decks INSERT
         → Kafka: community.deck.shared 발행
         → Notification Service: 그룹 멤버 알림 생성 (group share_type 시)

노트 공유 → shared_notes INSERT
         → Kafka: community.note.shared 발행

덱 복사   → Community Service → Card Service 내부 API (POST /internal/decks/copy)
         → deck_copies INSERT
         → shared_decks.download_count INCREMENT

그룹 생성 → study_groups INSERT
         → study_group_members INSERT (owner)
         → Kafka: community.group.created 발행

신고 접수 → reports INSERT (중복 신고 방지 + 일 10건 제한 적용)
         → Kafka: community.report.created 발행

[게이미피케이션 도메인]
XP 적립   → xp_events INSERT
         → user_profiles_gamification.total_xp UPDATE
         → 레벨 상승 판정 → level_definitions 조회
         → 배지 판정 (criteria_json 동기 평가)
         → Kafka: gamification.xp.earned 발행
         → Kafka: gamification.badge.earned 발행 (배지 획득 시)
         → Kafka: gamification.level.up 발행 (레벨 업 시)

리더보드  → Cron Job (주간/월간 자동 생성) → leaderboards INSERT
         → leaderboard_entries UPSERT
         → Redis Sorted Set 캐시 갱신

스트릭 관리 → daily Cron Job → current_streak 리셋 (어제 활동 없는 경우)
           → Kafka: gamification.xp.earned (streak_bonus 이벤트)

[알림 도메인]
알림 생성 → Kafka consumer (card.review.due, gamification.*, community.*)
         → notification_preferences 조회 (quiet_hours, 채널 설정)
         → notifications INSERT
         → FCM/APNs 발송 (push 채널)
         → AWS SES 발송 (email 채널, P1)

로그아웃  → device_tokens.is_active = false (해당 기기 토큰 비활성화)
```

---

## 2.6 마이그레이션 전략

- **도구**: Flyway 10.x
- **네이밍**: `V{version}__{description}.sql`
- **규칙**:
  - DDL과 DML 분리
  - 모든 마이그레이션 되돌리기 가능하도록 작성
  - 대용량 테이블 변경 시 `CREATE INDEX CONCURRENTLY` 사용
  - RLS 정책은 별도 마이그레이션 파일로 관리
