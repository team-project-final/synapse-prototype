# synapse-engagement-svc — ARCHITECTURE

> **Synapse Wiki**: [03_프로젝트_아키텍처_정의서](https://github.com/team-project-final/documents/wiki/03_%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8_%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98_%EC%A0%95%EC%9D%98%EC%84%9C) 기준선
> **Version**: v1.0 | **Updated**: 2026-05-18

---

## 1. 책임 범위

Synapse의 **사용자 참여(Engagement) 도메인**. 커뮤니티(스터디 그룹, 콘텐츠 공유)와 게임화(XP, 배지, 레벨, 리더보드, 스트릭).

| 포함 서비스 | Wiki 03.2.4 책임 |
|------------|-----------------|
| **Community Service** | 스터디 그룹 CRUD, 멤버 관리, 덱/노트 공유 (public/group/link), 공유 콘텐츠 검색, 신고 접수 |
| **Gamification Service** | XP 계산/적립, 레벨 관리, 배지 판정/수여, 리더보드 집계, 스트릭 관리 |

핵심 특성:
- **이벤트 소비 중심** — 다른 svc의 활동을 모아서 보상으로 변환
- **Redis 적극 활용** — Sorted Set 기반 리더보드, 카운터, 캐시

---

## 2. 레포 구조 (Gradle 멀티모듈)

```
synapse-engagement-svc/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle/libs.versions.toml
├── engagement-common/                  # 공통 모듈
│   ├── src/main/java/io/synapse/engagement/common/
│   │   ├── tenant/
│   │   ├── outbox/
│   │   ├── redis/                      # Sorted Set 헬퍼
│   │   ├── kafka/
│   │   └── observability/
├── community-service/                  # 독립 Spring Boot 앱
│   ├── src/main/java/io/synapse/engagement/community/
│   │   ├── CommunityApplication.java
│   │   ├── domain/
│   │   │   ├── group/                  # StudyGroup Aggregate
│   │   │   ├── membership/             # GroupMembership
│   │   │   ├── share/                  # DeckShare, NoteShare
│   │   │   ├── invitation/             # GroupInvitation
│   │   │   └── report/                 # Report
│   │   ├── application/
│   │   ├── infrastructure/
│   │   │   ├── persistence/
│   │   │   ├── redis/
│   │   │   ├── grpc/                   # Card svc 호출 (덱 복사)
│   │   │   └── outbox/
│   │   └── interfaces/
│   │       ├── rest/
│   │       └── kafka/                  # (구독: user.*, subscription.*)
│   └── src/main/resources/
└── gamification-service/               # 독립 Spring Boot 앱
    ├── src/main/java/io/synapse/engagement/gamification/
    │   ├── GamificationApplication.java
    │   ├── domain/
    │   │   ├── xp/                     # XpEvent, UserXp
    │   │   ├── level/                  # Level, LevelDefinition
    │   │   ├── badge/                  # Badge, BadgeDefinition, BadgeEvaluator
    │   │   ├── streak/                 # UserStreak
    │   │   └── leaderboard/            # Leaderboard, LeaderboardEntry
    │   ├── application/
    │   │   ├── evaluator/              # 배지 조건 평가 엔진
    │   │   └── scheduler/              # Cron (리더보드/스트릭)
    │   ├── infrastructure/
    │   │   ├── persistence/
    │   │   ├── redis/                  # Sorted Set 리더보드
    │   │   └── outbox/
    │   └── interfaces/
    │       ├── rest/
    │       ├── grpc/                   # BadgeService.InitForUser (platform svc 호출)
    │       └── kafka/                  # 핵심: 활동 이벤트 소비
    └── src/main/resources/
```

### 모듈 의존성

```
[community-service]    ─┐
[gamification-service] ─┴→ [engagement-common] ─→ [synapse-shared]
```

---

## 3. 도메인 모델 핵심

### 3.1 Community Service

```
StudyGroup (Aggregate Root)
  ├─ GroupSettings (visibility, max_members)
  ├─ Memberships (M:N with Users)
  │    └─ Role (owner/admin/member)
  ├─ Invitations
  └─ Shares
       ├─ DeckShare (target_type=deck)
       └─ NoteShare (target_type=note)

Report (별도 Aggregate)
  ├─ reporter_user_id
  ├─ target_type / target_id
  └─ status (pending/reviewed/dismissed)
```

비즈니스 규칙:
- 신고는 동일 사용자가 동일 타겟에 1회만 (중복 방지 UNIQUE 제약)
- 사용자당 일 10건 신고 제한 (Rate Limit)
- 덱 공유 시 `share_token` 발급 (UUID), 링크 공유는 토큰 기반 접근
- 그룹 가입은 (a) 초대 수락 (b) 가입 신청 후 owner/admin 승인

### 3.2 Gamification Service

```
XpEvent (append-only)
  ├─ user_id, tenant_id
  ├─ event_type (note_created, card_reviewed, group_joined, ...)
  ├─ xp_amount
  ├─ source_id, source_type
  └─ occurred_at

UserXp (mutable, current state)
  ├─ user_id (PK)
  ├─ total_xp
  ├─ current_level
  └─ level_progress

LevelDefinition (정적)
  ├─ level (1~100)
  ├─ xp_required
  ├─ title (e.g. "노트 견습생")
  └─ rewards

Badge (Aggregate Root)
  ├─ badge_code (e.g. "FIRST_NOTE")
  ├─ name, description, icon_url
  ├─ criteria_json (배지 부여 조건)
  └─ xp_reward

UserBadge
  ├─ user_id, badge_code
  └─ awarded_at

UserStreak
  ├─ user_id
  ├─ current_streak
  ├─ longest_streak
  └─ last_activity_date

Leaderboard
  ├─ leaderboard_type (weekly_xp, monthly_xp, weekly_notes, ...)
  ├─ period_start, period_end
  └─ entries (Redis Sorted Set 백업)
```

### 3.3 배지 평가 엔진

`criteria_json` 예시:

```json
{
  "type": "AND",
  "conditions": [
    { "metric": "notes_created", "operator": ">=", "value": 10 },
    { "metric": "consecutive_days", "operator": ">=", "value": 7 }
  ]
}
```

평가 트리거:
- XpEvent INSERT 후 즉시 (동기) — 단순 카운터 기반 배지
- Cron Job (일 1회) — 복잡한 조건 (스트릭, 누적)

---

## 4. 외부 인터페이스

### 4.1 REST API

**Community Service** (`/api/v1/community/**`):

| 경로 | 동작 |
|------|------|
| `POST /api/v1/community/groups` | 그룹 생성 |
| `GET /api/v1/community/groups` | 검색 (public, joined) |
| `GET /api/v1/community/groups/{id}` | 상세 |
| `POST /api/v1/community/groups/{id}/join` | 가입 신청 |
| `POST /api/v1/community/groups/{id}/invitations` | 초대 |
| `PATCH /api/v1/community/groups/{id}/members/{userId}` | 역할 변경 |
| `DELETE /api/v1/community/groups/{id}/members/{userId}` | 강퇴 |
| `POST /api/v1/community/decks/{id}/share` | 덱 공유 생성 |
| `POST /api/v1/community/decks/shared/{shareToken}/copy` | 공유 덱 복사 |
| `POST /api/v1/community/reports` | 신고 접수 |

**Gamification Service** (`/api/v1/gamification/**`):

| 경로 | 동작 |
|------|------|
| `GET /api/v1/gamification/me` | 본인 XP/레벨/배지 요약 |
| `GET /api/v1/gamification/badges` | 전체 배지 목록 + 획득 여부 |
| `GET /api/v1/gamification/leaderboards/{type}` | 리더보드 조회 |
| `GET /api/v1/gamification/streak` | 스트릭 조회 |
| `GET /api/v1/gamification/xp/history` | XP 획득 이력 |

### 4.2 gRPC API

**Gamification Service 제공** (platform/auth svc가 호출):
```protobuf
service BadgeService {
  rpc InitForUser(InitForUserRequest) returns (InitForUserResponse);
  // 가입 시 환영 배지 부여
}
```

**Card Service 호출** (Community svc가 호출):
```protobuf
// Wiki 03.4에 명시된 내부 API
rpc Card.DeckService.Copy(CopyDeckRequest) returns (CopyDeckResponse);
```

### 4.3 Kafka

**Producer (Community Service)**:
- `community.group.created`
- `community.group.joined`
- `community.deck.shared`
- `community.note.shared`
- `community.report.created`

**Producer (Gamification Service)**:
- `gamification.xp.earned`
- `gamification.level.up`
- `gamification.badge.earned`
- `notification.send` (자체 알림 트리거 — 또는 platform이 직접 변환)

**Consumer (Gamification Service — 핵심 소비자)**:
- `note.created` → +10 XP (노트 작성)
- `card.reviewed` → +5 XP (복습)
- `card.review.session.completed` → +20 XP (세션 완료)
- `community.group.joined` → +15 XP (그룹 가입)
- `community.deck.shared` → +30 XP (공유)
- `graph.notes.linked` → +2 XP (위키링크 생성)
- `user.registered` → 환영 배지 부여 (BadgeService.InitForUser와 별개의 비동기 흐름)

**Consumer (Community Service)**:
- `user.deleted` → 해당 사용자의 그룹/공유 정리
- `tenant.deleted` → 테넌트 전체 그룹/공유 삭제
- `subscription.changed` → Feature Flag (Free 플랜은 그룹 1개 제한 등)

---

## 5. 데이터 저장소

### 5.1 PostgreSQL (`engagement` 스키마)

| 테이블 | 서비스 | 비고 |
|--------|--------|------|
| `study_groups` | community | RLS |
| `group_memberships` | community | M:N |
| `group_invitations` | community | TTL 7d |
| `deck_shares` | community | RLS (testator + visibility 기반) |
| `note_shares` | community | 동일 |
| `deck_copies` | community | 공유 덱 복사 이력 |
| `reports` | community | append-only |
| `xp_events` | gamification | append-only, **Event Sourcing** |
| `user_xp` | gamification | derived from xp_events |
| `level_definitions` | gamification | 정적 (Flyway seed) |
| `badge_definitions` | gamification | 정적 (Flyway seed) |
| `user_badges` | gamification | append-only |
| `user_streaks` | gamification | mutable |
| `leaderboard_periods` | gamification | 메타데이터 |
| `leaderboard_entries` | gamification | Redis Sorted Set 백업 |
| `outbox_event` | both | Outbox |
| `processed_events` | both | 멱등성 |

### 5.2 Redis (핵심 자원)

| 키 패턴 | 자료구조 | 용도 |
|---------|---------|------|
| `lb:weekly_xp:{period}` | Sorted Set | 주간 XP 리더보드 |
| `lb:monthly_xp:{period}` | Sorted Set | 월간 XP 리더보드 |
| `lb:weekly_notes:{period}` | Sorted Set | 주간 노트 작성 리더보드 |
| `lb:tenant:{tenantId}:weekly_xp:{period}` | Sorted Set | 테넌트 내 리더보드 |
| `streak:user:{userId}` | Hash | 현재 스트릭 (활동 날짜 비트맵 검토) |
| `xp:counter:{userId}:{eventType}:{date}` | Counter | 일별 XP 합 (캡 적용) |
| `badge:eval:queue` | Stream | 배지 평가 대기 큐 |
| `comm:report:rate:{userId}:{date}` | Counter | 신고 빈도 제한 |
| `comm:group:cache:{groupId}` | Hash | 그룹 상세 캐시 |

### 5.3 Sorted Set 리더보드 사용 예시

```java
// XP 적립 시
String key = "lb:weekly_xp:2026-W20";
redisTemplate.opsForZSet().incrementScore(key, userId.toString(), xpAmount);
// TTL은 다음 주기 만료 + 7일

// Top 10 조회
Set<TypedTuple<String>> top = redisTemplate.opsForZSet()
    .reverseRangeWithScores(key, 0, 9);

// 본인 순위
Long rank = redisTemplate.opsForZSet().reverseRank(key, userId.toString());
```

⚠️ Redis 영속성 보장 위해:
- AOF + RDB 동시 활성화
- 매일 자정에 `leaderboard_entries` 테이블로 스냅샷 백업
- Redis 장애 시 복구 가능

---

## 6. 외부 의존성

### 6.1 다른 svc 호출 (gRPC)

| Caller | Callee | 용도 |
|--------|--------|------|
| `community-service` | `card/DeckService.Copy` | 공유 덱 복사 (Wiki 03.4 명시) |
| `gamification-service` | `learning/ProgressService.GetStats` | 배지 평가 시 학습 통계 조회 |
| `gamification-service` | `platform/UserService.BatchGetByIds` | 리더보드 표시용 사용자 이름/아바타 |

### 6.2 외부 API

이 레포는 직접 외부 API를 호출하지 않음.

---

## 7. 빌드 / 배포

### 7.1 Gradle

```kotlin
// settings.gradle.kts
rootProject.name = "synapse-engagement-svc"
include(":engagement-common", ":community-service", ":gamification-service")
```

### 7.2 Docker

각 서비스별 별도 이미지:
- `ghcr.io/team-project-final/community-service:{version}`
- `ghcr.io/team-project-final/gamification-service:{version}`

### 7.3 K8s 배포 특성

| 서비스 | 특이사항 |
|--------|---------|
| community-service | 일반 Deployment |
| gamification-service | Deployment + CronJob 2개 (리더보드 집계, 스트릭 리셋) |

### 7.4 Cron Job

```yaml
# 매일 자정: 전날 활동 없는 사용자 current_streak 리셋
apiVersion: batch/v1
kind: CronJob
metadata:
  name: streak-reset
spec:
  schedule: "5 0 * * *"                  # 00:05 KST
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: streak-reset
              image: ghcr.io/team-project-final/gamification-service:{version}
              command: ["java", "-jar", "/app.jar", "--job=streak-reset"]
```

```yaml
# 주간 리더보드 마감 + 다음 주차 시작
apiVersion: batch/v1
kind: CronJob
metadata:
  name: leaderboard-rollover
spec:
  schedule: "0 0 * * 1"                  # 매주 월요일 00:00
```

---

## 8. 게임화 안전장치 (Anti-cheating)

| 위험 | 대응 |
|------|------|
| 같은 행위 반복으로 XP 폭주 | 일별/시간별 XP cap (예: 노트 작성 XP는 일 100점까지) |
| 봇/자동화 | Rate Limit + 비정상 패턴 탐지 (분당 10+ 노트) → 보류 |
| 이벤트 중복 처리 | processed_events (Outbox + 멱등성) |
| 리더보드 조작 | 사용자가 직접 XP 적립 못함 (이벤트만 트리거) |
| 협의된 어뷰징 (가짜 공유) | 신고 시스템 + 머신러닝 (Phase 2) |

### XP Cap 예시

```java
public class XpCapPolicy {
    
    private static final Map<EventType, DailyCap> CAPS = Map.of(
        EventType.NOTE_CREATED,   new DailyCap(10, 100),  // 일 10회까지 XP, 최대 100
        EventType.CARD_REVIEWED,  new DailyCap(200, 500),
        EventType.GROUP_JOINED,   new DailyCap(3, 45)
    );
    
    public int applyCap(UUID userId, EventType type, int baseXp) {
        DailyCap cap = CAPS.get(type);
        int todayCount = counterRepo.getTodayCount(userId, type);
        
        if (todayCount >= cap.maxOccurrences()) return 0;
        
        int currentXpFromType = counterRepo.getTodayXp(userId, type);
        int remaining = cap.maxXp() - currentXpFromType;
        return Math.min(baseXp, Math.max(0, remaining));
    }
}
```

---

## 9. 관측성

### 9.1 메트릭

| 메트릭 | 서비스 | 라벨 |
|--------|--------|------|
| `community_groups_total` | community | `action`, `tenant` |
| `community_shares_total` | community | `shareType`, `targetType` |
| `community_reports_total` | community | `targetType`, `reason` |
| `gamification_xp_awarded_total` | gamification | `eventType`, `tenant` |
| `gamification_badge_earned_total` | gamification | `badgeCode`, `tenant` |
| `gamification_level_up_total` | gamification | `level`, `tenant` |
| `leaderboard_calculation_seconds` | gamification | `type`, `period` |
| `redis_sorted_set_size` | gamification | `leaderboard` |

### 9.2 로그

```json
{ "service":"gamification-service", "userId":"...", "eventType":"card.reviewed", 
  "xpAwarded":5, "newTotalXp":1234, "newLevel":7, "leveledUp":false }
```

### 9.3 알람

- Kafka 컨슈머 lag > 500 (gamification) → 경고
- 배지 평가 처리 시간 p95 > 100ms → 경고
- 리더보드 집계 실패 → 즉시 알람
- Redis 메모리 > 80% → 경고

---

## 10. 보안 + 멀티테넌시

| 항목 | 구현 |
|------|------|
| 그룹 접근 | RLS: visibility=public 또는 멤버 |
| 공유 콘텐츠 | RLS + share_token 검증 |
| 신고 익명성 | 신고자 정보는 관리자만 조회 |
| 리더보드 범위 | 기본은 테넌트 내, 글로벌은 opt-in |
| XP 적립 권한 | 클라이언트에서 직접 API 호출 불가 (이벤트 기반만) |
| 배지 수동 부여 | Admin API (`tenant.owner` 역할만) |

---

## 11. 로컬 개발

### 11.1 인프라

```bash
docker compose -f docker-compose.dev.yml up -d \
  postgres redis kafka schema-registry
```

### 11.2 초기 데이터

```bash
# 레벨/배지 정의 시드
./gradlew :gamification-service:flywayMigrate
```

### 11.3 실행

```bash
./gradlew :community-service:bootRun --args='--spring.profiles.active=dev'
./gradlew :gamification-service:bootRun --args='--spring.profiles.active=dev'
```

### 11.4 이벤트 주입 (테스트)

```bash
# Card reviewed 이벤트를 직접 발행 → XP 적립 확인
kafkacat -b localhost:9092 -t card.reviewed -P -K: <<EOF
test:tenant1:cards:card-uuid:{"specversion":"1.0","id":"...","source":"synapse/card-service",...}
EOF
```

또는 synapse-data-mocking의 시드 스크립트 사용.

### 11.5 테스트

```bash
./gradlew test
./gradlew :gamification-service:integrationTest    # Testcontainers + Embedded Redis
```

---

## 12. 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| 리더보드가 비어 있음 | Redis 키 만료 또는 ZSET 누락 | leaderboard_entries 테이블에서 복구 + 재계산 |
| 배지가 부여되지 않음 | criteria_json 평가 실패 또는 컨슈머 lag | 로그 확인, 수동 재평가 API |
| XP가 두 번 적립됨 | processed_events 누락 | DB UNIQUE 제약 추가, Redis SETNX 점검 |
| Streak이 끊김 (실제로는 활동함) | TZ 불일치 또는 자정 cron 늦음 | 사용자 활동 일자는 사용자 TZ 기준, 보정 로직 |
| 공유 덱 복사 실패 | Card svc gRPC 호출 deadline 초과 | Resilience4j Retry, 비동기 폴백 |

---

## 13. 참고 문서

- **Wiki 03_프로젝트_아키텍처_정의서** (Community/Gamification)
- **Wiki 02_ERD_문서** — 게임화/커뮤니티 테이블
- **Wiki 04_API_명세서**
- **03-A_통신_운영_상세서** — Outbox, 멱등성, Kafka 컨슈머
- **03-B_내부외부_경계_보안_명세** — RLS, 신고 시스템
- **03-C_이벤트_스키마_진화_가이드** — community.*, gamification.* 스키마
- [Redis Sorted Set](https://redis.io/docs/data-types/sorted-sets/)
- [Event Sourcing — Martin Fowler](https://martinfowler.com/eaaDev/EventSourcing.html)
