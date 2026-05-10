# 4. API 명세서

> **프로젝트명**: Synapse — 통합 학습-지식 그래프 SaaS
> **버전**: v1.0
> **작성일**: 2026-05-07
> **기술 스택**: Spring Boot 4, Flutter 3.x, FastAPI, PostgreSQL 16, Redis, Elasticsearch, Kafka, K8s

---

## 4.1 공통 규약

### Base URL

```
Production: https://api.synapse.app/api/v1
Staging:    https://api-staging.synapse.app/api/v1
```

### 인증

- **방식**: JWT Bearer Token (httpOnly Cookie 자동 전송)
- **헤더**: `Authorization: Bearer <access_token>` (Cookie 불가 시)
- **테넌트**: `X-Tenant-Id` 헤더 (Gateway 자동 주입)

### 공통 응답 형식

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-05-07T10:00:00Z",
    "requestId": "req-uuid"
  }
}
```

### 에러 응답

```json
{
  "success": false,
  "error": {
    "code": "NOTE_NOT_FOUND",
    "message": "요청한 노트를 찾을 수 없습니다.",
    "details": []
  },
  "meta": {
    "timestamp": "2026-05-07T10:00:00Z",
    "requestId": "req-uuid"
  }
}
```

### HTTP 상태 코드

| 코드 | 의미 | 사용 |
|------|------|------|
| 200 | OK | 조회/수정 성공 |
| 201 | Created | 생성 성공 |
| 204 | No Content | 삭제 성공 |
| 400 | Bad Request | 유효성 검증 실패 |
| 401 | Unauthorized | 인증 실패 |
| 403 | Forbidden | 권한 부족 / 할당량 초과 |
| 404 | Not Found | 리소스 없음 |
| 409 | Conflict | 중복 리소스 |
| 422 | Unprocessable | 비즈니스 규칙 위반 |
| 429 | Too Many Requests | Rate Limit 초과 |
| 500 | Internal Error | 서버 오류 |

### 페이지네이션

```
GET /notes?cursor={lastId}&limit=20&sort=updated_at:desc
```

```json
{
  "data": [...],
  "pagination": {
    "cursor": "next-cursor-value",
    "hasMore": true,
    "totalCount": 150
  }
}
```

### Rate Limiting 헤더

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1620000000
```

---

## 4.2 Auth 도메인

### POST /auth/signup

회원가입 (이메일)

```json
// Request
{
  "email": "user@example.com",
  "password": "SecureP@ss1!",
  "displayName": "홍길동",
  "locale": "ko"
}

// Response 201
{
  "data": {
    "userId": "uuid",
    "tenantId": "uuid",
    "email": "user@example.com",
    "displayName": "홍길동"
  }
}
```

### POST /auth/login

```json
// Request
{
  "email": "user@example.com",
  "password": "SecureP@ss1!"
}

// Response 200 (MFA 미설정 시)
{
  "data": {
    "accessToken": "jwt...",
    "expiresIn": 900,
    "user": { "id": "uuid", "email": "...", "displayName": "..." }
  }
}
// Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict
```

### POST /auth/oauth/{provider}

OAuth 2.0 로그인 시작 (provider: google|github|apple|microsoft)

```json
// Response 200
{
  "data": {
    "redirectUrl": "https://accounts.google.com/o/oauth2/auth?..."
  }
}
```

### POST /auth/oauth/{provider}/callback

OAuth 콜백 처리

### POST /auth/mfa/setup

TOTP MFA 설정

```json
// Response 200
{
  "data": {
    "secret": "BASE32SECRET",
    "qrCodeUrl": "otpauth://totp/Synapse:user@example.com?...",
    "qrCodeImage": "data:image/png;base64,..."
  }
}
```

### POST /auth/mfa/verify

MFA 코드 검증

```json
// Request
{ "code": "123456" }
```

### POST /auth/refresh

Access Token 갱신 (Refresh Token Cookie 사용)

