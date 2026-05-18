# synapse-engagement-svc — ARCHITECTURE

> **Wiki 03번** 기준선 + **03-D 어댑터 표준** 적용
> **Version**: v2.0 | **Updated**: 2026-05-18
> 본 문서는 레포 구조 + platform-svc의 Spring Modulith 패턴을 기반으로 작성됨.

---

## 1. 책임 범위

Synapse의 **사용자 참여(Engagement) 도메인**. 커뮤니티(스터디 그룹, 공유) + 게임화(XP, 배지, 레벨, 리더보드, 스트릭).

| 모듈 (추정) | Wiki 03.2.4 책임 |
|------------|-----------------|
| `community` | 스터디 그룹 CRUD, 멤버 관리, 덱/노트 공유 (public/group/link), 신고 접수 |
| `gamification` | XP 계산/적립, 레벨 관리, 배지 판정/수여, 리더보드 집계, 스트릭 관리 |
| `shared` | 공통 (TenantContext, Outbox, Redis 헬퍼) |

핵심 특성:
- **이벤트 소비 중심** — 다른 svc의 활동을 보상으로 변환
- **Redis Sorted Set 적극 활용** — 리더보드, 카운터

---

## 2. 레포 구조 (실제)

```
synapse-engagement-svc/
├── .github/
├── docs/
├── gradle/wrapper/
├── src/
│   ├── main/
│   │   ├── java/io/synapse/engagement/
│   │   │   ├── EngagementApplication.java
│   │   │   ├── community/                  # Modulith 모듈 (추정)
│   │   │   ├── gamification/               # Modulith 모듈 (추정)
│   │   │   └── shared/
│   │   └── resources/
│   │       ├── application.yml
│   │       └── db/migration/
│   └── test/
├── build.gradle.kts                        # 단일 빌드 파일
├── settings.gradle.kts
├── README.md
└── SECRETS.md
```

⚠️ 현재 상태: 10 commits, 부트스트랩 초기. README는 "상세 내용 곧 추가". Spring Modulith 패턴은 platform-svc 기반 추정.

---

## 3. `community` 모듈

### 3.1 도메인

```
StudyGroup (Aggregate Root)
  ├─ GroupSettings (visibility: PUBLIC/PRIVATE/UNLISTED, max_members)
  ├─ Memberships (M:N with Users via membership table)
  │    └─ Role (OWNER / ADMIN / MEMBER)
  ├─ Invitations
  └─ Shares
       ├─ DeckShare (target_type=DECK)
       └─ NoteShare (target_type=NOTE)

Report (별도 Aggregate, append-only)
  ├─ reporter_user_id
  ├─ target_type / target_id
  └─ status (PENDING / REVIEWED / DISMISSED)
```

### 3.2 비즈니스 규칙

- 신고는 동일 사용자가 동일 타겟에 1회만 (UNIQUE 제약)
- 사용자당 일 10건 신고 제한 (Rate Limit — Redis 카운터)
- 덱 공유 시 `share_token` 발급 (UUID), 링크 공유는 토큰 기반 접근
- 그룹 가입: (a) 초대 수락 (b) 가입 신청 + owner/admin 승인

### 3.3 03-D Port/Adapter

| Port (도메인) | Adapter (인프라) | 호출 대상 |
|---------------|-----------------|----------|
| `CardDeckCopyPort` | `CardDeckGrpcAdapter` | **learning-svc** `DeckService.Copy` |
| `NoteReadPort` | `NoteGrpcAdapter` | **knowledge-svc** `NoteService.GetForLearning` (공유 시 참조) |
| `UserPort` (Module API) | `UserApiAdapter` | (외부 — platform-svc `UserService.GetById`) |
| `CommunityEventPublisher` | `CommunityEventKafkaAdapter` (Outbox) | Kafka (`community.*`) |
| `RateLimitPort` | `RedisRateLimitAdapter` | Redis (`comm:report:rate:{userId}:{date}`) |
| `GroupCachePort` | `RedisGroupCacheAdapter` | Redis (그룹 상세 캐시) |

### 3.4 Inbound

**REST** (`/api/v1/community/**`):
| 경로 | 동작 |
|------|------|
| `POST /community/groups` | 그룹 생성 |
| `GET /community/groups` | 검색 (public + joined) |
| `GET /community/groups/{id}` | 상세 |
| `POST /community/groups/{id}/join` | 가입 신청 |
| `POST /community/groups/{id}/invitations` | 초대 |
| `PATCH /community/groups/{id}/members/{userId}` | 역할 변경 |
| `DELETE /community/groups/{id}/members/{userId}` | 강퇴 |
| `POST /community/decks/{id}/share` | 덱 공유 생성 |
| `POST /community/decks/shared/{token}/copy` | 공유 덱 복사 |
| `POST /community/reports` | 신고 접수 |

