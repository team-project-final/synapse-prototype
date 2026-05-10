
#### 개요
GitHub에 내장된 CI/CD 자동화 플랫폼으로, `.github/workflows/` YAML 파일로 파이프라인을 정의한다.

#### 역할 (Synapse 프로젝트 내)
- **CI 파이프라인**: PR 생성 시 자동으로 빌드, 단위 테스트, 린트, 커버리지 검사(80% 게이트) 실행
- **CD 파이프라인**: `main` 브랜치 머지 시 Docker 이미지 빌드 → AWS ECR 푸시 → K8s 매니페스트 이미지 태그 업데이트 (ArgoCD 트리거)
- 서비스별 독립 워크플로우로 변경된 서비스만 빌드 (path filter)
- 브랜치 보호 규칙: `main` 브랜치는 PR + CI 통과 필수
- Dependabot 연동: 의존성 자동 업데이트 PR 생성

#### 선택 이유
- GitHub 저장소와 완전 통합, 별도 CI 서버 운영 불필요
- Actions Marketplace의 풍부한 커뮤니티 액션 (AWS 인증, Docker 빌드 등)
- Reusable Workflows로 서비스 간 파이프라인 중복 제거
- GitHub OIDC로 AWS 자격증명 없이 ECR 푸시 (보안 강화)

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **GitHub Actions** | GitHub 통합, 무료 한도, 생태계 | 복잡한 파이프라인 한계 | **선택** |
| Jenkins | 유연성 극대화 | 운영 부담, 구식 UI | 미선택 |
| GitLab CI | 내장 기능 풍부 | GitHub 마이그레이션 필요 | 미선택 |
| CircleCI | 빠른 빌드 | 비용, GitHub 외부 | 미선택 |
| AWS CodePipeline | AWS 통합 | GitHub 연동 복잡, UI 불편 | 미선택 |

#### 기술적 이점
- **GitHub OIDC + AWS IAM**: 장기 자격증명(Access Key) 없이 ECR 푸시 가능 (보안)
- **Path Filter**: 변경된 서비스 디렉토리에 해당하는 워크플로우만 실행 (빌드 시간 단축)
- **Matrix Strategy**: 여러 서비스의 테스트를 병렬 실행
- **커버리지 게이트**: 80% 미만 시 PR 블록으로 코드 품질 강제

#### 설정 가이드

```yaml
# .github/workflows/ai-service-ci-cd.yml
name: AI Service CI/CD

on:
  push:
    branches: [main]
    paths: ['ai-service/**']
  pull_request:
    branches: [main]
    paths: ['ai-service/**']

env:
  ECR_REGISTRY: <AWS_ACCOUNT_ID>.dkr.ecr.ap-northeast-2.amazonaws.com
  IMAGE_NAME: ai-service

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Set up Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.12'
    - name: Install dependencies
      run: pip install -r ai-service/requirements.txt
    - name: Run tests with coverage
      run: |
        cd ai-service
        pytest --cov=. --cov-report=xml --cov-fail-under=80
    - name: Lint
      run: cd ai-service && ruff check .

  build-and-push:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      id-token: write   # OIDC
      contents: read
    steps:
    - uses: actions/checkout@v4
    - name: Configure AWS credentials (OIDC)
      uses: aws-actions/configure-aws-credentials@v4
      with:
        role-to-assume: arn:aws:iam::<ACCOUNT>:role/github-actions-ecr-push
        aws-region: ap-northeast-2
    - name: Build and push to ECR
      id: build
      uses: aws-actions/amazon-ecr-login@v2
      # ... docker build & push
    - name: Update K8s manifest image tag
      run: |
        cd synapse-manifests
        sed -i "s|ai-service:.*|ai-service:${{ github.sha }}|g" \
          overlays/production/kustomization.yaml
        git commit -am "chore: update ai-service image to ${{ github.sha }}"
        git push
```

#### 트러블슈팅

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| OIDC 인증 실패 | IAM Trust Policy 설정 오류 | `StringLike` 조건에 `repo:org/repo:*` 추가 |
| 커버리지 게이트 실패 | 테스트 누락 | 미커버리지 코드 확인 후 테스트 추가 |
| Path filter 미작동 | YAML 들여쓰기 오류 | `paths` 항목 검증 |
| ECR 이미지 용량 초과 | 라이프사이클 정책 미설정 | ECR 수명주기 정책 설정 (최근 10개 유지) |

#### Synapse 폴리레포 워크플로

Synapse는 4-서비스 폴리레포 + 미러 + GitOps 구조를 갖는다. 각 서비스 레포에 다음 GitHub Actions 워크플로를 둔다:

- **`mirror.yml`** — main push 시 `synapse-mirror` 레포로 자동 동기화 (rsync exclude 적용)
- **`ci.yml`** — Lint / 단위 테스트 / 통합 테스트 / 빌드 / SonarQube / Snyk / **ArchUnit + Spring Modulith** 모듈 경계 검증
- **`deploy.yml`** — image ECR 푸시 + `synapse-gitops`의 `kustomization.yaml` newTag bump

`synapse-shared` 레포에는 추가로:

- **`schema-check.yml`** — Avro `.avsc` PR 시 Confluent Schema Registry BACKWARD 호환성 검증

풀 워크플로 YAML과 PAT(`MIRROR_TOKEN` / `GITOPS_TOKEN`) 정책은 `09_Git_규칙_정의서` v2.0 §B2 / §B3 / §B4 / §B6 참조.

#### 참고 자료
- GitHub Actions 공식 문서: https://docs.github.com/en/actions
- AWS OIDC 연동: https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services

---
