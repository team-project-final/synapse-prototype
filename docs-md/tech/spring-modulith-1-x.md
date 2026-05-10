
#### 개요
Spring Boot 기반 애플리케이션 안에서 **모듈 경계**를 명시적으로 정의하고 검증할 수 있게 하는 Spring 공식 라이브러리. 패키지 단위 모듈화 + 모듈 간 의존성 그래프 + ArchUnit 자동 통합 + 모듈 문서·다이어그램 자동 생성을 제공한다.

#### 역할
4-서비스 통합(ADR-001)으로 굵은 서비스(synapse-platform-svc / engagement-svc / knowledge-svc / learning-svc)가 만들어진 후, 각 서비스 안 모듈(auth/audit/billing/notification 등)의 경계를 코드 수준에서 강제한다. 모듈 간에는 직접 호출이 아닌 이벤트 또는 명시 API 통신만 허용되며, 위반 시 ArchUnit 테스트가 빌드를 실패시킨다. 미래에 모듈을 별도 서비스로 추출할 때 경계가 깨끗하게 유지되어 마이그레이션이 용이하다.

#### 선택 이유
4-서비스 통합은 운영 부담을 줄이는 대신 도메인 사일로 위험을 안았다. Spring Modulith가 없으면 한 서비스 안 모듈들이 자유롭게 서로의 internal 클래스에 접근하여 시간이 갈수록 모놀리식 진흙공이 되고 분리 옵션을 잃는다. ArchUnit만으로도 일부 가능하지만 Modulith는 모듈 정의·검증·문서화를 통합 제공한다. Spring Boot 4와 1차 호환되며 Spring 공식 지원으로 장기 안정성이 확보된다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **Spring Modulith 1.x** | Spring 공식, 모듈 정의 + 검증 + 문서화 통합, ApplicationModuleListener 이벤트 | 비교적 신규(1.0 GA 2023), Spring Boot 의존 | ✅ 선택 |
| ArchUnit 단독 | 성숙도 ↑, 다양한 룰 | 모듈 정의 자체는 별도 패키지 컨벤션으로 관리 필요. 문서·다이어그램 자동 생성 없음 | ❌ |
| Maven multi-module / Gradle subproject | 빌드 수준 격리 | 단일 서비스 안에 여러 빌드 단위 → CI 복잡, Spring Boot 통합 빌드 흐름과 충돌 | ❌ |
| 수동 패키지 분리 | 추가 의존성 없음 | 강제력 없음, 시간 갈수록 무너짐 | ❌ |

#### 기술적 이점
- **모듈 정의 명시화**: `package-info.java` 또는 `@ApplicationModule`로 모듈 단위와 의존성 선언
- **자동 검증**: `ApplicationModules.of(Application.class).verify()` 호출만으로 모든 모듈 경계 검사
- **이벤트 발행**: `ApplicationEventPublisher` 통합 → 모듈 간 통신을 이벤트로 강제
- **문서 자동 생성**: 모듈 다이어그램 (PlantUML / AsciiDoc) + Spring REST Docs 통합
- **Observability**: 모듈 진입/이탈 자동 추적 (Micrometer 통합)
- **Spring Boot 통합**: starter 의존성 1줄로 활성화, 별도 인프라 불필요

#### 핵심 기능
1. **`@ApplicationModule`** — 패키지 또는 클래스에 모듈 선언, 허용된 의존 모듈 명시
2. **`@ApplicationModuleListener`** — 모듈 간 이벤트 핸들러 (기본 비동기, 트랜잭션 분리)
3. **`ApplicationModules.verify()`** — 빌드 시 또는 테스트 시 경계 위반 차단
4. **`ApplicationModules.toDocumentation()`** — 모듈 의존성 다이어그램 + 모듈별 README 자동 생성
5. **`@DocumentationDescription`** — 모듈 설명을 코드 옆에 두어 문서 표류 방지
6. **Modulith Test Slices** — `@ApplicationModuleTest`로 모듈 단위 통합 테스트

#### 프로젝트 내 사용 위치
- `synapse-platform-svc/src/main/java/.../auth/package-info.java` (auth 모듈 선언)
- `synapse-platform-svc/src/main/java/.../audit/package-info.java`
- `synapse-platform-svc/src/main/java/.../billing/package-info.java`
- `synapse-platform-svc/src/main/java/.../notification/package-info.java`
- `synapse-engagement-svc/src/main/java/.../{community,gamification}/package-info.java`
- `synapse-knowledge-svc/src/main/java/.../{note,graph,chunking}/package-info.java`
- `synapse-learning-svc/learning-card/src/main/java/.../{card,srs}/package-info.java`
- 각 서비스 `src/test/.../ModularityTest.java` (`ApplicationModules.verify()` 호출)

#### 설정 가이드

```kotlin
// build.gradle.kts (각 Java 서비스)
dependencies {
    implementation("org.springframework.modulith:spring-modulith-starter-core")
    implementation("org.springframework.modulith:spring-modulith-starter-jpa")
    testImplementation("org.springframework.modulith:spring-modulith-starter-test")
}
```

```java
// src/main/java/.../auth/package-info.java
@ApplicationModule(
    displayName = "Auth Module",
    allowedDependencies = {"shared"}  // 다른 모듈에 의존하지 않음
)
package com.synapse.platform.auth;

import org.springframework.modulith.ApplicationModule;
```

```java
// src/test/.../ModularityTest.java
class ModularityTest {
    ApplicationModules modules = ApplicationModules.of(PlatformSvcApplication.class);

    @Test
    void verifiesModularStructure() {
        modules.verify();
    }

    @Test
    void writesDocumentationSnippets() {
        new Documenter(modules)
            .writeDocumentation()
            .writeIndividualModulesAsPlantUml();
    }
}
```

#### 트러블슈팅
- **모듈 경계 위반(`Cycle detected`)**: 두 모듈이 서로의 internal 클래스를 직접 호출. 해법: 호출을 이벤트(`ApplicationEventPublisher.publishEvent(...)`) 또는 명시 API(인터페이스 노출)로 변경
- **`ApplicationModules.verify()` 가 모듈을 못 찾음**: 패키지 구조가 모놀리식 1-depth면 모듈 인식 실패. 해법: 도메인별 sub-package + `@ApplicationModule` 또는 `package-info.java` 추가
- **순환 의존성**: A 모듈이 B를 호출하고 B가 A를 호출. 해법: 공통 인터페이스를 `shared` 모듈로 추출하거나 이벤트 기반으로 양방향을 단방향으로 변환

#### 공식 문서
- https://spring.io/projects/spring-modulith
- ArchUnit 통합: https://docs.spring.io/spring-modulith/reference/
