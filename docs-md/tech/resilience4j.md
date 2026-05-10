
#### 개요
Java 8+ 함수형 프로그래밍 스타일로 설계된 경량 내결함성(Fault Tolerance) 라이브러리로, Circuit Breaker, Rate Limiter, Bulkhead, Retry, Time Limiter 패턴을 제공한다.

#### 역할
Synapse Gateway에서 각 마이크로서비스 호출에 대한 서킷 브레이커를 적용하고, AI 서비스(OpenAI API 연동)처럼 고비용·고지연 엔드포인트에 Bulkhead로 동시 호출 수를 제한한다. Rate Limiter는 Redis와 연동하여 플랜별 API 사용량을 제한한다.

#### 선택 이유
Netflix Hystrix가 유지보수 종료된 이후 Spring 생태계의 표준 서킷 브레이커로 자리잡았다. Spring Cloud CircuitBreaker 추상화를 통해 Spring Cloud Gateway와 자연스럽게 통합되며, Micrometer를 통한 메트릭 수집으로 Prometheus/Grafana 연동이 용이하다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **Resilience4j** | 경량, 함수형 API, Spring 통합, 활발한 유지보수 | Hystrix 대비 학습 곡선 | ✅ 선택 |
| Netflix Hystrix | 검증된 Netflix 사용 이력 | 유지보수 종료 (2018) | ❌ |
| Sentinel (Alibaba) | 강력한 대시보드, 다양한 기능 | Java 생태계 외 복잡, 중국 오픈소스 | ❌ |
| Polly (.NET) | .NET 생태계 표준 | Java 미지원 | ❌ |

#### 기술적 이점
- **Count/Time 기반 슬라이딩 윈도우**: 최근 N회 또는 N초 기준 실패율 계산
- **Slow Call 감지**: 응답 시간 임계값 초과 시 서킷 오픈
- **Half-Open 자동 전환**: 서킷 복구 시 제한적 요청으로 자동 테스트
- **Bulkhead**: 세마포어/스레드풀 기반 동시 호출 제한
- **Micrometer 통합**: 서킷 상태, 호출 통계 Prometheus 메트릭 자동 노출

#### 핵심 기능
- **CircuitBreaker**: CLOSED → OPEN → HALF_OPEN 상태 머신
- **RateLimiter**: 시간 윈도우 내 요청 수 제한
- **Bulkhead**: 동시 실행 수 제한 (SemaphoreBulkhead / ThreadPoolBulkhead)
- **Retry**: 지수 백오프 재시도
- **TimeLimiter**: 비동기 호출 타임아웃

#### 프로젝트 내 사용 위치
- `synapse-gateway/src/main/resources/application.yml` — 서킷 브레이커 설정
- `synapse-gateway/src/main/java/config/Resilience4jConfig.java` — 프로그래매틱 설정
- AI Service 호출: Bulkhead로 동시 OpenAI 호출 수 제한

#### 설정 가이드

```yaml
# application.yml — Resilience4j 설정
resilience4j:
  circuitbreaker:
    instances:
      # AI 서비스: 느린 응답 많음 → 엄격한 설정
      aiServiceCB:
        sliding-window-type: COUNT_BASED
        sliding-window-size: 20
        failure-rate-threshold: 50
        slow-call-duration-threshold: 3s
        slow-call-rate-threshold: 70
        wait-duration-in-open-state: 30s
        permitted-number-of-calls-in-half-open-state: 3
        automatic-transition-from-open-to-half-open-enabled: true

      # Note 서비스: 핵심 서비스 → 관대한 설정
      noteServiceCB:
        sliding-window-size: 50
        failure-rate-threshold: 60
        wait-duration-in-open-state: 15s

  bulkhead:
    instances:
      # AI 서비스 동시 호출 제한 (OpenAI API 비용 관리)
      aiBulkhead:
        max-concurrent-calls: 20
        max-wait-duration: 2s

  ratelimiter:
    instances:
      # 플랜별 Rate Limit은 Redis Token Bucket으로 별도 구현
      defaultRateLimiter:
        limit-for-period: 100
        limit-refresh-period: 1s
        timeout-duration: 0s

  retry:
    instances:
      externalApiRetry:
        max-attempts: 3
        wait-duration: 1s
        exponential-backoff-multiplier: 2
        retry-exceptions:
          - java.net.ConnectException
          - java.util.concurrent.TimeoutException
```

```java
// Resilience4jConfig.java — 커스텀 서킷 브레이커 이벤트 리스너
@Configuration
public class Resilience4jConfig {

    @EventListener
    public void onCircuitBreakerStateChange(CircuitBreakerOnStateTransitionEvent event) {
        log.warn("Circuit Breaker [{}] 상태 변경: {} → {}",
            event.getCircuitBreakerName(),
            event.getStateTransition().getFromState(),
            event.getStateTransition().getToState());

        // Slack 알림 또는 메트릭 기록
        if (event.getStateTransition().getToState() == CircuitBreaker.State.OPEN) {
            alertService.sendCircuitBreakerAlert(event.getCircuitBreakerName());
        }
    }
}
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| 서킷 브레이커가 너무 자주 열림 | 임계값이 너무 낮거나 슬라이딩 윈도우 너무 작음 | `sliding-window-size` 증가, `failure-rate-threshold` 상향 |
| Half-Open 시 복구 안 됨 | `permitted-number-of-calls-in-half-open-state` 너무 적음 | 값을 5~10으로 증가 |
| Bulkhead 거부 오류 빈번 | 동시 호출 제한이 너무 낮음 | `max-concurrent-calls` 증가 또는 큐 도입 |
| Retry 무한 루프 | 모든 예외에 재시도 설정 | `ignore-exceptions`로 비재시도 예외 명시 |
| Micrometer 메트릭 미노출 | actuator 설정 누락 | `management.endpoints.web.exposure.include=health,metrics,circuitbreakers` |

#### 참고 자료
- Resilience4j 공식: https://resilience4j.readme.io/docs
- Spring Cloud CircuitBreaker: https://spring.io/projects/spring-cloud-circuitbreaker
- Resilience4j + Spring Boot: https://resilience4j.readme.io/docs/getting-started-3

---
