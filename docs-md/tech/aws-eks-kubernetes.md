
#### 개요
AWS Elastic Kubernetes Service(EKS)는 AWS에서 관리하는 Kubernetes 서비스로, 컨트롤 플레인을 AWS가 운영하고 사용자는 워커 노드와 워크로드만 관리한다.

#### 역할 (Synapse 프로젝트 내)
- 11개 마이크로서비스의 프로덕션 배포 및 운영 환경
- 네임스페이스 분리: `synapse-prod` (프로덕션), `synapse-staging` (스테이징)
- HPA(Horizontal Pod Autoscaler)를 통한 서비스별 자동 스케일링
- ArgoCD를 통한 GitOps 기반 배포
- Istio 서비스 메시를 통한 서비스 간 mTLS 통신
- AWS ALB Ingress Controller로 외부 트래픽 라우팅

#### 선택 이유
- AWS 생태계(ECR, ALB, Secrets Manager, CloudWatch)와의 네이티브 통합
- 관리형 컨트롤 플레인으로 K8s 업그레이드, etcd 백업 등 운영 부담 제거
- EKS Managed Node Groups으로 워커 노드 패치 자동화
- 업계 표준 Kubernetes API 활용으로 이식성 확보

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **AWS EKS** | AWS 통합, 관리형, 안정성 | 비용, AWS 종속 | **선택** |
| GKE (Google) | Autopilot 모드, GCP 통합 | AWS 중심 팀에 낯섦 | 미선택 |
| AKS (Azure) | Azure 통합 | AWS 인프라 전환 비용 | 미선택 |
| 자체 K8s (kops) | 클라우드 독립 | 운영 부담 극대화 | 미선택 |
| ECS (Fargate) | 서버리스, 단순 | K8s 생태계 미활용 | 미선택 |

#### 기술적 이점
- **HPA**: CPU/메모리 기반 자동 스케일링으로 트래픽 급증 시 무중단 대응
- **롤링 업데이트**: `maxSurge: 1, maxUnavailable: 0` 설정으로 무중단 배포
- **리소스 격리**: 네임스페이스별 ResourceQuota로 스테이징이 프로덕션 리소스 침범 방지
- **Cluster Autoscaler**: 노드 수준 자동 스케일링으로 비용 최적화

#### 핵심 기능 — K8s 리소스 구성

| 서비스 | Replicas | CPU Request/Limit | Memory Request/Limit | HPA 범위 |
|--------|----------|-------------------|----------------------|----------|
| Gateway | 2 | 250m / 500m | 256Mi / 512Mi | 2~5 (CPU 70%) |
| Auth Service | 2 | 125m / 250m | 256Mi / 512Mi | 2~4 |
| Note Service | 2 | 250m / 500m | 512Mi / 1Gi | 2~6 |
| Card Service | 2 | 125m / 250m | 256Mi / 512Mi | 2~4 |
| Graph Service | 1 | 250m / 500m | 512Mi / 1Gi | 1~3 |
| AI Service | 2 | 500m / 1000m | 1Gi / 2Gi | 2~8 |
| Billing Service | 1 | 125m / 250m | 256Mi / 512Mi | 1~2 |
| Audit Service | 1 | 125m / 250m | 256Mi / 512Mi | 1~2 |
| Community Service | 1 | 125m / 250m | 256Mi / 512Mi | 1~3 |
| Gamification Service | 1 | 125m / 250m | 256Mi / 512Mi | 1~2 |
| Notification Service | 1 | 125m / 250m | 256Mi / 512Mi | 1~3 |

#### 설정 가이드

```yaml
# ai-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-service
  namespace: synapse-prod
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ai-service
  template:
    metadata:
      labels:
        app: ai-service
    spec:
      containers:
      - name: ai-service
        image: <ECR_URI>/ai-service:1.2.3
        resources:
          requests:
            cpu: "500m"
            memory: "1Gi"
          limits:
            cpu: "1000m"
            memory: "2Gi"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
        env:
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-service-secrets
              key: anthropic-api-key
---
# HPA 설정
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-service-hpa
  namespace: synapse-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-service
  minReplicas: 2
  maxReplicas: 8
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

#### 트러블슈팅

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| Pod CrashLoopBackOff | 애플리케이션 시작 실패 | `kubectl logs <pod> --previous` 로 이전 로그 확인 |
| OOMKilled | 메모리 한도 초과 | Memory Limit 상향, 메모리 누수 점검 |
| Pending 상태 | 노드 리소스 부족 | Cluster Autoscaler 동작 확인, 노드 추가 |
| Liveness Probe 실패 | 초기화 시간 부족 | `initialDelaySeconds` 증가 |
| HPA 스케일 미동작 | Metrics Server 미설치 | `kubectl apply -f metrics-server.yaml` |

#### 참고 자료
- EKS 공식 문서: https://docs.aws.amazon.com/eks/latest/userguide/
- HPA: https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/
- EKS Best Practices: https://aws.github.io/aws-eks-best-practices/

---
