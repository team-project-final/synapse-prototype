### 10.1 전체 기술 스택 요약표

| 레이어 | 기술 | 버전 | 역할 | 대안 | 선택 이유 |
|--------|------|------|------|------|-----------|
| **클라이언트** | Flutter | 3.x | 크로스플랫폼 UI (Web/iOS/Android) | React Native, SwiftUI | 단일 코드베이스로 3플랫폼 지원 |
| **클라이언트** | Dart | 3.x | Flutter 언어 | TypeScript, Kotlin | Flutter 공식 언어 |
| **클라이언트** | flutter_riverpod | 3.0.x | 상태 관리 | flutter_bloc, Provider | 적은 보일러플레이트, 컴파일 타임 안전, 자동 dispose |
| **게이트웨이** | Spring Cloud Gateway | 5.x | API Gateway (JWT, Rate Limit, 라우팅) | Kong, Nginx, AWS API GW | Spring 생태계 통합, Reactive |
| **게이트웨이** | Resilience4j | 2.x | Circuit Breaker | Hystrix | Spring Boot 4 네이티브 지원 |
| **백엔드** | Spring Boot | 4.x | 4개 굵은 서비스와 Java 런타임 프레임워크 | Quarkus, Micronaut | 팀 친숙도, 생태계 성숙도 |
| **백엔드** | Java | 21 (LTS) | Spring Boot 런타임 | Kotlin, Scala | Virtual Threads, 안정성 |
| **백엔드** | FastAPI | 0.136.x | AI Service (Python 비동기) | Flask, Django | 비동기 I/O, OpenAPI 자동 생성 |
| **백엔드** | Python | 3.12 | AI Service 언어 | Go, Node.js | AI/ML 라이브러리 생태계 최적 |
| **데이터베이스** | PostgreSQL | 16 | 주 관계형 DB (멀티테넌시 + RLS) | MySQL, MariaDB | pgvector, JSONB, RLS 지원 |
| **데이터베이스** | pgvector | 0.8.x | 벡터 임베딩 저장 및 ANN 검색 | Pinecone, Weaviate | PostgreSQL 내장, 추가 인프라 불필요 |
| **캐시** | Redis | 7 (Cluster) | 세션, Rate Limit, 캐시, Pub/Sub | Memcached, Hazelcast | 다양한 자료구조, Cluster 모드 |
| **검색** | Elasticsearch | 8.x | 전문 검색 (nori 한국어 형태소) | OpenSearch, Typesense | 한국어 nori 플러그인 완성도 |
| **메시징** | Apache Kafka | 3.x | 이벤트 스트리밍 (18개 토픽) | RabbitMQ, AWS SQS | 높은 처리량, 이벤트 소싱 |
| **스토리지** | AWS S3 | - | 첨부파일 오브젝트 스토리지 | GCS, Azure Blob | AWS 생태계, Presigned URL |
| **AI/LLM** | Anthropic Claude | 3.5 Sonnet/Haiku | 카드 생성, 요약, Q&A 응답 | GPT-4o, Gemini | 긴 컨텍스트, 프롬프트 캐싱, 비용 |
| **AI/임베딩** | OpenAI Embeddings | text-embedding-3-small | 1536차원 벡터 생성 | Cohere, BGE-M3 | 저비용, 한국어 품질, 안정성 |
| **AI/아키텍처** | RAG Pipeline | - | 하이브리드 검색 기반 Q&A | 순수 LLM, LlamaIndex | 환각 감소, 인프라 재사용 |
| **AI/캐시** | Semantic Cache | - | LLM 호출 비용 절감 (SHA-256 + 코사인) | GPTCache | 커스텀 구현으로 완전 제어 |
| **컨테이너** | Docker | 27.x | 컨테이너 이미지 빌드 및 실행 | Podman | 표준, K8s 호환 |
| **컨테이너** | Docker Compose | 2.x | 로컬 개발 환경 오케스트레이션 | Podman Compose | 팀 표준, healthcheck 지원 |
| **오케스트레이션** | AWS EKS | 1.30+ | 관리형 Kubernetes 프로덕션 환경 | GKE, AKS, ECS | AWS 통합, 관리형 컨트롤 플레인 |
| **오케스트레이션** | Kubernetes HPA | v2 | 서비스별 수평 자동 스케일링 | KEDA | K8s 내장, CPU 기반 충분 |
| **GitOps** | ArgoCD | 3.x (권장 3.4) | 선언적 GitOps 배포 자동화 | Flux v2, Spinnaker | UI 대시보드, 드리프트 감지 |
| **CI/CD** | GitHub Actions | - | CI 파이프라인 (빌드/테스트/린트/배포) | Jenkins, CircleCI | GitHub 통합, 무료 한도 |
| **CDN/보안** | Cloudflare | - | CDN, WAF, DDoS, DNS, TLS 종료 | CloudFront + Shield | 통합 보안, WASM 캐싱 |
| **서비스 메시** | Istio | 1.22+ | mTLS, 트래픽 관리, 내부 라우팅 | Linkerd, Consul | Envoy 성능, 기능 완성도 |
| **컨테이너 레지스트리** | AWS ECR | - | Docker 이미지 저장 및 취약점 스캔 | Docker Hub, GHCR | EKS IAM 통합, VPC 내부 전송 |
| **메트릭** | Prometheus | 2.x | 시계열 메트릭 수집 | DataDog, New Relic | K8s 표준, 오픈소스 |
| **대시보드** | Grafana | 10.x | 메트릭 시각화, 알림 대시보드 | Kibana, DataDog | Prometheus 통합, 풍부한 시각화 |
| **로그 수집** | Fluent Bit | 3.x | 경량 로그 에이전트 (DaemonSet) | Fluentd, Vector | 낮은 메모리, CloudWatch/Loki 지원 |
| **로그 저장** | CloudWatch Logs | - | 로그 장기 보존, AWS 통합 감사 | ELK Stack | AWS 네이티브, IAM 인증 |
| **로그 조회** | Grafana Loki | 3.x | 메트릭-로그 연동 조회 | Elasticsearch | Grafana 통합, 저비용 |
| **분산 추적** | OpenTelemetry | 1.x | 벤더 중립 추적 계측 표준 | Zipkin 에이전트 | CNCF 표준, 벤더 독립 |
| **추적 백엔드** | Jaeger | 1.x | Trace 저장 및 시각화 | Zipkin, Tempo | 오픈소스, Istio 통합 |
| **에러 추적** | Sentry | - | 예외 추적, Source Map, 릴리스 추적 | Rollbar, Bugsnag | Flutter Source Map, 에러 그루핑 |
| **알림** | AlertManager | 0.27+ | Prometheus 알림 라우팅/그룹화 | Grafana Alerting | Prometheus 네이티브, 유연한 라우팅 |
| **알림 채널** | Slack Webhook | - | 팀 알림 수신 (P1/P2/P3 분리) | PagerDuty (P1 에스컬레이션) | 팀 일상 채널 통합 |
| **결제** | Stripe | - | 구독 결제, Checkout, Webhook | 토스페이먼츠, Paddle | 글로벌 구독 완성도, PCI DSS |
| **OAuth** | Google OAuth 2.0 | - | 주요 소셜 로그인 | Auth0 | 팀 친숙도, 무료 |
| **OAuth** | GitHub OAuth | - | 개발자 로그인 | - | 개발자 사용자층 타겟 |
| **OAuth** | Apple Sign-In | - | iOS 필수 로그인 | - | App Store 정책 필수 |
| **OAuth** | Microsoft OAuth | - | 기업/팀 플랜 Azure AD SSO | - | 기업 고객 요구사항 |
| **푸시** | FCM | - | Android/Web 푸시 알림 | OneSignal | Google Play Services 표준 |
| **푸시** | APNs | - | iOS 푸시 알림 | - | Apple iOS 필수 |
| **이메일** | AWS SES | - | 트랜잭션 이메일 발송 | SendGrid, Mailgun | AWS 통합, 저비용 |
| **시크릿** | AWS Secrets Manager | - | API 키/비밀번호 저장 및 자동 교체 | HashiCorp Vault | ESO 연동, 자동 교체, AWS 통합 |
| **백엔드** | Spring Modulith | 1.x | 모듈 경계 강제 + ArchUnit 통합 검증 | Nestjs Modules, Go Monorepo | DDD 기반 모듈 독립성 보장 |
| **데이터** | Confluent Schema Registry | 7.x | Avro 스키마 진화 호환성 검증 | Protobuf, MessagePack | Kafka 네이티브, 스키마 버전 관리 |
| **데이터** | Apache Avro | 1.11.x | 이벤트 직렬화 / 스키마 정의 | Protocol Buffers, JSON Schema | 스키마 진화 호환성, 바이너리 효율 |
| **인프라** | ArgoCD ApplicationSet | 2.x | 매트릭스 제너레이터 (5×3 환경) | Flux Helm Automation | 멀티 환경 배포 자동화, 드리프트 감지 |

