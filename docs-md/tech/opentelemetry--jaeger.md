
#### 개요
OpenTelemetry는 분산 시스템의 추적(Trace), 메트릭, 로그를 수집하는 CNCF 표준이며, Jaeger는 분산 추적 데이터를 저장하고 시각화하는 오픈소스 플랫폼이다.

#### 역할 (Synapse 프로젝트 내)
- 사용자 요청이 Gateway → Note Service → AI Service 등 여러 서비스를 거칠 때 전체 흐름을 단일 Trace로 연결
- 서비스별 Span 생성: HTTP 요청, DB 쿼리, Kafka 발행/소비, 외부 API 호출
- `traceparent` 헤더로 서비스 경계를 넘어 Trace Context 전파
- 지연 시간 디버깅: 카드 생성 API 병목 위치를 Jaeger Span 폭포수 뷰에서 즉시 파악
- Istio와 자동 연동으로 서비스 메시 레벨 추적 무코드 수집

#### 선택 이유
- OpenTelemetry는 CNCF 표준 — 나중에 Jaeger → Tempo로 백엔드 교체 가능 (벤더 독립)
- Spring Boot / FastAPI 모두 OpenTelemetry SDK 공식 지원 (자동 계측)
- Jaeger는 오픈소스로 추가 비용 없음
- Istio 사이드카와 자동 통합

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **OpenTelemetry + Jaeger** | 벤더 중립, 오픈소스, Istio 통합 | 자체 호스팅 운영 부담 | **선택** |
| DataDog APM | SaaS, 설치 쉬움 | 비용, 벤더 종속 | 미선택 |
| Zipkin | 단순, 경량 | 기능 제한, UI 구식 | 미선택 |
| AWS X-Ray | AWS 통합 | OTel 표준 미지원 | 미선택 |
| Grafana Tempo | Grafana 연동 최적 | 상대적으로 신생 | 미선택 (추후 검토) |

#### 설정 가이드

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318
processors:
  batch:
    timeout: 1s
    send_batch_size: 1024
exporters:
  jaeger:
    endpoint: jaeger-collector:14250
service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [jaeger]
```

```java
// Spring Boot (application.yml)
management:
  tracing:
    sampling:
      probability: 0.1    # 프로덕션 10% 샘플링
otel:
  service:
    name: note-service
  exporter:
    otlp:
      endpoint: http://otel-collector:4318
```

```python
# FastAPI 자동 계측
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.instrumentation.asyncpg import AsyncPGInstrumentor

FastAPIInstrumentor.instrument_app(app)
HTTPXClientInstrumentor().instrument()   # Claude/OpenAI API 호출 추적
AsyncPGInstrumentor().instrument()       # DB 쿼리 추적
```

#### 트러블슈팅

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| Trace 연결 끊김 | Kafka 메시지에 Trace Context 미전파 | Kafka 메시지 헤더에 `traceparent` 수동 주입 |
| Jaeger 저장 공간 부족 | 샘플링 100% 설정 | 프로덕션 10%, 스테이징 100% 조정 |
| 자동 계측 미동작 | Java 에이전트 JAR 미로드 | `-javaagent:opentelemetry-javaagent.jar` JVM 옵션 확인 |
| 느린 Jaeger 쿼리 | 메모리 스토리지 한계 | Elasticsearch 백엔드로 교체 검토 |

#### 참고 자료
- OpenTelemetry 공식 문서: https://opentelemetry.io/docs/
- Jaeger: https://www.jaegertracing.io/docs/
- Spring Boot OTel: https://opentelemetry.io/docs/zero-code/java/spring-boot-starter/

---
