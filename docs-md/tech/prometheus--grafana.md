
#### 개요
Prometheus는 시계열 메트릭 수집 및 저장 시스템이며, Grafana는 수집된 메트릭을 시각화하는 대시보드 플랫폼이다.

#### 역할 (Synapse 프로젝트 내)
- 4개 서비스와 learning-svc 내부 런타임의 CPU, 메모리, 네트워크 메트릭 수집 (cAdvisor, node-exporter)
- 서비스별 비즈니스 메트릭: 초당 API 호출(RPS), 응답 시간(p50/p95/p99), 에러율
- AI 서비스 전용 메트릭: LLM API 호출 횟수, 평균 토큰 수, 시맨틱 캐시 히트율
- Grafana 대시보드: 서비스 overview, SLO 트래킹, 비용 모니터링
- AlertManager를 통한 알림 라우팅

#### 선택 이유
- Kubernetes 생태계의 사실상 표준 (kube-prometheus-stack Helm 차트)
- Pull 방식 수집으로 서비스가 메트릭 엔드포인트만 노출하면 자동 수집
- PromQL의 강력한 집계 쿼리로 복잡한 SLO 계산 가능
- Grafana의 풍부한 시각화와 알림 기능, 오픈소스

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **Prometheus + Grafana** | K8s 표준, PromQL, 오픈소스 | 장기 저장 한계, 단일 노드 확장성 제한 | **선택** |
| DataDog | SaaS, 설치 불필요, APM 통합 | 에이전트당 과금, 비용 극대화 | 미선택 |
| New Relic | 풀 스택 관측성 | 비용, 벤더 종속 | 미선택 |
| AWS CloudWatch | AWS 통합 | PromQL 미지원, 비용 | 미선택 (로그에만 사용) |
| VictoriaMetrics | Prometheus 호환, 고성능 | 커뮤니티 작음 | 미선택 |

#### 기술적 이점
- **SLO 트래킹**: `rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])` 에러율 실시간 계산
- **AI 비용 대시보드**: `sum(llm_tokens_used_total{model="claude-3-5-sonnet"}) * 0.000015` 로 일별 LLM 비용 계산
- **캐시 히트율 패널**: `semantic_cache_hits / (semantic_cache_hits + semantic_cache_misses)` 실시간 모니터링
- **Recording Rules**: 복잡한 PromQL을 사전 집계하여 대시보드 쿼리 성능 향상

#### 핵심 기능

```yaml
# kube-prometheus-stack values.yaml 핵심 설정
prometheus:
  prometheusSpec:
    retention: 15d
    storageSpec:
      volumeClaimTemplate:
        spec:
          storageClassName: gp3
          resources:
            requests:
              storage: 100Gi

grafana:
  adminPassword: ${GRAFANA_ADMIN_PASSWORD}
  persistence:
    enabled: true
    size: 10Gi

# Spring Boot 메트릭 노출 (application.yml)
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus
  metrics:
    export:
      prometheus:
        enabled: true

# AI Service 커스텀 메트릭 (Python)
from prometheus_client import Counter, Histogram

llm_tokens_total = Counter(
    'llm_tokens_used_total', 'Total LLM tokens',
    ['model', 'feature', 'token_type']
)
rag_latency = Histogram(
    'rag_pipeline_duration_seconds', 'RAG latency',
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0]
)
cache_hits = Counter('semantic_cache_hits_total', 'Cache hits', ['cache_type'])
```

#### 프로젝트 내 사용 위치
- **monitoring 네임스페이스**: Prometheus, Grafana, AlertManager 배포
- **모든 서비스**: `/actuator/prometheus` (Spring Boot), `/metrics` (FastAPI) 엔드포인트 노출
- **ServiceMonitor CRD**: 각 서비스 메트릭 수집 설정

#### 트러블슈팅

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| 메트릭 수집 안됨 | ServiceMonitor 레이블 불일치 | `kubectl get servicemonitor -n monitoring` 레이블 확인 |
| 저장 공간 부족 | 메트릭 카디널리티 과다 | 레이블 수 제한, 불필요 메트릭 제외 |
| Grafana 대시보드 느림 | 쿼리 범위 과다 | 시간 범위 제한, recording rule 사전 집계 |
| AlertManager 알림 미발송 | Slack webhook URL 만료 | URL 갱신 후 ConfigMap 업데이트 |

#### 참고 자료
- Prometheus 공식 문서: https://prometheus.io/docs/
- kube-prometheus-stack: https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack
- PromQL 가이드: https://prometheus.io/docs/prometheus/latest/querying/basics/

---