### POST /auth/logout

로그아웃 (Refresh Token 무효화)

---

## 4.3 Tenant 도메인

### GET /tenant/context

현재 테넌트 정보 조회

```json
{
  "data": {
    "tenantId": "uuid",
    "name": "My Workspace",
    "plan": "pro",
    "role": "owner",
    "quotas": {
      "notes": { "used": 45, "max": -1 },
      "aiGenerations": { "used": 120, "max": 500 }
    }
  }
}
```

### POST /tenant/switch

테넌트 전환 (복수 테넌트 멤버)

### GET /tenant/usage

사용량 현황 조회

### GET /tenant/members

멤버 목록 조회 (Team 플랜 이상)

### POST /tenant/members/invite

멤버 초대

---

## 4.4 Billing 도메인

### GET /billing/plans

사용 가능한 플랜 목록

```json
{
  "data": [
    {
      "code": "pro",
      "name": "Pro",
      "price": 9.99,
      "currency": "USD",
      "interval": "month",
      "features": ["unlimited_notes", "500_ai_month", "10gb_storage"]
    }
  ]
}
```

### POST /billing/checkout

Stripe Checkout 세션 생성

```json
// Request
{ "planCode": "pro", "interval": "month" }

// Response 200
{
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/..."
  }
}
```

### POST /billing/portal

Stripe Customer Portal URL 생성

### GET /billing/subscription

현재 구독 상태 조회

### POST /billing/webhooks (Internal)

Stripe Webhook 수신 (내부 전용)

---

## 4.5 사용자 데이터 권리 (GDPR/CCPA)

### POST /me/data-export

데이터 내보내기 요청

```json
// Request
{ "format": "obsidian-zip", "scope": "all" }

// Response 202
{
  "data": {
    "jobId": "uuid",
    "status": "pending",
    "estimatedMinutes": 5
  }
}
```

### GET /me/data-export/{jobId}

내보내기 상태 조회

### DELETE /me/account

계정 삭제 요청 (30일 유예, GDPR Article 17)

---

## 4.6 Notes 도메인

### POST /notes

노트 생성

```json
// Request
{
  "title": "학습 노트 제목",
  "content": "# 내용\n\n[[다른노트]] 참조...",
  "tags": ["학습", "프로그래밍"]
}

// Response 201
{
  "data": {
    "id": "uuid",
    "title": "학습 노트 제목",
    "content": "# 내용\n\n[[다른노트]] 참조...",
    "tags": ["학습", "프로그래밍"],
    "wordCount": 25,
    "links": [{ "targetTitle": "다른노트", "targetId": "uuid" }],
    "createdAt": "2026-05-07T10:00:00Z"
  }
}
```

### GET /notes

노트 목록 조회 (페이지네이션)

### GET /notes/{id}

노트 상세 조회

### PATCH /notes/{id}

노트 수정 (위키링크 자동 갱신)

### DELETE /notes/{id}

노트 삭제 (소프트 삭제)

### GET /notes/{id}/backlinks

특정 노트의 백링크 목록

```json
{
  "data": [
    {
      "noteId": "uuid",
      "title": "참조하는 노트",
      "contextSnippet": "...[[현재노트]] 관련 내용..."
    }
  ]
}
```

### GET /notes/{id}/versions

노트 버전 이력

### POST /notes/{id}/attachments

첨부파일 업로드 (Presigned URL 반환)

### GET /notes/search

키워드 검색 (Elasticsearch)

```
GET /notes/search?q=머신러닝&tags=AI&sort=relevance
```

---

## 4.7 Cards/Decks 도메인

### POST /decks

덱 생성

### GET /decks

덱 목록 조회

### PATCH /decks/{id}

덱 수정

### DELETE /decks/{id}

덱 삭제

### POST /decks/{deckId}/cards

카드 생성

```json
// Request
{
  "cardType": "basic",
  "frontContent": "TCP와 UDP의 차이점은?",
  "backContent": "TCP는 연결 지향적, 신뢰성 보장...",
  "sourceNoteId": "uuid"
}
```

