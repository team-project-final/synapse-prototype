
#### 개요
Spring 생태계의 API 게이트웨이 솔루션으로, Netty 기반 논블로킹 I/O와 WebFlux를 사용하여 마이크로서비스 앞단의 단일 진입점을 제공한다.

#### 역할
Synapse의 모든 클라이언트 요청이 통과하는 단일 진입점이다. JWT 토큰 검증, 테넌트 ID 추출 및 헤더 주입, 각 마이크로서비스로의 라우팅, Rate Limiting, Circuit Breaking, 요청/응답 로깅을 담당한다. 11개 마이크로서비스를 단일 도메인(`api.synapse.app`)으로 노출한다.

#### 선택 이유
Spring Boot 기반 백엔드 생태계와의 자연스러운 통합, Spring Security와의 JWT 검증 통합, Resilience4j와의 서킷 브레이커 통합이 핵심 선택 이유이다. Netflix Zuul 대비 논블로킹 아키텍처로 높은 처리량을 달성한다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **Spring Cloud Gateway 5** | Spring 생태계 통합, WebFlux 논블로킹, Resilience4j 통합 | Spring 의존적, 설정 복잡도 | ✅ 선택 |
| Kong Gateway | 다양한 플러그인, 언어 독립적 | 별도 인프라, 라이선스 비용 | ❌ |
| AWS API Gateway | 관리형, 서버리스 연계 | 벤더 종속, 비용, 커스터마이징 제한 | ❌ |
| Nginx + Lua | 고성능, 유연성 | 운영 복잡도, Spring 통합 부재 | ❌ |
| Netflix Zuul 2 | Netflix 검증 | 블로킹 I/O, 유지보수 저조 | ❌ |
| Envoy Proxy | 서비스 메시 통합, 고성능 | 설정 복잡도, Kubernetes 의존 | ❌ |

#### 기술적 이점
- **논블로킹 I/O**: Netty + WebFlux로 적은 스레드로 높은 동시 처리
- **필터 체인**: Pre/Post 필터로 요청/응답 가공 (JWT 검증, 헤더 추가, 로깅)
- **동적 라우팅**: `application.yml` 또는 프로그래매틱 라우팅 구성
- **Resilience4j 통합**: 서킷 브레이커, Rate Limiter를 Gateway 레벨에서 적용
- **Spring Security 통합**: ReactiveSecurityContextHolder로 JWT 검증 통합

#### 핵심 기능
- **Route Predicates**: Path, Method, Header, Cookie 등 조건 기반 라우팅
- **Gateway Filters**: AddRequestHeader, RewritePath, CircuitBreaker, RequestRateLimiter
- **Global Filters**: 모든 라우트에 공통 적용 (JWT 검증, 요청 ID 생성)
- **WebClient**: 다운스트림 서비스 호출에 논블로킹 HTTP 클라이언트 사용

#### 프로젝트 내 사용 위치
- `synapse-gateway/` — 게이트웨이 서비스 모듈
- `synapse-gateway/src/main/resources/application.yml` — 라우팅 설정
- `synapse-gateway/src/main/java/filters/` — 커스텀 필터 구현

#### 설정 가이드

```yaml
# application.yml — Spring Cloud Gateway 라우팅 설정
spring:
  cloud:
    gateway:
      default-filters:
        - DedupeResponseHeader=Access-Control-Allow-Credentials Access-Control-Allow-Origin
        - name: RequestRateLimiter
          args:
            redis-rate-limiter.replenishRate: 100
            redis-rate-limiter.burstCapacity: 200
            key-resolver: "#{@userKeyResolver}"
      routes:
        # Auth Service
        - id: auth-service
          uri: lb://auth-service
          predicates:
            - Path=/api/v1/auth/**
          filters:
            - RewritePath=/api/v1/auth/(?<segment>.*), /${segment}
            - name: CircuitBreaker
              args:
                name: authServiceCB
                fallbackUri: forward:/fallback/auth

        # Note Service
        - id: note-service
          uri: lb://note-service
          predicates:
            - Path=/api/v1/notes/**
          filters:
            - RewritePath=/api/v1/notes/(?<segment>.*), /${segment}
            - AddRequestHeader=X-Tenant-Id, #{tenantId}
            - name: CircuitBreaker
              args:
                name: noteServiceCB
                fallbackUri: forward:/fallback/note

        # AI Service
        - id: ai-service
          uri: lb://ai-service
          predicates:
            - Path=/api/v1/ai/**
          filters:
            - RewritePath=/api/v1/ai/(?<segment>.*), /${segment}
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 20
                redis-rate-limiter.burstCapacity: 30
```

```java
// JwtAuthenticationFilter.java — JWT 검증 Global Filter
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class JwtAuthenticationFilter implements GlobalFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String token = extractToken(exchange.getRequest());

        if (token == null) {
            return chain.filter(exchange);
        }

        return Mono.fromCallable(() -> jwtTokenProvider.validateAndParse(token))
            .flatMap(claims -> {
                ServerHttpRequest mutatedRequest = exchange.getRequest()
                    .mutate()
                    .header("X-User-Id", claims.getSubject())
                    .header("X-Tenant-Id", claims.get("tenantId", String.class))
                    .header("X-User-Role", claims.get("role", String.class))
                    .build();
                return chain.filter(exchange.mutate().request(mutatedRequest).build());
            })
            .onErrorResume(e -> {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            });
    }
}
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| 408 Timeout 빈번 | 다운스트림 응답 지연 | `spring.cloud.gateway.httpclient.response-timeout` 증가 |
| CORS 오류 | Gateway + 서비스 양측 CORS 중복 설정 | Gateway에만 CORS 설정, 서비스에서 제거 |
| Rate Limit 미동작 | Redis 연결 실패 | Redis 클러스터 연결 및 `KeyResolver` Bean 등록 확인 |
| Circuit Breaker 즉시 오픈 | 임계값 너무 낮음 | `slidingWindowSize`, `failureRateThreshold` 조정 |
| lb:// 라우팅 실패 | Eureka/Consul 서비스 미등록 | 서비스 `spring.application.name` 및 등록 상태 확인 |
| WebSocket 프록시 실패 | WebSocket 업그레이드 필터 미설정 | `spring.cloud.gateway.websocket.enabled=true` |

#### 참고 자료
- Spring Cloud Gateway 공식: https://docs.spring.io/spring-cloud-gateway/docs/current/reference/html/
- GitHub: https://github.com/spring-cloud/spring-cloud-gateway
- Spring Cloud Gateway 필터: https://docs.spring.io/spring-cloud-gateway/docs/current/reference/html/#gatewayfilter-factories

---
