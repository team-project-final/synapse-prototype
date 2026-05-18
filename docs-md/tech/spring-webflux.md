
#### 개요
Spring Framework 5에서 도입된 논블로킹 리액티브 웹 프레임워크로, Project Reactor(Mono/Flux)를 기반으로 적은 스레드로 높은 처리량을 달성한다.

#### 역할
Synapse에서 두 가지 용도로 사용된다. (1) Spring Cloud Gateway의 핵심 런타임 — Gateway 자체가 WebFlux 기반이므로 모든 필터와 라우팅 로직이 리액티브로 동작한다. (2) `WebClient` — 서비스 간 내부 HTTP 호출 시 논블로킹 클라이언트로 사용한다(예: Note Service → AI Service 카드 생성 호출).

#### 선택 이유
Gateway 레이어에서 WebFlux는 선택이 아닌 필수이다(Spring Cloud Gateway = WebFlux 기반). 서비스 간 HTTP 호출에서 `RestTemplate`(블로킹)보다 `WebClient`(논블로킹)가 Virtual Thread 환경에서도 더 효율적이다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **Spring WebFlux + WebClient** | 논블로킹, Gateway 통합 필수, Reactor 생태계 | 리액티브 학습 곡선, 디버깅 어려움 | ✅ Gateway + 서비스 간 호출 |
| Spring MVC + RestTemplate | 단순, 동기 직관적 | 블로킹, Virtual Thread 환경에서 비효율 | 일부 동기 로직에 사용 |
| Feign Client | 선언형 HTTP 클라이언트 | 블로킹 기본, Reactive Feign 별도 | ❌ |

#### 기술적 이점
- **논블로킹 I/O**: 스레드 블로킹 없이 수천 개의 동시 요청 처리
- **배압(Backpressure)**: 다운스트림이 처리 가능한 만큼만 요청
- **WebClient**: `Mono<T>` / `Flux<T>` 리턴으로 비동기 체이닝

#### 핵심 기능
- `WebClient.create()` — HTTP 클라이언트 생성
- `Mono<T>` — 0 또는 1개 아이템의 비동기 스트림
- `Flux<T>` — 0~N개 아이템의 비동기 스트림
- `flatMap` / `map` / `filter` — 리액티브 연산자

#### 프로젝트 내 사용 위치
- `api-gateway/` — Gateway 전체 런타임
- `synapse-knowledge-svc/src/main/java/.../client/LearningAiClient.java`
- `synapse-learning-svc/learning-card/src/main/java/.../client/KnowledgeClient.java`

#### 설정 가이드

```java
// WebClientConfig.java
@Configuration
public class WebClientConfig {
    @Bean
    @LoadBalanced
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder()
            .defaultHeader(HttpHeaders.CONTENT_TYPE,
                           MediaType.APPLICATION_JSON_VALUE)
            .codecs(config -> config.defaultCodecs()
                .maxInMemorySize(1024 * 1024));
    }

    @Bean
    public WebClient aiServiceClient(WebClient.Builder builder) {
        return builder.baseUrl("lb://ai-service").build();
    }
}

// AiServiceClient.java
@Service
public class AiServiceClient {
    public Mono<List<CardDto>> generateCards(String noteContent) {
        return aiServiceWebClient.post()
            .uri("/api/generate/cards")
            .bodyValue(new GenerateCardsRequest(noteContent))
            .retrieve()
            .onStatus(HttpStatus::is4xxClientError, response ->
                Mono.error(new AiServiceException("카드 생성 실패")))
            .bodyToMono(new ParameterizedTypeReference<List<CardDto>>() {})
            .timeout(Duration.ofSeconds(30))
            .retryWhen(Retry.backoff(3, Duration.ofSeconds(1)));
    }
}
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| `block()` 호출로 데드락 | 리액티브 스레드에서 블로킹 | `block()` 제거, 전체 체인을 리액티브로 유지 |
| `DataBufferLimitException` | 응답 크기가 maxInMemorySize 초과 | `maxInMemorySize` 증가 또는 스트리밍 처리 |
| 스트림 미소비로 연결 누수 | `Mono`/`Flux` 구독 안 됨 | 반드시 `.subscribe()` 또는 상위에서 반환 |

#### 참고 자료
- Spring WebFlux: https://docs.spring.io/spring-framework/reference/web/webflux.html
- WebClient: https://docs.spring.io/spring-framework/reference/web/webflux-webclient.html

---