### GET /decks/{deckId}/cards

덱 내 카드 목록

### PATCH /cards/{id}

카드 수정

### DELETE /cards/{id}

카드 삭제

### POST /cards/batch

카드 일괄 생성

```json
// Request
{
  "deckId": "uuid",
  "cards": [
    { "cardType": "basic", "frontContent": "...", "backContent": "..." },
    { "cardType": "cloze", "frontContent": "{{c1::답}}은 ...", "backContent": "" }
  ]
}
```

---

## 4.8 SRS/Reviews 도메인

### GET /reviews/queue

오늘의 복습 큐 조회

```json
{
  "data": {
    "totalDue": 25,
    "newCards": 5,
    "reviewCards": 15,
    "learningCards": 5,
    "cards": [
      {
        "cardId": "uuid",
        "cardType": "basic",
        "frontContent": "...",
        "deckName": "프로그래밍",
        "status": "review"
      }
    ]
  }
}
```

### POST /reviews/sessions

복습 세션 시작

```json
// Request
{ "deckId": "uuid" }

// Response 201
{
  "data": {
    "sessionId": "uuid",
    "totalCards": 25,
    "startedAt": "2026-05-07T10:00:00Z"
  }
}
```

### POST /reviews/sessions/{sessionId}/submit

카드 복습 결과 제출

```json
// Request
{
  "cardId": "uuid",
  "rating": 3,
  "timeSpentMs": 5000
}

// Response 200
{
  "data": {
    "nextInterval": 7,
    "newEF": 2.6,
    "nextDueDate": "2026-05-14",
    "sessionProgress": { "completed": 10, "total": 25 }
  }
}
```

### PUT /reviews/sessions/{sessionId}/complete

세션 완료

---

## 4.9 Graph 도메인

### GET /graph/data

그래프 시각화 데이터

```json
{
  "data": {
    "nodes": [
      { "id": "uuid", "title": "노트1", "linkCount": 5, "pageRank": 0.85 }
    ],
    "edges": [
      { "source": "uuid1", "target": "uuid2", "type": "wikilink" }
    ]
  }
}
```

### GET /graph/neighbors/{noteId}

특정 노트의 N-hop 이웃 조회

### GET /graph/clusters

자동 감지된 클러스터 목록

---

## 4.10 AI 도메인

### POST /ai/cards/generate

AI 카드 자동 생성

```json
// Request
{
  "noteId": "uuid",
  "cardType": "basic",
  "count": 5,
  "difficulty": "medium"
}

// Response 200
{
  "data": {
    "cards": [
      {
        "frontContent": "생성된 질문...",
        "backContent": "생성된 답변...",
        "confidence": 0.92
      }
    ],
    "usage": { "inputTokens": 500, "outputTokens": 300 }
  }
}
```

### POST /ai/search/semantic

시맨틱 검색

```json
// Request
{
  "query": "머신러닝에서 과적합을 방지하는 방법",
  "limit": 10,
  "threshold": 0.7
}

// Response 200
{
  "data": {
    "results": [
      {
        "noteId": "uuid",
        "title": "정규화 기법",
        "chunkText": "과적합을 방지하기 위해...",
        "score": 0.89
      }
    ]
  }
}
```

### POST /ai/search/hybrid

하이브리드 검색 (시맨틱 + BM25 RRF)

### POST /ai/qa

RAG 기반 Q&A (스트리밍)

```json
// Request
{
  "question": "내 노트에서 정규화 기법은 무엇이라고 설명하고 있나요?",
  "stream": true
}

// Response: Server-Sent Events
data: {"type": "chunk", "content": "노트에 따르면"}
data: {"type": "chunk", "content": " 정규화 기법은..."}
data: {"type": "sources", "noteIds": ["uuid1", "uuid2"]}
data: {"type": "done", "usage": {"inputTokens": 800, "outputTokens": 200}}
```