**Kafka Consumer**:
- `user.deleted` → 그룹/공유/신고 정리
- `tenant.deleted` → 테넌트 데이터 일괄 삭제
- `subscription.changed` → Feature Flag (Free 플랜 그룹 1개 제한)

---

## 4. `gamification` 모듈

### 4.1 도메인

```
XpEvent (append-only — Event Sourcing 부분 적용)
  ├─ user_id, tenant_id
  ├─ event_type (NOTE_CREATED, CARD_REVIEWED, GROUP_JOINED, ...)
  ├─ xp_amount
  ├─ source_id, source_type
  └─ occurred_at

UserXp (mutable — current state from XpEvent)
  ├─ user_id
  ├─ total_xp
  ├─ current_level
  └─ level_progress

LevelDefinition (정적 — Flyway seed)
  ├─ level (1~100)
  ├─ xp_required
  ├─ title (e.g. "노트 견습생")
  └─ rewards

Badge (Aggregate Root)
  ├─ badge_code (e.g. FIRST_NOTE)
  ├─ name, description, icon_url
  ├─ criteria_json
  └─ xp_reward

UserBadge (append-only)
  ├─ user_id, badge_code
  └─ awarded_at

UserStreak (mutable)
  ├─ user_id
  ├─ current_streak
  ├─ longest_streak
  └─ last_activity_date

Leaderboard (메타)
  ├─ leaderboard_type (weekly_xp, monthly_xp, weekly_notes, ...)
  ├─ period_start, period_end
  └─ entries (Redis Sorted Set 백업)
```

### 4.2 배지 평가 엔진

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

### 4.3 03-D Port/Adapter

| Port | Adapter | 호출 대상 |
|------|---------|----------|
| `ProgressPort` | `LearningProgressGrpcAdapter` | **learning-svc** `ProgressService.GetStats` |
| `UserDirectoryPort` | `UserGrpcAdapter` | **platform-svc** `UserService.BatchGetByIds` (리더보드 표시) |
| `LeaderboardStore` | `RedisLeaderboardAdapter` | Redis Sorted Set |
| `XpEventStore` (도메인 Port) | `JpaXpEventAdapter` | PostgreSQL (`xp_events`, append-only) |
| `BadgeCriteriaEvaluator` | `ExpressionEvaluatorAdapter` | criteria_json 평가 (자체 구현 or Spring Expression Language) |
| `GamificationEventPublisher` | `GamificationEventKafkaAdapter` (Outbox) | Kafka (`gamification.*`) |
| `BadgeInitPort` (Module API) | (Inbound from platform-svc) | platform-svc가 호출 |

### 4.4 Sorted Set 리더보드

```java
// XP 적립 시
String key = "lb:weekly_xp:2026-W20";
redisTemplate.opsForZSet().incrementScore(key, userId.toString(), xpAmount);
// TTL: 다음 주기 만료 + 7일 버퍼

// Top 10
Set<TypedTuple<String>> top = redisTemplate.opsForZSet()
    .reverseRangeWithScores(key, 0, 9);

// 본인 순위
Long rank = redisTemplate.opsForZSet().reverseRank(key, userId.toString());
```

영속성:
- AOF + RDB 동시 활성화
- 매일 자정 `leaderboard_entries` 테이블로 스냅샷 백업
- Redis 장애 시 DB에서 복구

### 4.5 Inbound

**REST** (`/api/v1/gamification/**`):
| 경로 | 동작 |
|------|------|
| `GET /me` | 본인 XP/레벨/배지 요약 |
| `GET /badges` | 전체 배지 + 획득 여부 |
| `GET /leaderboards/{type}` | 리더보드 조회 |
| `GET /streak` | 스트릭 |
| `GET /xp/history` | XP 획득 이력 |

**gRPC 제공**:
- `BadgeService.InitForUser` — platform-svc auth 모듈이 신규 가입 시 호출 (환영 배지)

**Kafka Consumer (핵심)**:
- `note.created` → +10 XP
- `card.reviewed` → +5 XP (이벤트당 + 정답률 보너스)
- `card.review.session.completed` → +20 XP
- `community.group.joined` → +15 XP
- `community.deck.shared` → +30 XP
- `graph.notes.linked` → +2 XP