---

### 10.2 기술 의존성 다이어그램

아래 다이어그램은 Synapse 프로젝트의 기술 스택 간 핵심 의존 관계를 나타낸다.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
│  Flutter Web (Dart + flutter_bloc)                                  │
│  Flutter iOS / Android                                              │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS / TLS 1.3
┌────────────────────────────▼────────────────────────────────────────┐
│                          EDGE LAYER                                  │
│  Cloudflare (CDN + WAF + DDoS + DNS)                               │
└────────────────────────────┬────────────────────────────────────────┘
                             │ Proxy
┌────────────────────────────▼────────────────────────────────────────┐
│                        GATEWAY LAYER                                 │
│  Spring Cloud Gateway 5 (JWT Validation + Rate Limit + Routing)    │
│       │ Redis (Token Bucket)         │ Resilience4j (Circuit Breaker)│
└───┬───┴──────────────────────────────────────────────────────────────┘
    │ Route (11 services)
    │
┌───▼──────────────────────────────────────────────────────────────┐
│                    CORE SERVICES LAYER                             │
│  [Auth] [Note] [Card] [Graph] [AI] [Billing]                      │
│  [Audit] [Community] [Gamification] [Notification]                │
│                                                                    │
│  ──── Istio Service Mesh (mTLS between all services) ────         │
│                                                                    │
│  Spring Boot 4 (Java 21)  ←── AWS Secrets Manager (ESO)          │
│  Spring Modulith 1.x                ↕                              │
│  FastAPI (Python 3.12)         K8s Secrets                         │
└───┬──────────┬──────────────────────────┬──────────────────────┬──┘
    │          │                          │                      │