---

## 4.11 Stats 도메인

### GET /stats/overview

사용자 학습 통계 대시보드

```json
{
  "data": {
    "today": { "reviewed": 25, "correct": 20, "streak": 7 },
    "weekly": { "reviewed": 150, "newCards": 30 },
    "totalNotes": 89,
    "totalCards": 450,
    "retentionRate": 0.85
  }
}
```

### GET /stats/heatmap

학습 히트맵 (GitHub 스타일)

### GET /stats/retention

리텐션 커브 차트 데이터

---

## 4.12 Import/Export 도메인

### POST /import/markdown

Markdown 파일 가져오기 (Obsidian Vault)

### POST /import/anki

Anki .apkg 파일 가져오기

### POST /export/markdown

Markdown 형식 내보내기

### POST /export/anki

Anki .apkg 형식 내보내기

---

## 4.13 Admin 도메인 (관리자 전용)

### GET /admin/tenants

테넌트 목록 관리

### GET /admin/tenants/{id}/usage

특정 테넌트 사용량 상세

### PUT /admin/tenants/{id}/status

테넌트 상태 변경 (suspend/activate)

### GET /admin/stats/system

시스템 전체 통계

### GET /admin/audit-logs

감사 로그 검색

```
GET /admin/audit-logs?tenantId=uuid&action=note.create&from=2026-05-01&to=2026-05-07
```

### GET /admin/reports

신고 목록 조회

```
GET /admin/reports?status=pending&targetType=shared_deck&limit=20&cursor=...
```

```json
{
  "data": [
    {
      "id": "uuid",
      "reporterUserId": "uuid",
      "targetType": "shared_deck",
      "targetId": "uuid",
      "reason": "inappropriate",
      "description": "부적절한 내용이 포함되어 있습니다.",
      "status": "pending",
      "createdAt": "2026-05-07T10:00:00Z"
    }
  ],
  "pagination": { "cursor": "...", "hasMore": true }
}
```

### GET /admin/reports/{id}

신고 상세 조회

### PUT /admin/reports/{id}/resolve

신고 처리

```json
// Request
{
  "status": "resolved",
  "actionTaken": "content_removed"
}

// Response 200
{
  "data": {
    "id": "uuid",
    "status": "resolved",
    "reviewedByUserId": "uuid",
    "reviewedAt": "2026-05-07T12:00:00Z",
    "actionTaken": "content_removed"
  }
}
```

### GET /admin/shared-content

공유 콘텐츠 모더레이션 목록

```
GET /admin/shared-content?status=reported&type=shared_deck
```

### PUT /admin/shared-content/{id}/status

콘텐츠 상태 변경

```json
// Request
{ "status": "removed", "reason": "community_guidelines_violation" }
```

### GET /admin/study-groups

그룹 관리 목록

```
GET /admin/study-groups?status=active&limit=20&cursor=...
```

### PUT /admin/study-groups/{id}/status

그룹 상태 변경

```json
// Request
{ "status": "suspended", "reason": "policy_violation" }
```

### GET /admin/gamification/stats

게이미피케이션 통계

```json
{
  "data": {
    "totalXpAwarded": 1500000,
    "totalBadgesAwarded": 8500,
    "activeStreaks": 320,
    "topBadges": [
      { "code": "STREAK_7", "awardedCount": 1200 }
    ]
  }
}
```

### GET /admin/gamification/badges

배지 목록 조회

### POST /admin/gamification/badges

배지 생성

```json
// Request
{
  "code": "STREAK_30",
  "name": "30일 전사",
  "description": "30일 연속 복습을 달성했습니다.",
  "iconUrl": "https://cdn.synapse.app/badges/streak30.png",
  "category": "streak",
  "criteriaJson": {
    "type": "streak",
    "field": "current_streak",
    "value": 30,
    "period": "all"
  },
  "xpReward": 500
}
```