---

## 5. XP Cap (Anti-cheating)

| 위험 | 대응 |
|------|------|
| 같은 행위 반복 폭주 | 일별/시간별 XP cap (예: 노트 작성 XP 일 100점 한도) |
| 봇/자동화 | Rate Limit + 비정상 패턴 탐지 (분당 10+ 노트) → 보류 |
| 이벤트 중복 처리 | processed_events (멱등성, 03-A.5.3) |
| 리더보드 조작 | 사용자 직접 XP 적립 불가 (이벤트만 트리거) |
| 협의 어뷰징 (가짜 공유) | 신고 시스템 + ML (Phase 2) |

### XpCapPolicy 예시

```java
public class XpCapPolicy {
    private static final Map<EventType, DailyCap> CAPS = Map.of(
        EventType.NOTE_CREATED,   new DailyCap(10, 100),
        EventType.CARD_REVIEWED,  new DailyCap(200, 500),
        EventType.GROUP_JOINED,   new DailyCap(3, 45)
    );
    
    public int applyCap(UUID userId, EventType type, int baseXp) {
        DailyCap cap = CAPS.get(type);
        int todayCount = counterRepo.getTodayCount(userId, type);
        if (todayCount >= cap.maxOccurrences()) return 0;
        int currentXp = counterRepo.getTodayXp(userId, type);
        int remaining = cap.maxXp() - currentXp;
        return Math.min(baseXp, Math.max(0, remaining));
    }
}
```

---

## 6. `shared` 모듈

공통 인프라:
- TenantContext + Interceptor
- Outbox 공통
- CloudEvents 빌더/파서
- Redis Sorted Set 헬퍼 + AOF 백업 헬퍼
- OpenTelemetry 설정
- Idempotency Helper

---

## 7. 데이터 저장소

### 7.1 PostgreSQL

| 테이블 | 모듈 | 비고 |
|--------|------|------|
| `study_groups` | community | RLS |
| `group_memberships` | community | M:N |
| `group_invitations` | community | TTL 7d (배치 정리) |
| `deck_shares` | community | RLS |
| `note_shares` | community | RLS |
| `deck_copies` | community | 공유 덱 복사 이력 |
| `reports` | community | append-only, UNIQUE(reporter, target) |
| `xp_events` | gamification | append-only |
| `user_xp` | gamification | mutable, derived |
| `level_definitions` | gamification | seed |
| `badge_definitions` | gamification | seed |
| `user_badges` | gamification | append-only |
| `user_streaks` | gamification | mutable |
| `leaderboard_periods` | gamification | 메타 |
| `leaderboard_entries` | gamification | Redis ZSET 스냅샷 |
| `outbox_event` | 모든 | 03-A.6 |
| `processed_events` | 모든 | 멱등성 |

### 7.2 Redis (핵심 자원)

| 키 패턴 | 자료구조 | 용도 |
|---------|---------|------|
| `lb:weekly_xp:{period}` | Sorted Set | 주간 XP |
| `lb:monthly_xp:{period}` | Sorted Set | 월간 XP |
| `lb:weekly_notes:{period}` | Sorted Set | 주간 노트 |
| `lb:tenant:{tenantId}:weekly_xp:{period}` | Sorted Set | 테넌트 내 |
| `streak:user:{userId}` | Hash | 현재 스트릭 |
| `xp:counter:{userId}:{eventType}:{date}` | Counter | 일별 XP 합 (Cap) |
| `badge:eval:queue` | Stream | 배지 평가 대기 (복잡 조건) |
| `comm:report:rate:{userId}:{date}` | Counter | 신고 빈도 제한 |
| `comm:group:cache:{groupId}` | Hash | 그룹 상세 |

---

## 8. 빌드 / 배포

### 8.1 빌드

```bash
./gradlew build
./gradlew test
./gradlew test --tests "*ModuleStructureTest"
```

### 8.2 Docker

단일 이미지: `ghcr.io/team-project-final/synapse-engagement-svc:{version}`

### 8.3 K8s

- 단일 Deployment
- HPA: CPU + Kafka consumer lag 기반
- **2개 CronJob**:
  - `streak-reset` (매일 00:05 KST) — 전날 활동 없는 사용자 current_streak 리셋
  - `leaderboard-rollover` (매주 월 00:00) — 주간 리더보드 마감

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: streak-reset
spec:
  schedule: "5 0 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: streak-reset
              image: ghcr.io/team-project-final/synapse-engagement-svc:{version}
              command: ["java", "-jar", "/app.jar", "--job=streak-reset"]
