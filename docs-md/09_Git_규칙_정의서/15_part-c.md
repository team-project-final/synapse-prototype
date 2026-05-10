# Part C — 운영

### C1. Day 1 셋업 체크리스트

#### GitHub 셋업

- [ ] 6개 Tier 1 레포 생성
  - [ ] synapse-platform-svc
  - [ ] synapse-engagement-svc
  - [ ] synapse-knowledge-svc
  - [ ] synapse-learning-svc (모노레포 — Java + Python)
  - [ ] synapse-frontend (Flutter)
  - [ ] synapse-shared
- [ ] synapse-mirror 레포 생성 (private)
- [ ] synapse-gitops 레포 생성 (private)
- [ ] 각 레포에 CODEOWNERS 추가 (§A4 영문 placeholder를 실제 handle로 치환)
- [ ] Branch protection (main: PR 필수, 2 approval)
- [ ] PAT 발급 (`MIRROR_TOKEN`, `GITOPS_TOKEN`)
- [ ] 각 서비스 레포 secrets에 PAT 등록

#### 인프라 셋업

- [ ] AWS EKS 클러스터 (synapse-prod, synapse-staging, synapse-dev)
- [ ] ECR 레포지토리 (서비스별 6개)
- [ ] RDS PostgreSQL (Multi-AZ + pgvector)
- [ ] MSK (Kafka) 또는 Confluent Cloud
- [ ] Confluent Schema Registry
- [ ] ElastiCache Redis Cluster
- [ ] Elasticsearch (OpenSearch on AWS)
- [ ] AWS Secrets Manager + External Secrets Operator
- [ ] ArgoCD 설치 + GitOps 레포 연동
- [ ] Istio 설치 (mTLS)

#### 워크플로 셋업

- [ ] 각 서비스 레포에 `mirror.yml` 추가 (Part B2)
- [ ] 각 서비스 레포에 `ci.yml` + `deploy.yml` (GitOps 갱신, Part B3)
- [ ] synapse-shared에 `schema-check.yml` 추가 (Part B4)
- [ ] synapse-gitops에 ApplicationSet 정의

#### 첫 코드 작성

- [ ] synapse-shared: 첫 Avro 스키마 (`UserRegistered.avsc`)
- [ ] 각 서비스 레포: Spring Boot/FastAPI 골격 + Hello World
- [ ] 첫 미러링 동작 확인 (synapse-mirror에 services/{name}/ 등장)
- [ ] 첫 GitOps 자동 갱신 동작 확인 (synapse-gitops kustomization newTag bump)

### C2. 흔한 트랩 10가지

#### 트랩 1: PAT 권한 너무 넓음
- 증상: classic PAT를 secrets에 저장
- 결과: 토큰 유출 시 전 시스템 위험
- 해법: fine-grained PAT, 대상 레포만, Contents: write만

#### 트랩 2: 미러 레포에 직접 commit
- 증상: "여기서도 수정 가능" 하고 직접 변경
- 결과: 다음 미러링 시 덮어씌워짐
- 해법: README에 큰 경고 + branch protection (Action만 write)

#### 트랩 3: Submodule 시도
- 증상: Tier 3에 Submodule 도입
- 결과: K8s 환경에서 시대착오. 학습 부담만 큼
- 해법: 무조건 GitOps 패턴 (Kustomize image tag)

#### 트랩 4: Schema Registry 없이 Kafka 시작
- 증상: JSON 메시지로 시작, 나중에 Avro로 전환 시도
- 결과: 진화 호환성 깨짐, 운영 사고
- 해법: 처음부터 Schema Registry + Avro

#### 트랩 5: 1인 1서비스 안티패턴 부활
- 증상: "트랙 X 멤버가 X 서비스 PR 다 봐도 OK"
- 결과: 사일로화. 휴가 시 마비
- 해법: `@team-lead` cross-review 강제 (CODEOWNERS)

#### 트랩 6: GitOps 레포에 secret 커밋
- 증상: K8s Secret yaml에 평문 비밀번호
- 결과: 보안 사고
- 해법: External Secrets Operator + AWS Secrets Manager. 또는 SOPS 암호화