### PATCH /admin/gamification/badges/{id}

배지 수정

### GET /admin/gamification/levels

레벨 정의 목록

### PUT /admin/gamification/levels

레벨 정의 수정 (전체 교체)

```json
// Request
{
  "levels": [
    { "levelNumber": 1, "requiredXp": 0, "title": "새싹", "rewardsJson": null },
    { "levelNumber": 2, "requiredXp": 100, "title": "탐험가", "rewardsJson": null }
  ]
}
```

### GET /admin/gamification/xp-config

XP 이벤트 설정 조회

```json
{
  "data": {
    "xpConfig": {
      "review_complete": 10,
      "note_create": 20,
      "card_create": 5,
      "streak_bonus": 50,
      "group_activity": 15,
      "deck_share": 30,
      "first_review": 100,
      "perfect_session": 50
    }
  }
}
```

### PUT /admin/gamification/xp-config

XP 이벤트 설정 변경

---

## 4.14 Audit 도메인

### GET /audit/logs

현재 테넌트 감사 로그 조회 (Admin/Owner 전용)

```json
{
  "data": [
    {
      "id": "uuid",
      "action": "note.create",
      "userId": "uuid",
      "resourceType": "note",
      "resourceId": "uuid",
      "ipAddress": "1.2.3.4",
      "createdAt": "2026-05-07T10:00:00Z"
    }
  ]
}
```

---

## 4.15 Community 도메인

### POST /community/groups

스터디 그룹 생성

```json
// Request
{
  "name": "ML 스터디",
  "description": "머신러닝을 함께 공부하는 그룹입니다.",
  "maxMembers": 20,
  "joinType": "approval",
  "avatarUrl": "https://cdn.synapse.app/avatars/ml-study.png"
}

// Response 201
{
  "data": {
    "id": "uuid",
    "name": "ML 스터디",
    "description": "머신러닝을 함께 공부하는 그룹입니다.",
    "maxMembers": 20,
    "joinType": "approval",
    "status": "active",
    "avatarUrl": "https://cdn.synapse.app/avatars/ml-study.png",
    "memberCount": 1,
    "myRole": "owner",
    "createdAt": "2026-05-07T10:00:00Z"
  }
}
```

### GET /community/groups

내 그룹 목록 조회

```
GET /community/groups?limit=20&cursor=...
```

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "ML 스터디",
      "memberCount": 12,
      "myRole": "member",
      "status": "active",
      "updatedAt": "2026-05-07T10:00:00Z"
    }
  ],
  "pagination": { "cursor": "...", "hasMore": false }
}
```

### GET /community/groups/{id}

그룹 상세 조회

### PATCH /community/groups/{id}

그룹 정보 수정 (owner/admin만)

```json
// Request
{
  "name": "ML/DL 스터디",
  "description": "머신러닝과 딥러닝을 함께 공부합니다.",
  "maxMembers": 30,
  "joinType": "open"
}
```

### DELETE /community/groups/{id}

그룹 삭제 (owner만, 소프트 삭제)

### POST /community/groups/{id}/join

그룹 가입 신청

```json
// Request (optional)
{ "message": "열심히 하겠습니다!" }

// Response 200 — joinType=open 시 즉시 가입
{
  "data": { "status": "active", "role": "member" }
}
// Response 200 — joinType=approval 시 승인 대기
{
  "data": { "status": "pending" }
}
```

### POST /community/groups/{id}/leave

그룹 탈퇴 (owner는 다른 owner 위임 후 탈퇴 가능)

### GET /community/groups/{id}/members

멤버 목록 조회

```json
{
  "data": [
    {
      "userId": "uuid",
      "displayName": "김시냅스",
      "avatarUrl": "...",
      "role": "admin",
      "joinedAt": "2026-05-01T00:00:00Z"
    }
  ]
}
```

### PATCH /community/groups/{id}/members/{uid}

멤버 역할 변경 (owner/admin만)

```json
// Request
{ "role": "admin" }
```

### DELETE /community/groups/{id}/members/{uid}

멤버 강퇴 (owner/admin만)

### POST /community/groups/{id}/invite

멤버 초대 (invite link 또는 직접 초대)

```json
// Request
{ "userIds": ["uuid1", "uuid2"] }