```

---

## 9. 관측성

### 9.1 메트릭

| 메트릭 | 모듈 | 라벨 |
|--------|------|------|
| `community_groups_total` | community | `action`, `tenant` |
| `community_shares_total` | community | `shareType`, `targetType` |
| `community_reports_total` | community | `targetType`, `reason` |
| `gamification_xp_awarded_total` | gamification | `eventType`, `tenant` |
| `gamification_badge_earned_total` | gamification | `badgeCode`, `tenant` |
| `gamification_level_up_total` | gamification | `level`, `tenant` |
| `leaderboard_calculation_seconds` | gamification | `type`, `period` |
| `redis_sorted_set_size` | gamification | `leaderboard` |

### 9.2 알람

- Kafka consumer lag > 500 (gamification)
- 배지 평가 p95 > 100ms
- 리더보드 집계 실패
- Redis 메모리 > 80%

---

## 10. 보안 + 멀티테넌시

| 항목 | 구현 |
|------|------|
| 그룹 접근 | RLS: `visibility=PUBLIC` OR 멤버 |
| 공유 콘텐츠 | RLS + share_token 검증 |
| 신고 익명성 | 신고자 정보는 관리자만 조회 |
| 리더보드 범위 | 기본 테넌트 내, 글로벌은 opt-in |
| XP 적립 권한 | 클라이언트 직접 호출 불가 (이벤트만) |
| 배지 수동 부여 | Admin API (`tenant.owner` 역할만) |

---

## 11. 로컬 개발

### 11.1 인프라

```bash
docker compose -f docker-compose.dev.yml up -d \
  postgres redis kafka schema-registry
```

### 11.2 초기화

```bash
./gradlew flywayMigrate                  # 레벨/배지 seed 포함
```

### 11.3 실행

```bash
./gradlew bootRun --args='--spring.profiles.active=local'
```

### 11.4 이벤트 주입 테스트

```bash
# Card reviewed 이벤트를 직접 발행 → XP 적립 확인
kafkacat -b localhost:9092 -t card.reviewed -P -K: <<EOF
test:tenant1:cards:card-uuid:{"specversion":"1.0","id":"...","source":"synapse/learning-card-svc",...}
EOF
```

또는 synapse-data-mocking 시드 스크립트 사용.

---

## 12. 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| 리더보드 비어 있음 | Redis 키 만료 또는 ZSET 누락 | `leaderboard_entries`에서 복구 + 재계산 |
| 배지 미부여 | criteria_json 평가 실패 또는 컨슈머 lag | 로그 확인, 수동 재평가 API |
| XP 중복 적립 | processed_events 누락 | DB UNIQUE 제약 + Redis SETNX 점검 |
| Streak 끊김 (실제 활동함) | TZ 불일치 또는 cron 늦음 | 사용자 TZ 기준 활동 일자 + 보정 로직 |
| 공유 덱 복사 실패 | learning-svc gRPC deadline 초과 | Resilience4j Retry, 비동기 폴백 검토 |

---

## 13. 안티패턴 (03-D)

- ❌ Controller가 `RedisTemplate` 직접 호출 — `LeaderboardStore` Port 경유
- ❌ Kafka Listener에 비즈니스 로직 — UseCase로 추출
- ❌ XP 적립을 클라이언트가 호출하는 API로 노출 — 이벤트 기반만
- ❌ Community가 learning-svc gRPC stub import — `CardDeckCopyPort`만 호출
- ❌ Badge `criteria_json`을 JPA Entity에서 직접 파싱 — Evaluator로 분리

---

## 14. 현재 상태

- 부트스트랩 초기 (10 commits)
- README 상세 내용 추가 예정
- 모듈 구조는 platform-svc 패턴 기반 추정

---

## 15. 참고

- **Wiki 03** (Community / Gamification 서비스)
- **Wiki 02** — 게임화/커뮤니티 테이블
- **Wiki 04** — REST API
- **03-A** — Outbox, 멱등성, Kafka consumer
- **03-B** — RLS, 신고 시스템
- **03-C** — community.*, gamification.* 스키마
- **03-D** — Port/Adapter 표준
- [Redis Sorted Set](https://redis.io/docs/data-types/sorted-sets/)
- [Event Sourcing — Martin Fowler](https://martinfowler.com/eaaDev/EventSourcing.html)
