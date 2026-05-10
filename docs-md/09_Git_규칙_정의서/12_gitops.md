# 미러링/GitOps 영향

- [ ] 자동 미러링 정상 (services/{name}/ 갱신 확인)
- [ ] GitOps image tag 자동 업데이트 정상
- [ ] (해당 없음)
```

#### 승인 정책

| 변경 종류 | 최소 승인 | 비고 |
|---|---|---|
| 일반 feature/fix | `@team-lead` + 트랙 owner 1명 | 기존 1명 → 2명으로 강화 |
| Auth/보안 변경 | `@team-lead` + `@platform-owner` | 보안 이중 승인 |
| Shared 라이브러리 | `@team-lead` 단독 | 영향 범위 큼 |
| Avro 스키마 변경 | `@team-lead` + 영향 받는 트랙 owner | 호환성 검증 필수 |
| GitOps 변경 | `@team-lead` 단독 | 운영 직결 |
| Hotfix | `@team-lead` 단독 | 긴급성 |
| Frontend (UI) | `@team-lead` + 트랙 owner | 평소대로 |

#### PR 규칙 (공통)

| 항목 | 규칙 |
|------|------|
| CI 통과 | 모든 CI 파이프라인 성공 필수 |
| 충돌 해결 | 머지 전 충돌 없음 확인 |
| 크기 제한 | 변경 파일 400줄 이하 권장 (초과 시 분할) |
| 리뷰 응답 | 24시간 이내 첫 리뷰 |
| 머지 방식 | Squash and Merge (feature), Merge Commit (hotfix) |
| 라벨 | `size/S`, `size/M`, `size/L`, `priority/high` 등 |

#### 자동화 (GitHub Actions, PR 생성 시 자동 실행)

기존 자동화:
- Lint (ESLint, ktlint, dartanalyzer)
- 단위 테스트
- 통합 테스트 (Testcontainers)
- 빌드 검증
- 코드 커버리지 리포트
- SonarQube 분석
- Snyk 보안 스캔

폴리레포 신규 자동화:
- **ArchUnit + Spring Modulith** — 모듈 경계 위반 차단 (Java 서비스)
- **Schema Registry 호환성** — Avro 스키마 변경 PR 시 BACKWARD 호환성 검증
- **미러링** — main push 시 `synapse-mirror`로 자동 동기화 (Part B2)
- **GitOps 갱신** — image build 후 `synapse-gitops`의 image tag 자동 update (Part B3)

### A4. CODEOWNERS

각 레포는 자신의 `.github/CODEOWNERS`에 명시적 owner를 둔다. `@team-lead` cross-review로 도메인 사일로화를 막고, 보안 민감 영역은 이중 승인을 강제한다. 영문 placeholder는 §0.3 매핑표 정의를 따른다.

#### synapse-platform-svc

```
*                  @team-lead @platform-owner
/auth/             @team-lead @platform-owner   ← 보안 도메인은 팀장 cross-review 필수
/billing/          @platform-owner @team-lead
/audit/            @platform-owner
/notification/     @platform-owner
```

#### synapse-engagement-svc

```
*                  @team-lead @engagement-owner
/community/        @engagement-owner
/gamification/     @engagement-owner
```

#### synapse-knowledge-svc

```
*                  @team-lead @knowledge-owner-1 @knowledge-owner-2
/note/             @knowledge-owner-1 @knowledge-owner-2
/graph/            @knowledge-owner-2 @knowledge-owner-1
/chunking/         @knowledge-owner-2 @team-lead
```

#### synapse-learning-svc

```
*                  @team-lead @learning-card-owner @learning-ai-owner
/learning-card/    @learning-card-owner @learning-ai-owner   ← Java
/learning-ai/      @learning-ai-owner @learning-card-owner   ← Python
```

#### synapse-shared

```
*                  @team-lead     ← shared는 팀장 단독 승인 (안정성)
```

#### synapse-gitops

```
*                  @team-lead     ← 운영 직결 (단독 승인)
/apps/platform/    @team-lead @platform-owner
/apps/engagement/  @team-lead @engagement-owner
/apps/knowledge/   @team-lead @knowledge-owner-1 @knowledge-owner-2
/apps/learning/    @team-lead @learning-card-owner @learning-ai-owner
```

#### synapse-mirror

```
*                  @team-lead     ← 직접 commit 금지 (Action만 write 권한, branch protection)
```

#### synapse-frontend

```
*                  @team-lead @platform-owner @engagement-owner @knowledge-owner-1 @knowledge-owner-2 @learning-card-owner @learning-ai-owner   ← 전 트랙 협업
```

#### ⚠️ 핵심 변경

```
원안: * @synapse-team
변경: 각 서비스에 명시적 owner + @team-lead cross-review

이유:
- 7명 풀스택이 도메인 사일로화 방지
- 모든 PR을 팀장이 검토 (아키텍처 일관성)
- 보안 민감 영역(Auth)은 이중 승인 강제
- 서비스 간 결합도 변경(shared) 시 팀장만 승인
```

> Day 1 운영 전환 시 위 영문 placeholder를 실제 GitHub handle 또는 Team mention(`@team-project-final/<team-name>`)으로 일괄 치환한다.

### A5. 릴리즈 / 태깅 (서비스별 SemVer)

각 Tier 1 레포는 **독립적으로** SemVer 태그를 단다. 운영 시점을 식별하는 통합 배포 태그는 `synapse-gitops`에 별도로 두며, 그 규칙은 Part B5에서 다룬다.

#### SemVer 형식

```
v{MAJOR}.{MINOR}.{PATCH}[-{pre-release}]
```

| 구분 | 변경 시점 | 예시 |
|------|-----------|------|
| MAJOR | 호환되지 않는 API 변경 | v2.0.0 |
| MINOR | 하위 호환 기능 추가 | v1.1.0 |
| PATCH | 하위 호환 버그 수정 | v1.0.1 |
| Pre-release | 사전 릴리즈 | v1.1.0-beta.1 |

#### 서비스별 SemVer (예시)

```
synapse-platform-svc:    v1.2.3
synapse-engagement-svc:  v0.8.1
synapse-knowledge-svc:   v2.1.0
synapse-learning-svc:    v1.5.7
synapse-shared:          v0.4.2
```

#### 릴리즈 프로세스 (서비스별)

```
1. 각 서비스 main에서 릴리즈 준비 (CHANGELOG.md 갱신)
2. 서비스 SemVer 태그 (예: git tag -a v1.2.3 -m "Release v1.2.3")
3. CI가 ECR 이미지 빌드 + 푸시 (sha + SemVer 태그)
4. CI가 synapse-gitops의 dev overlay kustomization.yaml에서 newTag bump
5. ArgoCD가 dev 자동 동기화 / staging·prod는 수동 승인
```

#### CHANGELOG

각 Tier 1 레포에 `CHANGELOG.md` 파일을 둔다. 통합 배포 시점 묶음 기록은 `synapse-gitops/RELEASE_NOTES.md`에 모은다 (Part B5 참조).

```markdown