// Response 200
{
  "data": {
    "invited": ["uuid1", "uuid2"],
    "failed": []
  }
}
```

### POST /community/groups/{id}/invite/{token}/accept

초대 수락

### POST /community/groups/{id}/invite/{token}/decline

초대 거절

### GET /community/groups/{id}/join-requests

가입 신청 목록 (owner/admin만)

```json
{
  "data": [
    {
      "userId": "uuid",
      "displayName": "이시냅스",
      "message": "열심히 하겠습니다!",
      "requestedAt": "2026-05-07T11:00:00Z"
    }
  ]
}
```

### PATCH /community/groups/{id}/join-requests/{uid}

가입 승인/거절

```json
// Request
{ "action": "approve" }
// 또는
{ "action": "reject" }
```

---

### POST /community/shared-decks

덱 공유

```json
// Request
{
  "deckId": "uuid",
  "shareType": "group",
  "targetGroupId": "uuid",
  "allowCopy": true
}
// shareType=link 시 share_token 자동 생성 (12-char base62)

// Response 201
{
  "data": {
    "id": "uuid",
    "deckId": "uuid",
    "deckName": "프로그래밍 기초",
    "shareType": "group",
    "targetGroupId": "uuid",
    "shareToken": null,
    "allowCopy": true,
    "downloadCount": 0,
    "ratingAvg": null,
    "ratingCount": 0,
    "status": "active",
    "createdAt": "2026-05-07T10:00:00Z"
  }
}
```

### GET /community/shared-decks

공유 덱 검색/목록

```
GET /community/shared-decks?shareType=public&q=머신러닝&sort=rating_avg:desc&limit=20&cursor=...
```

### GET /community/shared-decks/{id}

공유 덱 상세

### DELETE /community/shared-decks/{id}

공유 해제 (공유자 본인만)

### POST /community/shared-decks/{id}/copy

공유 덱 복사 (Card Service 내부 API 호출)

```json
// Response 201
{
  "data": {
    "copiedDeckId": "uuid",
    "deckName": "프로그래밍 기초 (복사)",
    "cardCount": 42
  }
}
```

### POST /community/shared-decks/{id}/rate

공유 덱 평가

```json
// Request
{
  "rating": 5,
  "comment": "완성도가 높고 내용이 알찹니다."
}

// Response 201
{
  "data": {
    "id": "uuid",
    "rating": 5,
    "comment": "완성도가 높고 내용이 알찹니다.",
    "createdAt": "2026-05-07T10:00:00Z"
  }
}
```

### GET /community/shared-decks/{id}/ratings

평가/댓글 목록

```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "displayName": "김시냅스",
      "rating": 5,
      "comment": "완성도가 높습니다.",
      "createdAt": "2026-05-07T10:00:00Z"
    }
  ],
  "pagination": { "cursor": "...", "hasMore": false }
}
```

---

### POST /community/shared-notes

노트 공유

```json
// Request
{
  "noteId": "uuid",
  "shareType": "public",
  "allowCopy": true
}

// Response 201
{
  "data": {
    "id": "uuid",
    "noteId": "uuid",
    "noteTitle": "머신러닝 개요",
    "shareType": "public",
    "shareToken": null,
    "allowCopy": true,
    "status": "active",
    "createdAt": "2026-05-07T10:00:00Z"
  }
}
```

### GET /community/shared-notes

공유 노트 검색/목록

```
GET /community/shared-notes?shareType=public&q=딥러닝&limit=20&cursor=...
```

### GET /community/shared-notes/{id}

공유 노트 상세

### DELETE /community/shared-notes/{id}

공유 해제 (공유자 본인만)

---

### POST /community/reports

신고 접수 (동일 target 중복 신고 불가, 사용자당 일 10건 제한)

```json
// Request
{
  "targetType": "shared_deck",
  "targetId": "uuid",
  "reason": "inappropriate",
  "description": "부적절한 이미지가 포함된 덱입니다."
}

