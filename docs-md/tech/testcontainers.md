
#### 개요
JVM 기반 통합 테스트 시 Docker 컨테이너를 프로그래매틱하게 시작/종료하여 실제 인프라 컴포넌트(DB, 메시지 브로커 등)와 통합 테스트를 실행하는 라이브러리이다.

#### 역할
Synapse 백엔드 서비스의 통합 테스트에서 PostgreSQL, Redis, Elasticsearch, Kafka 컨테이너를 실제로 실행한다. H2 인메모리 DB나 Mock 대신 프로덕션과 동일한 환경에서 Flyway 마이그레이션, JPA 쿼리, Kafka 이벤트 발행/소비, Redis 캐시 동작을 검증한다.

#### 선택 이유
H2 인메모리 DB는 PostgreSQL 특화 기능(UUID, JSONB, pgvector, RLS, 배열 타입)을 지원하지 않아 Synapse 통합 테스트에 부적합하다. Testcontainers는 Docker만 있으면 CI/CD에서도 동일한 인프라 환경을 재현하므로 "Works on my machine" 문제를 해결한다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **Testcontainers** | 실제 DB/브로커 사용, CI/CD 지원, Spring Boot 자동 통합 | Docker 필요, 테스트 속도 느림 | ✅ 선택 |
| H2 인메모리 DB | 빠름, Docker 불필요 | PostgreSQL 특화 기능 미지원 | ❌ |
| 외부 테스트 DB | 실제 환경 | 병렬 테스트 충돌, 상태 오염 | ❌ |

#### 기술적 이점
- **Spring Boot 3+ 통합**: `@ServiceConnection`으로 컨테이너 자동 설정
- **Reuse 모드**: 컨테이너 재사용으로 테스트 속도 개선
- **병렬 테스트**: 각 테스트 클래스가 독립 컨테이너 사용
- **픽스처 격리**: `@Transactional` + `@Rollback`으로 테스트 간 데이터 격리

#### 핵심 기능
- `@Container` — 테스트 컨테이너 선언
- `PostgreSQLContainer`, `RedisContainer`, `KafkaContainer` — 전용 컨테이너
- `@ServiceConnection` (Spring Boot 3.1+) — DataSource 자동 설정
- `DynamicPropertySource` — 동적 속성 주입

#### 프로젝트 내 사용 위치
- `synapse-knowledge-svc/src/test/java/integration/`
- `synapse-learning-svc/learning-card/src/test/java/integration/`
- `synapse-*/src/test/java/config/IntegrationTestBase.java`

#### 설정 가이드

```java
// IntegrationTestBase.java — 공통 통합 테스트 기반 클래스
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
public abstract class IntegrationTestBase {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("synapse_test")
            .withUsername("test")
            .withPassword("test");

    @Container
    @ServiceConnection
    static RedisContainer redis =
        new RedisContainer(DockerImageName.parse("redis:7-alpine"));

    @Container
    static KafkaContainer kafka =
        new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.5.0"));

    @Container
    static ElasticsearchContainer elasticsearch =
        new ElasticsearchContainer(
            "docker.elastic.co/elasticsearch/elasticsearch:8.11.0")
            .withEnv("xpack.security.enabled", "false");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
        registry.add("spring.elasticsearch.uris", elasticsearch::getHttpHostAddress);
    }
}

// 통합 테스트 예시
class NoteServiceIntegrationTest extends IntegrationTestBase {
    @Autowired NoteService noteService;

    @Test
    @Transactional
    void 노트_생성_후_Kafka_이벤트_발행_확인() {
        var note = noteService.createNote(TEST_TENANT_ID, TEST_USER_ID,
            new CreateNoteRequest("학습 메모", "내용...", Set.of("Java")));

        assertThat(note.getId()).isNotNull();
        await().atMost(5, SECONDS)
               .until(() -> kafkaConsumer.hasMsgForTopic("note.created"));
    }
}
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| 컨테이너 시작 타임아웃 | Docker 이미지 다운로드 지연 | CI에서 이미지 사전 캐싱, `withStartupTimeout` 증가 |
| 포트 충돌 | 고정 포트 사용 | `@ServiceConnection`으로 랜덤 포트 자동 처리 |
| 테스트 간 데이터 오염 | `@Transactional` 미사용 | `@Transactional @Rollback` 적용 |
| CI에서 Docker 없음 | DinD 미설정 | GitHub Actions: `services` 설정 또는 Colima 사용 |

#### 참고 자료
- Testcontainers 공식: https://testcontainers.com/guides/
- Spring Boot 통합: https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.testing.testcontainers

---