┌───▼──┐  ┌───▼──────────────────────┐  ┌▼──────────────────┐  ┌▼──┐
│ DATA │  │      AI/ML LAYER          │  │  MESSAGING LAYER  │  │EXT│
│LAYER │  │ Claude API (LLM)          │  │  Kafka 3.x        │  │SVC│
│      │  │ OpenAI Embeddings         │  │  (18 topics)      │  │   │
│ PG16 │  │ RAG Pipeline              │  │  Confluent Schema │  │STR│
│+RLS  │◄─┤  ├─ pgvector ANN         │  │  Registry 7.x     │  │IPE│
│+pgv. │  │  └─ ES BM25 + RRF        │  │  Apache Avro 1.11 │  │   │
│      │  │ Semantic Cache            │  └───────────────────┘  │OAU│
│Redis │◄─┤  ├─ SHA-256 (exact)      │                          │TH │
│7 Cl. │  │  └─ Cosine ≥0.95         │                          │   │
│      │  └───────────────────────────┘                          │FCM│
│  ES8 │                                                          │APN│
│+nori │                                                          │SES│
│      │                                                          │   │
│ S3   │                                                          │AWS│
└──────┘                                                          │SMG│
                                                                  └───┘
┌──────────────────────────────────────────────────────────────────────┐
│                    INFRA / DEPLOYMENT LAYER                          │
│                                                                      │
│  GitHub Actions CI ──► AWS ECR ──► K8s Manifest Repo ──► ArgoCD    │
│                                                    ↓                 │
│                                  ArgoCD ApplicationSet 2.x           │
│                                  (Matrix: 4 service repos + 2 learning runtimes × 3 envs)      │
│                                           AWS EKS (synapse-prod)    │
│                                           AWS EKS (synapse-staging) │
│                                                                      │
│  Docker + Docker Compose (로컬 개발)                                 │
└──────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────┐
│                MONITORING & OBSERVABILITY LAYER                      │
│                                                                      │
│  Prometheus ──► Grafana Dashboards                                  │
│       └──► AlertManager ──► Slack (#alert-critical/warning)        │
│                    └──► PagerDuty (P1 에스컬레이션)                 │
│                                                                      │
│  Fluent Bit ──► CloudWatch Logs (장기 보존)                         │
│           └──► Grafana Loki (메트릭-로그 연동)                      │
│                                                                      │
│  OpenTelemetry (모든 서비스) ──► Jaeger (분산 추적)                 │
│                                                                      │
│  Sentry (에러 추적 + Flutter Source Map)                            │
└──────────────────────────────────────────────────────────────────────┘

핵심 데이터 흐름:
노트 저장 → Kafka note.created → [AI Service: 청킹+임베딩→pgvector]
                               → [ES: nori 색인]
                               → [Audit Service: 감사 로그]

카드 복습 → Card Service → Kafka card.reviewed → [Gamification: XP 계산]
                                               → [Stats: 통계 집계]

AI 질의 → Gateway → AI Service → Semantic Cache (miss?)
                              → pgvector ANN + ES BM25 (병렬)
                              → RRF 통합 → Claude API (SSE 스트리밍)
                              → 응답 캐시 저장 → 클라이언트 반환
```

---

### 10.3 버전 관리 정책

| 카테고리 | 정책 | 업데이트 주기 |
|----------|------|---------------|
| 언어 런타임 (Java, Python, Dart) | LTS 버전 사용, 마이너 보안 업데이트 즉시 적용 | 6개월마다 검토 |
| 프레임워크 (Spring Boot, FastAPI, Flutter) | 마이너 버전 분기별 업데이트, 메이저 버전 연 1회 검토 | 분기별 |
| 인프라 (K8s, Kafka, ES, Redis) | 마이너 1 이상 후행 유지, CVE 패치 즉시 적용 | 분기별 |
| AI 모델 (Claude, OpenAI) | 신규 모델 출시 후 성능 테스트 → 적용 | 모델 출시 시 |
| 보안 의존성 | Dependabot PR 자동 생성, Critical/High CVE 즉시 대응 | 주간 자동 |

---