// Response 201
{
  "data": {
    "id": "uuid",
    "status": "pending",
    "createdAt": "2026-05-07T10:00:00Z"
  }
}

// Response 409 — 이미 신고한 경우
{
  "error": {
    "code": "ALREADY_REPORTED",
    "message": "이미 신고한 콘텐츠입니다."
  }
}

// Response 429 — 일 한도 초과
{
  "error": {
    "code": "REPORT_LIMIT_EXCEEDED",
    "message": "오늘 신고 한도(10건)를 초과했습니다."
  }
}
```

---

## 4.16 Gamification 도메인

### GET /gamification/profile

내 프로필 (레벨, XP, 스트릭, 배지 요약)

```json
{
  "data": {
    "level": 12,
    "totalXp": 5400,
    "currentStreak": 7,
    "longestStreak": 21,
    "title": "지식 탐험가",
    "avatarFrame": "streak_flame",
    "nextLevelXp": 6000,
    "recentBadges": [
      {
        "code": "STREAK_7",
        "name": "일주일 전사",
        "iconUrl": "https://cdn.synapse.app/badges/streak7.png",
        "earnedAt": "2026-05-07T00:00:00Z"
      }
    ]
  }
}
```

### GET /gamification/xp/history

XP 획득 이력 (커서 페이지네이션)

```
GET /gamification/xp/history?limit=20&cursor=...
```

```json
{
  "data": [
    {
      "id": "uuid",
      "eventType": "review_complete",
      "xpAmount": 10,
      "sourceId": "uuid",
      "sourceType": "card_review",
      "createdAt": "2026-05-07T10:30:00Z"
    },
    {
      "id": "uuid",
      "eventType": "streak_bonus",
      "xpAmount": 50,
      "sourceId": null,
      "sourceType": null,
      "createdAt": "2026-05-07T00:00:00Z"
    }
  ],
  "pagination": { "cursor": "...", "hasMore": true }
}
```

### GET /gamification/badges

배지 목록 (획득 여부 포함)

```json
{
  "data": [
    {
      "code": "STREAK_7",
      "name": "일주일 전사",
      "description": "7일 연속 복습 달성",
      "iconUrl": "https://cdn.synapse.app/badges/streak7.png",
      "category": "streak",
      "xpReward": 100,
      "earned": true,
      "earnedAt": "2026-05-07T00:00:00Z"
    },
    {
      "code": "STREAK_30",
      "name": "30일 전사",
      "description": "30일 연속 복습 달성",
      "iconUrl": "https://cdn.synapse.app/badges/streak30.png",
      "category": "streak",
      "xpReward": 500,
      "earned": false,
      "earnedAt": null
    }
  ]
}
```

### GET /gamification/badges/{code}

배지 상세

### GET /gamification/leaderboard

리더보드 조회

```
GET /gamification/leaderboard?scope=weekly&limit=50
```

```json
{
  "data": {
    "scope": "weekly",
    "periodStart": "2026-05-04",
    "periodEnd": "2026-05-10",
    "myRank": 5,
    "entries": [
      {
        "rank": 1,
        "userId": "uuid",
        "displayName": "김시냅스",
        "avatarUrl": "...",
        "score": 850,
        "level": 15
      }
    ]
  }
}
```

### GET /gamification/leaderboard/group/{id}

그룹 리더보드 조회

```
GET /gamification/leaderboard/group/{id}?scope=weekly
```

### GET /gamification/levels

레벨 정의 목록

```json
{
  "data": [
    { "levelNumber": 1, "requiredXp": 0, "title": "새싹" },
    { "levelNumber": 2, "requiredXp": 100, "title": "탐험가" },
    { "levelNumber": 3, "requiredXp": 300, "title": "학습자" }
  ]
}
```

### GET /gamification/streak

스트릭 현황

```json
{
  "data": {
    "currentStreak": 7,
    "longestStreak": 21,
    "todayCompleted": true,
    "streakStartDate": "2026-05-01",
    "nextMilestone": {
      "days": 14,
      "badgeName": "2주 전사",
      "xpReward": 200
    }
  }
}
```

---

## 4.17 Notification 도메인

### GET /notifications

알림 목록 (커서 페이지네이션)

```
GET /notifications?limit=20&cursor=...&category=achievement
```

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "배지 획득!",
      "body": "일주일 전사 배지를 획득했습니다. +100 XP",
      "channel": "in_app",
      "category": "achievement",
      "dataJson": {
        "badgeCode": "STREAK_7",
        "badgeName": "일주일 전사"
      },
      "isRead": false,
      "createdAt": "2026-05-07T10:00:00Z"
    },
    {
      "id": "uuid",
      "title": "복습 알림",
      "body": "오늘 복습할 카드가 15장 있습니다.",
      "channel": "in_app",
      "category": "review_reminder",
      "dataJson": {
        "dueCount": 15,
        "deckName": "프로그래밍"
      },
      "isRead": true,
      "readAt": "2026-05-07T09:30:00Z",
      "createdAt": "2026-05-07T08:00:00Z"
    }
  ],
  "pagination": { "cursor": "...", "hasMore": true }
}
```

