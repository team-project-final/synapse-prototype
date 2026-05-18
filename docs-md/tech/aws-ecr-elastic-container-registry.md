
#### 개요
AWS Elastic Container Registry(ECR)는 Docker 컨테이너 이미지를 안전하게 저장, 관리, 배포하는 AWS 관리형 컨테이너 레지스트리이다.

#### 역할 (Synapse 프로젝트 내)
- 4개 서비스 레포와 learning-svc 내부 런타임의 Docker 이미지 저장소
- GitHub Actions CI에서 빌드된 이미지를 `<account>.dkr.ecr.ap-northeast-2.amazonaws.com/synapse/<service>:<tag>` 형식으로 푸시
- EKS 노드에서 이미지 풀 (IAM 역할 기반 인증, 별도 자격증명 불필요)
- 이미지 취약점 스캔 (ECR Enhanced Scanning, Inspector 연동)
- 수명주기 정책: 서비스당 최신 10개 이미지만 유지 (비용 절감)

#### 선택 이유
- EKS와 동일 AWS 계정 내에서 네트워크 트래픽 없이(VPC 엔드포인트) 이미지 풀 가능
- IAM 역할 기반 인증으로 자격증명 관리 불필요
- ECR Enhanced Scanning으로 CVE 취약점 자동 감지
- AWS KMS로 이미지 암호화 지원

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **AWS ECR** | AWS 통합, IAM 인증, VPC 내부 전송 | AWS 종속 | **선택** |
| Docker Hub | 무료 공개 이미지 풍부 | 프라이빗 이미지 유료, Rate Limit | 미선택 |
| GitHub Container Registry | GitHub 통합 | AWS IAM 연동 추가 설정 필요 | 미선택 |
| Harbor (자체 호스팅) | 완전 제어, 기업용 기능 | 운영 부담 | 미선택 |

#### 설정 가이드

```bash
# ECR 레포지토리 생성 (서비스별)
aws ecr create-repository \
  --repository-name synapse/ai-service \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=KMS \
  --region ap-northeast-2

# 수명주기 정책 (최신 10개 유지)
aws ecr put-lifecycle-policy \
  --repository-name synapse/ai-service \
  --lifecycle-policy-text '{
    "rules": [{
      "rulePriority": 1,
      "selection": {
        "tagStatus": "tagged",
        "tagPrefixList": ["main-"],
        "countType": "imageCountMoreThan",
        "countNumber": 10
      },
      "action": {"type": "expire"}
    }]
  }'

# GitHub Actions에서 ECR 로그인 (OIDC)
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin \
  <account>.dkr.ecr.ap-northeast-2.amazonaws.com
```

#### 트러블슈팅

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| 이미지 풀 인증 실패 | EKS 노드 IAM 역할 권한 누락 | `ecr:GetDownloadUrlForLayer` 등 ECR 권한 추가 |
| 이미지 푸시 실패 | 레포지토리 미생성 | `aws ecr describe-repositories` 로 확인 |
| 스캔 취약점 다수 | 베이스 이미지 구버전 | `python:3.12-slim` 등 최신 버전으로 갱신 |

#### 참고 자료
- ECR 공식 문서: https://docs.aws.amazon.com/ecr/latest/userguide/
- EKS ECR 연동: https://docs.aws.amazon.com/AmazonECR/latest/userguide/ECR_on_EKS.html

---