#### 트랩 7: 너무 많은 레포
- 증상: shared 라이브러리를 5개로 분리
- 결과: 의존성 관리 폭발
- 해법: synapse-shared 1개로 통일. 정말 필요할 때만 분리

#### 트랩 8: 빌드 산출물 미러링
- 증상: target/, build/, node_modules/ 가 mirror에
- 결과: 미러 레포 거대화
- 해법: rsync exclude 명시 (Part B2)

#### 트랩 9: 호환성 모드 NONE 사용
- 증상: "검증 귀찮으니 NONE"
- 결과: 한 달 후 Consumer 폭발
- 해법: 무조건 BACKWARD 이상

#### 트랩 10: 통합 배포 태그 누락
- 증상: 각 서비스 SemVer만 관리, GitOps 태그 없음
- 결과: "어느 시점에 무엇이 배포됐나" 모름. 롤백 어려움
- 해법: synapse-gitops에 v{날짜} 태그 강제 (Part B5)

### C3. FAQ

#### Q1. 왜 Submodule 안 쓰나?
> K8s + ArgoCD 환경에선 GitOps가 정석. Submodule은 다음 단점:
> - K8s manifest 관리에 부적합
> - 학습 곡선 높음 (`git clone --recursive` 필수)
> - 7명 팀에 운영 부담
>
> 대신 GitOps 레포에 Kustomize image tag로 버전 핀.

#### Q2. 미러 레포가 정말 필요한가?
> 7명 팀 + 6개 서비스 레포 = 흩어진 코드. 미러는:
> - Claude Code 등 AI 도구가 전체 코드를 한 번에 봄
> - 7명이 다른 트랙 코드를 학습 (사일로 방지)
> - GitHub 사고 시 백업
> - ripgrep, grep으로 전체 검색
>
> 자동 동기화라 운영 부담 0. 매우 권장.

#### Q3. 모든 서비스가 같은 SemVer를 가져야 하나?
> 아니. 서비스별 독립 SemVer. 운영 배포 시점만 GitOps 통합 태그(`synapse-gitops/v{YYYY}.{MM}.{DD}`)로 식별.

#### Q4. Frontend는 왜 별도 레포?
> Flutter 빌드 환경이 다름. 또한 모든 트랙이 협업하는 영역이라 별도 레포가 깔끔.

#### Q5. shared 레포는 안전한가?
> Avro 스키마 변경은 호환성 검증으로 안전. 단, **`@team-lead` 단독 승인** + Schema Registry **BACKWARD** 강제.

### C4. 시리즈·위키 문서 매핑

#### 시리즈 문서 매핑

| 시리즈 문서 | 본 09에서의 적용 |
|---|---|
| #1 SCS | 4개 서비스 = 4개 SCS 폴리레포 (Part B1) |
| #3 Outbox | 각 서비스의 Kafka 발행 (이벤트·스키마는 Part B4) |
| #5 Inbox | 각 서비스의 Kafka 소비 |
| #11 Schema Registry | synapse-shared 안 Avro + 호환성 검증 (Part B4) |
| #12 Hybrid Repo Strategy | 3-Tier 하이브리드의 K8s 변형 (Part B1) |

#### 위키 문서 매핑 (후속 갱신 항목 명시)

| 문서 | 후속 갱신 사항 |
|---|---|
| `03_프로젝트_아키텍처_정의서` | 10개 서비스 그림 → 4개 서비스로 재구성. K8s 리소스 표 갱신 |
| `10_환경_설정_템플릿` | docker-compose 4개 서비스로 재작성 |
| `14_배포_가이드` | GitOps + ArgoCD ApplicationSet 흐름 명시 |
| `17_스케줄` | Phase 1~4 일정과 트랙 분배(§0.3 매핑)와 정합성 정리 |
| `18_기술_스택_정의서` | Schema Registry, Spring Modulith, ArgoCD ApplicationSet 추가 |

> 본 09 v2.0 채택 직후 위 5개 문서를 별도 spec → plan → 구현 사이클로 처리한다.

---