### PATCH /notifications/{id}/read

읽음 처리

```json
// Response 200
{
  "data": {
    "id": "uuid",
    "isRead": true,
    "readAt": "2026-05-07T12:00:00Z"
  }
}
```

### POST /notifications/read-all

전체 읽음 처리

```json
// Response 200
{
  "data": { "updatedCount": 12 }
}
```

### GET /notifications/unread-count

미읽은 알림 수 (Redis 캐시)

```json
{
  "data": { "unreadCount": 5 }
}
```

### GET /notifications/preferences

알림 설정 조회

```json
{
  "data": [
    {
      "category": "review_reminder",
      "pushEnabled": true,
      "emailEnabled": false,
      "inAppEnabled": true,
      "quietHoursStart": "23:00",
      "quietHoursEnd": "08:00"
    },
    {
      "category": "achievement",
      "pushEnabled": true,
      "emailEnabled": true,
      "inAppEnabled": true,
      "quietHoursStart": null,
      "quietHoursEnd": null
    }
  ]
}
```

### PUT /notifications/preferences

알림 설정 변경

```json
// Request
{
  "preferences": [
    {
      "category": "review_reminder",
      "pushEnabled": true,
      "emailEnabled": false,
      "inAppEnabled": true,
      "quietHoursStart": "23:00",
      "quietHoursEnd": "08:00"
    }
  ]
}
```

### POST /notifications/devices

디바이스 토큰 등록

```json
// Request
{
  "platform": "ios",
  "token": "FCM_OR_APNS_TOKEN_VALUE"
}

// Response 201
{
  "data": {
    "id": "uuid",
    "platform": "ios",
    "isActive": true,
    "createdAt": "2026-05-07T10:00:00Z"
  }
}
```

### DELETE /notifications/devices/{id}

토큰 삭제 (로그아웃 시 자동 호출 권장)

```json
// Response 204 No Content
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| v1.0 | 2026-05-07 | 최초 작성 — Auth, Tenant, Billing, Notes, Cards, SRS, Graph, AI, Stats, Import/Export, Admin, Audit 도메인 | Synapse Team |
| v1.1 | 2026-05-08 | Community, Gamification, Notification 도메인 추가. Admin 도메인 확장 (신고 관리, 공유 콘텐츠 모더레이션, 게이미피케이션 설정). expiresIn=900 확인 (Auth 4.2). | Synapse Team |
