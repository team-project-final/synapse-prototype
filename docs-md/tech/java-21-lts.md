
#### 개요
Oracle과 OpenJDK 커뮤니티가 공동 개발하는 JVM 기반 정적 타입 언어의 21번째 LTS(Long-Term Support) 릴리스로, Virtual Threads, Pattern Matching, Record 클래스 등 현대적 기능을 포함한다.

#### 역할
Synapse의 10개 Spring Boot 마이크로서비스(Auth, Note, Card, Graph, Billing, Audit, Community, Gamification, Notification, Gateway)의 런타임 환경이다. Java 21의 Virtual Threads를 활용하여 블로킹 I/O 작업(DB 쿼리, 외부 API 호출)에서 높은 처리량을 달성하고, Record 클래스로 불변 DTO를 간결하게 정의한다.

#### 선택 이유
Java 21은 2023년 9월 GA 릴리스된 LTS 버전으로, 2028년까지 장기 지원이 보장된다. Project Loom의 Virtual Threads(JEP 444)는 기존 Spring MVC의 Thread-per-Request 모델을 유지하면서 WebFlux 수준의 처리량을 달성할 수 있어, 리액티브 프로그래밍의 복잡성 없이 높은 동시 처리가 가능하다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **Java 21 LTS** | Virtual Threads, 장기 지원, 성숙한 생태계, Spring 완벽 통합 | JVM 워밍업 시간 | ✅ 선택 |
| Java 17 LTS | 이전 LTS, 검증된 안정성 | Virtual Threads 미지원 | ❌ |
| Kotlin | 더 간결한 문법, 코루틴 | 팀 전환 비용, Java 대비 빌드 느림 | 검토 보류 |
| GraalVM Native | 빠른 시작, 낮은 메모리 | 빌드 시간 매우 김, 동적 기능 제한 | 장기 계획 |
| Go | 낮은 메모리, 빠른 컴파일 | JVM 생태계 포기, 팀 역량 전환 | ❌ |

#### 기술적 이점
- **Virtual Threads (JEP 444)**: OS 스레드와 1:N 매핑으로 수만 개의 동시 요청 처리
- **Pattern Matching (JEP 441)**: `switch` 표현식에서 타입 검사와 구조 분해 동시 처리
- **Record Classes (JEP 395)**: 불변 데이터 캐리어를 1줄로 정의 (DTO, Value Object)
- **Sealed Classes (JEP 409)**: 타입 계층을 컴파일 타임에 닫힌 집합으로 제한
- **Sequenced Collections (JEP 431)**: `getFirst()`, `getLast()` 등 일관된 컬렉션 API

#### 핵심 기능
- **JVM**: 가비지 컬렉터 (G1GC 기본, ZGC 저지연 옵션)
- **Virtual Threads**: `Thread.ofVirtual().start()` 또는 `Executors.newVirtualThreadPerTaskExecutor()`
- **JFR (Java Flight Recorder)**: 프로덕션 프로파일링 내장
- **JMX**: 런타임 모니터링 및 관리

#### 프로젝트 내 사용 위치
- 모든 `synapse-*/src/main/java/` — 10개 Spring Boot 서비스
- `synapse-*/src/main/java/*/dto/` — Record 클래스 기반 DTO
- `synapse-*/src/main/java/*/domain/` — 도메인 모델

#### 설정 가이드

```java
// Virtual Threads 활성화 (Spring Boot 4에서 자동 지원)
// application.yml
spring:
  threads:
    virtual:
      enabled: true  // Spring Boot 4: Virtual Threads 자동 활성화

// Record 기반 DTO 예시
public record NoteDto(
    UUID id,
    String title,
    String content,
    UUID tenantId,
    List<String> tags,
    Instant createdAt,
    Instant updatedAt
) {
    public NoteDto {
        Objects.requireNonNull(id, "id must not be null");
        if (title == null || title.isBlank())
            throw new IllegalArgumentException("title must not be blank");
    }
}

// Pattern Matching 활용 예시
String formatOutcome(ReviewOutcome outcome) {
    return switch (outcome) {
        case CorrectOutcome c when c.intervalDays() > 30 ->
            "장기 기억 전환: 다음 복습 " + c.intervalDays() + "일 후";
        case CorrectOutcome c ->
            "정답: 다음 복습 " + c.intervalDays() + "일 후";
        case IncorrectOutcome i ->
            "오답: 내일 재복습 예정 (연속 오답: " + i.streak() + "회)";
    };
}
```

```dockerfile
# Dockerfile — Java 21 + Virtual Threads
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxGCPauseMillis=200 \
               -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 \
               -Djava.security.egd=file:/dev/./urandom"
COPY target/*.jar app.jar
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| Virtual Thread pinning 경고 | `synchronized` 블록에서 블로킹 | `ReentrantLock`으로 교체, `-Djdk.tracePinnedThreads=full` |
| OOM: Metaspace | 동적 클래스 로딩 과다 | `-XX:MaxMetaspaceSize=512m` 설정 |
| 컨테이너 OOM Kill | MaxRAMPercentage 미설정 | `-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0` |
| Record 역직렬화 실패 | Jackson이 Record 생성자 인식 못 함 | `jackson-databind 2.14+` 사용 또는 `@JsonCreator` |
| GC 일시 정지 길음 | G1GC 힙 크기 불적합 | `-XX:MaxGCPauseMillis=200` 튜닝 또는 ZGC 전환 |

#### 참고 자료
- Java 21 릴리스 노트: https://openjdk.org/projects/jdk/21/
- Virtual Threads (JEP 444): https://openjdk.org/jeps/444
- Record Classes (JEP 395): https://openjdk.org/jeps/395
- Eclipse Temurin (OpenJDK 배포): https://adoptium.net

---
