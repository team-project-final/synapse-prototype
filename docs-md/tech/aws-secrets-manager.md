
#### 개요
AWS Secrets Manager는 DB 패스워드, API 키, OAuth 시크릿 등 민감한 자격증명을 안전하게 저장, 관리, 자동 교체하는 AWS 관리형 서비스이다.

#### 역할 (Synapse 프로젝트 내)
- **저장 대상**: PostgreSQL/Redis 비밀번호, Anthropic/OpenAI API 키, Stripe 키, Google/GitHub/Apple/Microsoft OAuth 시크릿, FCM 서비스 계정 JSON, APNs P8 키
- **K8s 연동**: External Secrets Operator(ESO)가 Secrets Manager 값을 K8s Secret으로 자동 동기화 (1시간 주기)
- **자동 교체**: DB 비밀번호 90일 주기 자동 교체 (Lambda 함수 기반)
- **접근 감사**: 모든 시크릿 접근 CloudTrail 기록
- 환경별 경로 분리: `synapse/production/*`, `synapse/staging/*`

#### 선택 이유
- K8s External Secrets Operator와 네이티브 통합 → Pod 재시작 없이 시크릿 갱신 가능
- IAM 역할 기반 접근으로 자격증명 없는 안전한 조회
- 자동 교체 기능으로 장기 자격증명 노출 위험 최소화
- CloudTrail 감사로 시크릿 접근 이력 완전 추적

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **AWS Secrets Manager** | AWS 통합, 자동 교체, ESO 연동 | 비용($0.40/시크릿/월), AWS 종속 | **선택** |
| HashiCorp Vault | 클라우드 독립, 강력한 기능 | 운영 부담, 고가용성 구성 복잡 | 미선택 |
| AWS Parameter Store | 무료 (기본 등급) | 자동 교체 없음, 용량 제한 | 미선택 |
| K8s Secrets (기본) | 단순 | base64 인코딩만, 암호화 추가 필요 | 미선택 |
| Doppler | 개발자 친화적 UI | 외부 SaaS, AWS 통합 추가 설정 | 미선택 |

#### 설정 가이드

```yaml
# External Secrets Operator - ExternalSecret 리소스
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: ai-service-secrets
  namespace: synapse-prod
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: ai-service-secrets
    creationPolicy: Owner
  data:
  - secretKey: anthropic-api-key
    remoteRef:
      key: synapse/production/anthropic
      property: apiKey
  - secretKey: openai-api-key
    remoteRef:
      key: synapse/production/openai
      property: apiKey
---
# ClusterSecretStore (IAM IRSA 기반)
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: aws-secrets-manager
spec:
  provider:
    aws:
      service: SecretsManager
      region: ap-northeast-2
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
            namespace: external-secrets
```

```bash
# 시크릿 생성
aws secretsmanager create-secret \
  --name synapse/production/anthropic \
  --secret-string '{"apiKey":"sk-ant-..."}' \
  --region ap-northeast-2

# 90일 자동 교체 설정 (PostgreSQL)
aws secretsmanager rotate-secret \
  --secret-id synapse/production/postgres \
  --rotation-lambda-arn arn:aws:lambda:ap-northeast-2:...:function:rotate-postgres \
  --rotation-rules AutomaticallyAfterDays=90
```

#### 트러블슈팅

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| ESO 동기화 실패 | IAM 권한 부족 | ESO 서비스 계정 역할에 `secretsmanager:GetSecretValue` 추가 |
| 시크릿 갱신 지연 | refreshInterval 긴 설정 | 즉시 갱신: `kubectl annotate es ai-service-secrets force-sync=$(date +%s)` |
| 자동 교체 실패 | Lambda 오류 | CloudWatch Logs에서 교체 Lambda 오류 확인 |
| 비용 과다 | 고빈도 조회 | ESO 캐싱 활용, refreshInterval 1h 이상 설정 |

#### 참고 자료
- AWS Secrets Manager: https://docs.aws.amazon.com/secretsmanager/latest/userguide/
- External Secrets Operator: https://external-secrets.io/latest/provider/aws-secrets-manager/
- 자동 교체: https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html

---
