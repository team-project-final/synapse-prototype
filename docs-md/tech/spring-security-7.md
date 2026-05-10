
#### 개요
Spring 애플리케이션의 인증(Authentication)과 인가(Authorization)를 담당하는 강력하고 확장 가능한 보안 프레임워크이다.

#### 역할
Synapse의 모든 보안 관련 기능을 담당한다. OAuth 2.0 소셜 로그인(Google, GitHub, Apple, Microsoft), JWT 액세스/리프레시 토큰 발급 및 검증, RBAC(Role-Based Access Control), 테넌트 격리 보안, CORS 설정을 처리한다. Auth Service에서 토큰을 발급하고, Gateway에서 토큰을 검증한다.

#### 선택 이유
Spring Security는 Spring 생태계의 표준 보안 솔루션으로, OAuth 2.0 Client/Resource Server 구현이 매우 완성도 높다. JWT 지원, RBAC 표현식 기반 인가(`@PreAuthorize`), 테스트 지원(`@WithMockUser`)이 프로젝트 요구사항에 정확히 부합한다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **Spring Security 7** | Spring 완벽 통합, OAuth 2.0 완성도 높음, 풍부한 레퍼런스 | 설정 복잡성 | ✅ 선택 |
| Keycloak | 독립 IAM 솔루션, 관리 UI | 별도 인프라, 초기 단계 오버엔지니어링 | 장기 검토 |
| Auth0 / Okta | 관리형, 빠른 구현 | 벤더 종속, 비용, 데이터 제어 불가 | ❌ |
| Apache Shiro | 단순한 API | Spring 생태계 통합 약함, 커뮤니티 활동 감소 | ❌ |

#### 기술적 이점
- **Lambda DSL**: Java 8 람다 기반 보안 설정으로 가독성 향상
- **OAuth 2.0 Resource Server**: JWT 검증 자동화
- **Method Security**: `@PreAuthorize("hasRole('ADMIN')")` 메서드 레벨 인가
- **테스트 지원**: `@WithMockUser`, `SecurityMockMvcRequestPostProcessors`

#### 핵심 기능
- `SecurityFilterChain`: 필터 체인 기반 요청 보안 처리
- `OAuth2LoginConfigurer`: 소셜 로그인 설정
- `JwtDecoder`: JWT 서명 검증 및 클레임 추출
- `PasswordEncoder` (BCrypt): 비밀번호 해싱
- `UserDetailsService`: 사용자 정보 로드

#### 프로젝트 내 사용 위치
- `synapse-auth/src/main/java/security/` — JWT 발급, OAuth 2.0 핸들러
- `synapse-gateway/src/main/java/security/` — JWT 검증 필터
- 모든 서비스: `@PreAuthorize` 메서드 보안

#### 설정 가이드

```java
// SecurityConfig.java — Auth Service 보안 설정
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class AuthSecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/login",
                                 "/api/auth/register",
                                 "/api/auth/oauth2/**",
                                 "/actuator/health").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .oauth2Login(oauth2 -> oauth2
                .authorizationEndpoint(ep -> ep
                    .baseUri("/api/auth/oauth2/authorize"))
                .redirectionEndpoint(ep -> ep
                    .baseUri("/api/auth/oauth2/callback/*"))
                .successHandler(oAuth2SuccessHandler))
            .addFilterBefore(jwtAuthFilter,
                UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}

// JWT 토큰 생성 — Access Token(15분) + Refresh Token(7일)
@Service
public class JwtService {
    public String generateAccessToken(User user) {
        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer("https://api.synapse.app")
            .subject(user.getId().toString())
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plus(15, MINUTES))
            .claim("role", user.getRole().name())
            .claim("tenantId", user.getTenantId().toString())
            .claim("plan", user.getSubscriptionPlan().name())
            .build();
        return jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }
}
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| OAuth2 리다이렉트 루프 | `redirect_uri` 불일치 | OAuth 제공자 콘솔에서 정확한 콜백 URL 등록 |
| JWT 만료 후 403 | Refresh Token 로직 미구현 | 클라이언트에서 401 감지 후 토큰 갱신 플로우 |
| CORS 오류 + OPTIONS 403 | Security가 CORS preflight 차단 | `CorsConfigurationSource` Bean 등록 후 `.cors(...)` 설정 |
| `@PreAuthorize` 미동작 | `@EnableMethodSecurity` 누락 | `@Configuration` 클래스에 어노테이션 추가 |
| 다중 SecurityFilterChain 충돌 | 여러 SecurityFilterChain Bean | `@Order` 또는 `securityMatcher`로 적용 범위 명시 |

#### 참고 자료
- Spring Security 공식: https://docs.spring.io/spring-security/reference/
- OAuth 2.0 Login: https://docs.spring.io/spring-security/reference/servlet/oauth2/login/
- JWT Resource Server: https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html

---
