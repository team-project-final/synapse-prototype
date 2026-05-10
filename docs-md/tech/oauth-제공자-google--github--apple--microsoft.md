
#### 개요
OAuth 2.0 / OpenID Connect 기반의 소셜 로그인 제공자로, 사용자가 비밀번호 없이 기존 계정으로 Synapse에 로그인할 수 있게 한다.

#### 역할 (Synapse 프로젝트 내)
- **Google OAuth 2.0**: 주요 로그인 수단 (이메일/Google Workspace)
- **GitHub OAuth**: 개발자 사용자 대상 로그인
- **Apple Sign-In**: iOS 앱에서 App Store 정책상 필수 제공
- **Microsoft OAuth**: 기업/팀 플랜 Azure AD 계정 연동
- **자동 회원가입**: 최초 로그인 시 `users` 테이블 자동 생성 + 무료 플랜 테넌트 자동 프로비저닝
- Auth Service (Spring Security OAuth2 Client)에서 모든 OAuth 플로우 처리

#### 선택 이유
- 비밀번호 관리 부담 제거 (해킹 위험 감소, 사용자 편의성 향상)
- Apple Sign-In은 iOS 앱 배포를 위해 App Store에서 필수 요구
- Microsoft OAuth로 기업 고객 SSO 요구사항 충족
- Spring Security OAuth2 Client 표준 지원으로 구현 간소화

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **다중 OAuth 제공자** | 사용자 선택권, App Store 요구사항 충족 | 제공자별 콜백 설정 필요 | **선택** |
| 이메일/비밀번호만 | 단순 구현 | 사용자 불편, 비밀번호 관리 리스크 | 미선택 |
| Auth0 | 다중 공급자 통합 UI | SaaS 비용, 벤더 종속 | 미선택 |
| Keycloak | 오픈소스, SSO 완성도 | 운영 부담, 복잡성 | 미선택 |

#### 설정 가이드

```yaml
# application.yml - Spring Security OAuth2
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            scope: openid,email,profile
            redirect-uri: "https://api.synapse.app/auth/oauth2/callback/google"
          github:
            client-id: ${GITHUB_CLIENT_ID}
            client-secret: ${GITHUB_CLIENT_SECRET}
            scope: read:user,user:email
          apple:
            client-id: ${APPLE_CLIENT_ID}
            client-secret: ${APPLE_CLIENT_SECRET}   # JWT (ES256)
            scope: openid,email,name
            authorization-grant-type: authorization_code
          microsoft:
            client-id: ${AZURE_CLIENT_ID}
            client-secret: ${AZURE_CLIENT_SECRET}
            scope: openid,email,profile
            authorization-uri: https://login.microsoftonline.com/common/oauth2/v2.0/authorize
            token-uri: https://login.microsoftonline.com/common/oauth2/v2.0/token
```

```java
// 최초 로그인 시 자동 회원가입 처리
@Service
public class OAuth2UserService extends DefaultOAuth2UserService {
    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) {
        OAuth2User oAuth2User = super.loadUser(request);
        String provider = request.getClientRegistration().getRegistrationId();
        String email = extractEmail(oAuth2User, provider);
        User user = userRepository.findByEmail(email)
            .orElseGet(() -> {
                User newUser = createUser(oAuth2User, provider, email);
                tenantService.provisionFreeTenant(newUser);  // 무료 테넌트 자동 생성
                return newUser;
            });
        user.updateLastLoginAt();
        return buildPrincipal(user, oAuth2User.getAttributes());
    }
}
```

#### 트러블슈팅

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| Apple 로그인 실패 | JWT 클라이언트 시크릿 만료 | Apple Developer P8 키로 JWT 재생성 (6개월 유효) |
| 이메일 미반환 | GitHub 이메일 비공개 설정 | `/user/emails` API 추가 호출로 primary email 조회 |
| 콜백 URL 불일치 | 환경별 URL 혼용 | 각 OAuth App에 올바른 callback URL 등록 |
| Microsoft 조직 계정 제한 | tenant 설정 오류 | `common` 엔드포인트로 변경 |

#### 참고 자료
- Google OAuth: https://developers.google.com/identity/protocols/oauth2
- Apple Sign-In: https://developer.apple.com/documentation/sign_in_with_apple
- Spring Security OAuth2: https://docs.spring.io/spring-security/reference/servlet/oauth2/

---
