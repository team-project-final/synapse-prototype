
#### 개요
ArgoCD는 Kubernetes를 위한 선언적 GitOps 지속적 배포(CD) 도구로, Git 저장소를 단일 진실 공급원(Single Source of Truth)으로 사용한다.

#### 역할 (Synapse 프로젝트 내)
- K8s 매니페스트 Git 저장소(`synapse-manifests`)를 지속적으로 감시하여 변경 사항을 자동 동기화
- GitHub Actions CI가 이미지 태그를 업데이트하면 ArgoCD가 자동 감지 후 롤아웃
- 롤백: 이전 Git 커밋으로 즉시 되돌리기 가능
- `synapse-prod`와 `synapse-staging` 두 환경을 별도 ArgoCD Application으로 관리
- Slack 알림: 배포 성공/실패 즉시 팀 채널 통보

#### 선택 이유
- GitOps 패턴으로 모든 배포 이력이 Git 커밋으로 추적됨 (감사 가능성)
- UI 대시보드에서 전체 서비스 배포 상태를 시각적으로 확인
- 드리프트(Drift) 감지: 수동 변경 사항을 자동 감지하고 Git 상태로 복원
- Helm/Kustomize 지원으로 환경별 값 주입 용이

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **ArgoCD** | UI, 드리프트 감지, K8s 네이티브 | 별도 설치 필요 | **선택** |
| Flux v2 | 경량, CLI 중심 | UI 없음, 학습 곡선 | 미선택 |
| Spinnaker | 다기능 파이프라인 | 복잡성 극대화, 리소스 과다 | 미선택 |
| Jenkins X | Jenkins 친숙 | 구식, 커뮤니티 축소 | 미선택 |
| GitHub Actions CD | 추가 도구 불필요 | 드리프트 감지 불가, kubectl 직접 호출 | 미선택 |

#### 기술적 이점
- **자동 동기화**: 매니페스트 변경 후 3분 이내 K8s 클러스터 반영
- **롤백**: `argocd app rollback synapse-prod --to-revision <번호>` 한 명령으로 즉시 복구
- **다중 환경 관리**: 단일 ArgoCD 인스턴스에서 prod/staging 동시 관리
- **RBAC**: ArgoCD 자체 RBAC으로 팀원별 배포 권한 세분화

#### 설정 가이드

```yaml
# argocd-app-prod.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: synapse-prod
  namespace: argocd
spec:
  project: synapse
  source:
    repoURL: https://github.com/synapse-team/synapse-manifests
    targetRevision: main
    path: overlays/production
    kustomize:
      images:
      - name: ai-service
        newTag: "1.2.3"
  destination:
    server: https://kubernetes.default.svc
    namespace: synapse-prod
  syncPolicy:
    automated:
      prune: true        # 삭제된 리소스 자동 제거
      selfHeal: true     # 드리프트 자동 복원
    syncOptions:
    - CreateNamespace=true
    - PrunePropagationPolicy=foreground
  notification:
    triggers:
    - on-sync-succeeded
    - on-sync-failed
    templates:
    - slack-deploy-notification
```

#### 트러블슈팅

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| Sync 실패 (OutOfSync) | 매니페스트 문법 오류 | `argocd app diff synapse-prod` 로 차이 확인 |
| 자동 동기화 미작동 | Webhook 미설정 | GitHub → ArgoCD webhook 설정 확인 |
| 롤백 후 재동기화 덮어씀 | selfHeal 활성화 | 롤백 후 Git도 함께 되돌려야 함 |
| 이미지 풀 실패 | ECR 인증 만료 | ECR credential helper 또는 `imagePullSecrets` 설정 |

#### ApplicationSet (Synapse 적용)

Synapse는 4개 서비스 레포(`platform-svc` / `engagement-svc` / `knowledge-svc` / `learning-svc`)를 기준으로 운영하되, `learning-svc`는 `learning-card`와 `learning-ai` 두 런타임으로 배포한다. 따라서 배포 단위는 5개 런타임 × 3개 환경(`dev` / `staging` / `prod`) = 15개 ArgoCD Application을 단일 **ApplicationSet matrix generator**로 정의한다.

| 환경 | autoSync | 트리거 |
|------|---|---|
| `dev` | `true` | 각 서비스 main push → image build → kustomization newTag bump → ArgoCD 자동 동기화 |
| `staging` | `false` | 수동 승인 |
| `prod` | `false` | 수동 승인 + 추가 검토 |

풀 ApplicationSet YAML과 deploy.yml의 GitOps 갱신 단계는 `09_Git_규칙_정의서` v2.0 §B3 참조.

#### 참고 자료
- ArgoCD 공식 문서: https://argo-cd.readthedocs.io/en/stable/
- GitOps 패턴: https://www.gitops.tech/

---
