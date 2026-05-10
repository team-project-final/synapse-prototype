# Part B — 레포 간의 규칙

### B1. 레포 구조 3-Tier

모든 레포 owner는 GitHub org `team-project-final`을 가정한다. 트랙↔레포 매핑은 §0.3에 1회 정의되며 본 절에서는 레포 측 책임만 다룬다.

#### 레포 인벤토리

```
[Tier 1: 서비스 레포 — 6개]
  team-project-final/synapse-platform-svc      (1명 owner — 트랙 A)
  team-project-final/synapse-engagement-svc    (1명 owner — 트랙 B)
  team-project-final/synapse-knowledge-svc     (2명 owner — 트랙 C)
  team-project-final/synapse-learning-svc      (2명 owner — 트랙 D, Java + Python)
  team-project-final/synapse-frontend          (Flutter, 트랙 협업)
  team-project-final/synapse-shared            (Avro 스키마, 공통 타입, 팀장 단독 관리)

[Tier 2: 미러 레포 — 1개]
  team-project-final/synapse-mirror            (자동 동기화, 검색·AI·백업)

[Tier 3: GitOps 레포 — 1개]
  team-project-final/synapse-gitops            (K8s manifest, ArgoCD ApplicationSet)

[기존 유지]
  team-project-final/documents                 (위키, 18개 설계 문서)
```

#### 레포 책임

| 레포 | 권한 | 직접 commit | 자동 동기화 |
|---|---|:---:|:---:|
| Tier 1 (각 서비스) | 트랙 + `@team-lead` | ✅ | — |
| Tier 2 미러 | `@team-lead` read, Action만 write | ❌ | 모든 Tier 1로부터 |
| Tier 3 GitOps | `@team-lead` + DevOps | ✅ (image tag) | 각 서비스 CI 자동 업데이트 |
| documents | `@team-lead` + 위키 작성자 | ✅ | — |

#### 레포 명명 규칙

```
Tier 1: synapse-{도메인}-svc
   ✅ synapse-platform-svc
   ✅ synapse-knowledge-svc

Tier 2: synapse-{용도}
   ✅ synapse-mirror

Tier 3: synapse-{용도}
   ✅ synapse-gitops

공유: synapse-{이름}
   ✅ synapse-shared
   ✅ synapse-frontend
```

### B2. 미러링 자동화 (synapse-mirror)

#### 목적

`synapse-mirror`는 모든 Tier 1 레포의 main 브랜치를 한 곳에 자동 동기화한 단일 레포다. 다음 4가지 목적을 갖는다:

1. **AI 도구 전체 코드 스캔** — Claude Code 등 AI 도구가 7명 팀의 모든 코드를 한 번에 컨텍스트로 사용
2. **사일로 방지** — 7명이 다른 트랙 코드를 쉽게 학습 (도메인 격리 위험 완화)
3. **백업** — GitHub 사고 시 복구 지점
4. **전체 검색** — ripgrep, grep으로 모든 서비스를 한 번에 검색

#### `mirror.yml` 워크플로 (각 Tier 1 레포의 `.github/workflows/mirror.yml`)

```yaml
name: Mirror to synapse-mirror

on:
  push:
    branches: [main]

jobs:
  mirror:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Checkout mirror repo
        uses: actions/checkout@v4
        with:
          repository: team-project-final/synapse-mirror
          token: ${{ secrets.MIRROR_TOKEN }}
          path: mirror

      - name: Sync
        run: |
          SERVICE_NAME="${{ github.event.repository.name }}"
          rm -rf mirror/services/$SERVICE_NAME
          mkdir -p mirror/services/$SERVICE_NAME
          rsync -av \
            --exclude='.git' \
            --exclude='mirror' \
            --exclude='node_modules' \
            --exclude='build' \
            --exclude='target' \
            --exclude='.gradle' \
            --exclude='__pycache__' \
            --exclude='.venv' \
            --exclude='.env*' \
            --exclude='*.key' \
            --exclude='*.pem' \
            ./ mirror/services/$SERVICE_NAME/

      - name: Commit
        run: |
          cd mirror
          git config user.email "actions@github.com"
          git config user.name "GitHub Actions"
          git add services/
          if git diff --staged --quiet; then
            echo "No changes"
          else
            git commit -m "🔄 Sync ${{ github.event.repository.name }} from ${{ github.sha }}"
            git push
          fi
```

#### rsync exclude 항목

`.git`, `node_modules`, `build`, `target`, `.gradle`, `__pycache__`, `.venv`, `.env*`, `*.key`, `*.pem`. 빌드 산출물·비밀·환경 파일은 절대 미러에 동기화되지 않는다.

