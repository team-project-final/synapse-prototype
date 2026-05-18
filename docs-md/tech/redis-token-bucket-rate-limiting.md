
#### 개요
Redis의 원자적 스크립트(Lua) 실행을 활용한 Token Bucket 알고리즘 기반 분산 Rate Limiting 구현체로, Spring Cloud Gateway의 `RequestRateLimiter` 필터와 통합된다.

#### 역할
Synapse의 플랜별 API 사용량 제한을 구현한다. Free 플랜 100req/min, Pro 플랜 1,000req/min, Team 플랜 3,000req/min의 한도를 Redis에서 원자적으로 관리한다. AI 생성 API는 별도 토큰 버킷(Free 10회/일, Pro 100회/일)으로 추가 제한한다.

#### 선택 이유
분산 환경(Gateway 다중 인스턴스)에서 Rate Limiting을 정확하게 구현하려면 중앙화된 카운터가 필요하다. Redis의 Lua 스크립트는 원자적 실행을 보장하므로 레이스 컨디션 없이 정확한 카운팅이 가능하다. Spring Cloud Gateway는 이미 `spring-boot-starter-data-redis-reactive`를 사용하는 Redis Rate Limiter를 내장 지원한다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **Redis Token Bucket** | 원자적 연산, 분산 환경 정확성, Gateway 내장 지원 | Redis 의존성 | ✅ 선택 |
| In-memory (Guava) | 빠름, 단순 | 다중 인스턴스 환경에서 부정확 | ❌ |
| Nginx limit_req | 인프라 레벨 제어 | Spring 통합 없음, 플랜별 동적 설정 어려움 | ❌ |
| AWS API Gateway Throttling | 관리형 | 벤더 종속, 비용 | ❌ |

#### 기술적 이점
- **원자성**: Redis Lua 스크립트로 check-and-decrement 원자 실행
- **플랜별 동적 한도**: 사용자 플랜을 JWT에서 추출하여 다른 버킷 키 적용
- **버스트 허용**: `burstCapacity`로 순간적 트래픽 스파이크 수용
- **헤더 노출**: `X-RateLimit-Remaining`, `X-RateLimit-Replenish-After` 헤더 응답

#### 핵심 기능
- Token Bucket 알고리즘: 초당 N개 토큰 보충, 요청 시 토큰 소비
- `replenishRate`: 초당 토큰 보충 속도
- `burstCapacity`: 최대 버킷 용량 (순간 버스트 허용)
- `requestedTokens`: 요청당 소비 토큰 수 (AI API는 10토큰 소비)

#### 프로젝트 내 사용 위치
- `api-gateway/src/main/java/config/RateLimiterConfig.java`
- `api-gateway/src/main/resources/application.yml`
- Redis: `rate_limit:{userId}:{planTier}` 키 패턴

#### 설정 가이드

```java
// RateLimiterConfig.java — 플랜별 Rate Limiter 설정
@Configuration
public class RateLimiterConfig {

    // 플랜별 Rate Limit 설정
    private static final Map<String, int[]> PLAN_LIMITS = Map.of(
        "FREE",  new int[]{100,  200},   // replenishRate, burstCapacity (per minute)
        "PRO",   new int[]{1000, 2000},
        "TEAM",  new int[]{3000, 5000}
    );

    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> {
            // JWT에서 userId + planTier 추출하여 키 생성
            String userId = exchange.getRequest().getHeaders()
                .getFirst("X-User-Id");
            String plan = exchange.getRequest().getHeaders()
                .getFirst("X-User-Plan");
            return Mono.just(userId + ":" + (plan != null ? plan : "FREE"));
        };
    }

    @Bean
    public RedisRateLimiter planAwareRateLimiter() {
        // 기본값 (FREE 플랜)
        return new RedisRateLimiter(100, 200, 1);
    }
}
```

```yaml
# application.yml — AI API별 별도 Rate Limit
spring:
  cloud:
    gateway:
      routes:
        - id: ai-generate
          uri: lb://ai-service
          predicates:
            - Path=/api/v1/ai/generate/**
          filters:
            - name: RequestRateLimiter
              args:
                # AI API: 플랜별 일일 제한 (별도 버킷)
                redis-rate-limiter.replenishRate: 1      # 분당 1토큰 보충
                redis-rate-limiter.burstCapacity: 10     # 최대 10회 버스트
                redis-rate-limiter.requestedTokens: 1
                key-resolver: "#{@aiApiKeyResolver}"
                # 429 응답 시 커스텀 메시지
                deny-empty-key: true

# Redis Rate Limit 키 패턴
# rate_limit:{userId}:FREE    → 100 req/min
# rate_limit:{userId}:PRO     → 1000 req/min
# rate_limit:{userId}:TEAM    → 3000 req/min
# rate_limit:{userId}:AI:FREE → 10 req/day
# rate_limit:{userId}:AI:PRO  → 100 req/day
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| 모든 요청 429 반환 | Redis 연결 실패 시 fail-open 설정 | `deny-empty-key: false`로 Redis 장애 시 허용 |
| Rate Limit 부정확 | 여러 Gateway 인스턴스가 로컬 카운터 사용 | Redis Cluster 연결 확인, Lua 스크립트 원자성 확인 |
| 플랜 변경 후 즉시 미반영 | Redis 키 TTL 만료 전 | 플랜 변경 시 해당 Rate Limit 키 삭제 이벤트 처리 |
| X-RateLimit 헤더 미포함 | Gateway 응답 헤더 노출 설정 누락 | `spring.cloud.gateway.filter.request-rate-limiter.include-headers=true` |

#### 참고 자료
- Spring Cloud Gateway RequestRateLimiter: https://docs.spring.io/spring-cloud-gateway/docs/current/reference/html/#the-requestratelimiter-gatewayfilter-factory
- Redis Rate Limiting 패턴: https://redis.io/docs/manual/patterns/distributed-locks/
- Token Bucket 알고리즘: https://en.wikipedia.org/wiki/Token_bucket

---
