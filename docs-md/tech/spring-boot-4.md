
#### 개요
Spring 프레임워크 기반의 독립 실행형 프로덕션 수준 애플리케이션을 최소한의 설정으로 빠르게 개발할 수 있는 Java 마이크로서비스 프레임워크이다.

#### 역할
Synapse의 11개 마이크로서비스(Gateway 포함) 전체를 Spring Boot 4로 구현한다. Auto-configuration으로 DB 연결, 보안, 메트릭, 헬스체크 등의 인프라 설정을 최소화하고 비즈니스 로직에 집중할 수 있는 환경을 제공한다. Actuator로 Prometheus 메트릭을 노출하고 Kubernetes 헬스체크 엔드포인트를 제공한다.

#### 선택 이유
Spring Boot 4는 Spring Framework 7 기반으로 Java 21 Virtual Threads 자동 지원, GraalVM Native Image 지원, AOT 처리 개선이 포함된다. 팀의 Java/Spring 역량이 충분하며, 방대한 Spring 생태계(Security, Data, Cloud, Batch 등)를 필요에 따라 추가할 수 있다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **Spring Boot 4** | 최대 생태계, Auto-config, 검증된 엔터프라이즈 지원 | 메모리 사용량, 시작 시간 | ✅ 선택 |
| Quarkus | 빠른 시작, 낮은 메모리 (GraalVM 최적화) | Spring 대비 작은 생태계 | ❌ |
| Micronaut | AOT 컴파일, 낮은 메모리 | 작은 커뮤니티 | ❌ |
| Ktor (Kotlin) | Kotlin 친화적, 경량 | Java 생태계 포기, 팀 역량 전환 필요 | ❌ |
| Helidon | Oracle 지원, MicroProfile | 작은 커뮤니티 | ❌ |

#### 기술적 이점
- **Auto-configuration**: 의존성 추가만으로 자동 설정 (DB 연결, 보안, 메트릭)
- **Actuator**: `/actuator/health`, `/actuator/metrics`, `/actuator/prometheus` 자동 노출
- **Virtual Thread 자동 지원**: `spring.threads.virtual.enabled=true` 한 줄로 적용
- **GraalVM 지원**: 빌드 타임 AOT 처리로 네이티브 이미지 생성 가능
- **Testcontainers 통합**: `@ServiceConnection`으로 테스트 컨테이너 자동 설정

#### 핵심 기능
- `@SpringBootApplication`: 컴포넌트 스캔 + Auto-configuration + Bean 정의
- `@ConfigurationProperties`: 타입 안전한 설정 바인딩
- `spring.profiles.active`: 환경별 설정 분리 (dev/staging/prod)
- `spring-boot-devtools`: 개발 시 자동 재시작
- Spring Boot Actuator: 운영 모니터링 엔드포인트

#### 프로젝트 내 사용 위치
- `synapse-auth/`, `synapse-note/`, `synapse-card/`, `synapse-graph/`
- `synapse-billing/`, `synapse-audit/`, `synapse-community/`
- `synapse-gamification/`, `synapse-notification/`, `synapse-gateway/`

#### 설정 가이드

```yaml
# application.yml — 공통 설정 (모든 서비스)
spring:
  application:
    name: synapse-note-service
  threads:
    virtual:
      enabled: true
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate.dialect: org.hibernate.dialect.PostgreSQLDialect
      hibernate.jdbc.batch_size: 50

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus,circuitbreakers
  metrics:
    tags:
      application: ${spring.application.name}
      environment: ${ENVIRONMENT:local}
```

```java
// 멀티 테넌시 — TenantInterceptor
@Component
public class TenantInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response, Object handler) {
        String tenantId = request.getHeader("X-Tenant-Id");
        if (tenantId != null) {
            TenantContext.setCurrentTenant(UUID.fromString(tenantId));
        }
        return true;
    }
    @Override
    public void afterCompletion(HttpServletRequest req, HttpServletResponse res,
                                Object handler, Exception ex) {
        TenantContext.clear();
    }
}
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| Bean 순환 참조 오류 | A→B→A 의존성 | `@Lazy` 또는 설계 재검토 (spring.main.allow-circular-references=false 권장) |
| Auto-configuration 충돌 | 여러 DataSource Bean | `@Primary` 또는 `@ConditionalOnMissingBean` |
| Actuator 보안 노출 | 기본 설정으로 외부 노출 | `management.server.port`를 내부 포트로 변경 |
| 프로파일 설정 미로드 | 파일명 오류 | `application-{profile}.yml` 명명 규칙 확인 |
| 시작 시간 느림 (> 10s) | 너무 많은 Bean 초기화 | Lazy Bean 초기화 `spring.main.lazy-initialization=true` |

#### 참고 자료
- Spring Boot 공식: https://docs.spring.io/spring-boot/docs/current/reference/html/
- Spring Boot 4 마이그레이션: https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide
- Spring Actuator: https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html

---