#### ⚠️ 직접 commit 금지

`synapse-mirror`에는 사람이 직접 commit하지 않는다. Action만 write 권한을 갖는다. README 상단에 큰 경고를 두고 branch protection으로 강제한다 — 실수로 직접 commit해도 다음 미러링 동기화에서 덮어씌워지므로 작업 분실 위험이 크다.

### B3. GitOps 갱신 (synapse-gitops)

#### `synapse-gitops` 디렉토리 구조

```
synapse-gitops/
├── apps/
│   ├── platform-svc/
│   │   ├── base/
│   │   │   ├── deployment.yaml
│   │   │   ├── service.yaml
│   │   │   ├── istio-virtualservice.yaml
│   │   │   └── kustomization.yaml
│   │   └── overlays/
│   │       ├── dev/
│   │       ├── staging/
│   │       └── prod/
│   ├── engagement-svc/
│   ├── knowledge-svc/
│   ├── learning-card/      ← learning-svc 내 두 컨테이너 분리
│   └── learning-ai/
├── infra/
│   ├── istio/
│   ├── monitoring/         (Prometheus, Grafana, Loki, Jaeger)
│   ├── ingress/            (ALB Ingress)
│   └── external-secrets/   (External Secrets Operator)
├── argocd/
│   ├── applicationset.yaml
│   └── projects.yaml
└── RELEASE_NOTES.md
```

#### `deploy.yml`의 GitOps 갱신 단계 (각 서비스 레포 CI 마지막)

```yaml
- name: Build and push image to ECR
  run: |
    docker build -t $ECR_REGISTRY/$IMAGE_NAME:${{ github.sha }} .
    docker push $ECR_REGISTRY/$IMAGE_NAME:${{ github.sha }}

- name: Update GitOps repo
  uses: actions/checkout@v4
  with:
    repository: team-project-final/synapse-gitops
    token: ${{ secrets.GITOPS_TOKEN }}
    path: gitops

- name: Bump image tag (dev environment)
  run: |
    cd gitops/apps/${{ github.event.repository.name }}/overlays/dev
    yq -i '.images[0].newTag = "${{ github.sha }}"' kustomization.yaml
    git config user.email "actions@github.com"
    git config user.name "GitHub Actions"
    git add . && git commit -m "Bump ${{ github.event.repository.name }} to ${{ github.sha }}"
    git push
```

→ ArgoCD가 GitOps 레포 변경 감지 → EKS dev 환경 자동 배포
→ staging / prod 는 수동 승인 또는 별도 워크플로

#### ApplicationSet 정책 (요약)

- **dev**: `autoSync: true` — main push → image build → GitOps 갱신 → 자동 배포
- **staging**, **prod**: `autoSync: false` — 수동 승인 필요

> ApplicationSet 풀 YAML(matrix 제너레이터 + 5개 서비스 × 3개 환경 매트릭스)은 `SYNAPSE_Git_Rules_Polyrepo_Supplement.md` §9.3 참조.

#### dev/staging/prod overlay 분기

각 환경 overlay에서 `image newTag` / 리소스 한도 / 환경 변수를 분기한다. 풀 예시는 `SYNAPSE_Git_Rules_Polyrepo_Supplement.md` §9.2 참조.

### B4. Schema Registry (synapse-shared)

이벤트 기반 4-서비스 아키텍처에서 Schema Registry는 **필수**다. JSON으로 시작했다가 Avro로 전환하는 패턴은 진화 호환성을 깨뜨려 운영 사고로 이어진다.

#### 스키마 위치 (`synapse-shared` 안)

```
synapse-shared/
└── src/main/avro/
    ├── platform/
    │   ├── UserRegistered.avsc
    │   └── BillingSubscriptionChanged.avsc
    ├── knowledge/
    │   ├── NoteCreated.avsc
    │   ├── NoteUpdated.avsc
    │   ├── NoteDeleted.avsc
    │   └── GraphNotesLinked.avsc
    ├── learning/
    │   ├── CardReviewed.avsc
    │   └── CardReviewDue.avsc
    ├── engagement/
    │   ├── CommunityDeckShared.avsc
    │   ├── CommunityNoteShared.avsc
    │   ├── CommunityGroupCreated.avsc
    │   ├── CommunityGroupJoined.avsc
    │   ├── CommunityReportCreated.avsc
    │   ├── GamificationXpEarned.avsc
    │   ├── GamificationBadgeEarned.avsc
    │   ├── GamificationLevelUp.avsc
    │   └── NotificationSend.avsc
    └── shared/
        ├── TenantId.avsc
        ├── UserId.avsc
        └── CloudEventEnvelope.avsc
```

#### 호환성 모드

```yaml
# Schema Registry 글로벌 설정
default_compatibility: BACKWARD

# Subject별 override (필요 시 보다 엄격하게)
subjects:
  Knowledge.events-value:
    compatibility: BACKWARD_TRANSITIVE  # Note는 핵심 도메인이므로 더 엄격
```

#### 스키마 변경 PR 절차

```
1. synapse-shared에 PR 생성 (변경 .avsc)
2. CI가 Schema Registry와 호환성 검증 (BACKWARD)
3. 영향 받는 서비스 트랙 owner 모두 approve
4. @team-lead 최종 승인
5. 머지 시 Schema Registry 자동 등록 (CI/CD)
6. 영향 받는 서비스 PR도 동시 또는 직후 머지
```

#### ⚠️ 절대 금지

```
❌ 호환성 모드 NONE 사용
❌ 필드 이름 변경 (aliases 사용 의무)
❌ default 값 없는 필드 추가
❌ enum 값 제거
❌ 필수 필드 삭제
```

> `schema-check.yml` 워크플로 풀 YAML은 `SYNAPSE_Git_Rules_Polyrepo_Supplement.md` §5.4 참조.

### B5. 통합 배포 태그 (synapse-gitops/v{날짜})

#### 2-축 태그 모델

각 서비스의 SemVer는 그 서비스의 변경 추적이다. 통합 배포 태그는 **운영 시점 식별**이다. 두 축은 독립적이며 서로 대체하지 않는다.

#### 통합 태그 형식

`synapse-gitops` 레포에 다음 형식으로 태그를 단다:

```
synapse-gitops/v{YYYY}.{MM}.{DD}     예: synapse-gitops/v2026.05.10
   ↓ 이 시점의 모든 서비스 image tag 묶음:
   - platform-svc:    v1.2.3 (sha: abc123)
   - engagement-svc:  v0.8.1 (sha: def456)
   - knowledge-svc:   v2.1.0 (sha: ghi789)
   - learning-card:   v1.5.7 (sha: jkl012)
   - learning-ai:     v0.9.2 (sha: mno345)
```

→ "어느 시점에 무엇이 배포됐나" 추적
→ 롤백 시 이 태그로 복원

#### 롤백 절차

```
1. 복원 대상 통합 태그 식별 (예: synapse-gitops/v2026.05.03)
2. synapse-gitops 레포에서 해당 태그 checkout
3. 영향 받는 환경 overlay의 kustomization.yaml을 태그 시점 상태로 갱신 (또는 reverting commit)
4. ArgoCD 동기화 → EKS가 이전 image sha로 롤백
5. 롤백 사유와 결과를 RELEASE_NOTES.md에 기록
```

#### `RELEASE_NOTES.md`

`synapse-gitops` 안에 위치한다. 각 통합 태그별로 다음을 기록한다:

- 태그 이름 (예: `v2026.05.10`)
- 배포 일시
- 묶인 서비스별 SemVer + sha
- 주요 변경 묶음 (각 서비스 CHANGELOG의 핵심 항목 요약)
- 롤백 정보 (해당 시)

### B6. PAT (Personal Access Token) 정책

#### 토큰 인벤토리

| 토큰 이름 | 권한 | 대상 레포 | 보관 위치 |
|---|---|---|---|
| `MIRROR_TOKEN` | Contents: write | synapse-mirror | 각 서비스 레포 secrets |
| `GITOPS_TOKEN` | Contents: write | synapse-gitops | 각 서비스 레포 secrets |
| `ECR_PUSH` | AWS ECR push | (AWS 권한) | GitHub Actions OIDC |
| `SCHEMA_REGISTRY_*` | Schema Registry 인증 | (외부 인프라) | synapse-shared secrets |

#### ⚠️ 보안 규칙

```
✅ 무조건 fine-grained PAT (Classic 금지)
✅ 최소 권한 (Contents: write만, Repository 한정)
✅ 만료일 90일 이내 (3개월 1회 갱신)
✅ 갱신 알림 자동화 (만료 7일 전)
✅ @team-lead만 발급 권한
❌ Personal account의 토큰을 organization secrets에 저장 X
   → 가능하면 GitHub App 도입 검토 (미래 옵션)
```

#### 토큰 갱신 절차

```
1. 만료 7일 전 알림 (GitHub 자동)
2. @team-lead가 새 토큰 발급 (fine-grained, 동일 권한)
3. 각 서비스 레포 secrets 업데이트
4. 미러링/GitOps 워크플로 1회 수동 트리거 (검증)
5. 옛 토큰 revoke
```

---
