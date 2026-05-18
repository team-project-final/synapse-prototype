
#### 개요
Spring Data JPA는 JPA 기반 데이터 접근 레이어를 추상화하는 Spring 모듈이며, Hibernate 7는 JPA 스펙의 가장 널리 사용되는 구현체이다. Hibernate 7은 Jakarta EE 11 기반으로 동작한다.

#### 역할
Synapse의 PostgreSQL 데이터 접근 레이어 전체를 담당한다. 4개 굵은 서비스 내부 모듈의 도메인 엔티티 매핑, CRUD 리포지토리, 복잡한 JPQL/Native Query, 배치 인서트, N+1 문제 방지를 위한 Fetch Join을 구현한다. Hibernate 7의 `@TenantId` 어노테이션으로 멀티 테넌시 필터링을 투명하게 처리한다.

#### 선택 이유
팀의 JPA/Hibernate 역량이 충분하며, Spring Data JPA의 `JpaRepository`는 반복적인 CRUD 코드를 제거한다. Hibernate 7의 개선된 SQL 생성, UUID 지원, `@TenantId` 기반 멀티 테넌시가 Synapse 요구사항에 직접 부합한다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **Spring Data JPA + Hibernate 7** | Spring 통합, 코드 생산성, 멀티 테넌시 지원 (Jakarta EE 11) | N+1 문제 주의, 복잡한 쿼리 어려움 | ✅ 선택 |
| MyBatis | SQL 완전 제어, 복잡한 쿼리 유리 | 보일러플레이트 많음, Spring Data 추상화 없음 | ❌ |
| jOOQ | 타입 안전 SQL, 코드 생성 | 유료 (Pro), 학습 곡선 | 복잡 쿼리 보조 사용 |
| JDBC Template | 경량, SQL 직접 제어 | ORM 추상화 없음, 반복 코드 많음 | ❌ |

#### 기술적 이점
- **Repository 추상화**: 메서드명 쿼리 자동 생성 (`findByTitleContaining`)
- **Specification**: 동적 쿼리를 타입 안전하게 조합
- **배치 처리**: `hibernate.jdbc.batch_size`로 N+1 완화
- **Hibernate Envers**: 엔티티 변경 이력 자동 추적
- **2차 캐시**: Redis 연동으로 자주 조회되는 엔티티 캐싱

#### 핵심 기능
- `@Entity`, `@Table`, `@Column` — 테이블 매핑
- `@OneToMany(fetch = LAZY)` — 연관 관계
- `@Query(nativeQuery = true)` — 네이티브 SQL 직접 실행
- `Pageable` — 페이지네이션 자동 처리
- `@Modifying @Query` — 벌크 업데이트/삭제

#### 프로젝트 내 사용 위치
- `synapse-knowledge-svc/src/main/java/.../note/repository/NoteRepository.java`
- `synapse-learning-svc/learning-card/src/main/java/.../card/repository/CardRepository.java`
- `synapse-platform-svc/src/main/java/.../auth/repository/UserRepository.java`
- 모든 서비스의 `entity/`, `repository/` 패키지

#### 설정 가이드

```java
// Note 엔티티 — 멀티 테넌시 + UUID v7
@Entity
@Table(name = "notes",
       indexes = {
           @Index(name = "idx_notes_tenant_author",
                  columnList = "tenant_id, author_id"),
           @Index(name = "idx_notes_updated_at",
                  columnList = "updated_at DESC")
       })
@TenantId
public class Note {
    @Id
    @UuidGenerator(style = UuidGenerator.Style.TIME)  // UUID v7
    private UUID id;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "tenant_id", nullable = false,
            updatable = false, insertable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;

    @ElementCollection
    @CollectionTable(name = "note_tags",
                     joinColumns = @JoinColumn(name = "note_id"))
    private Set<String> tags = new HashSet<>();

    @CreationTimestamp private Instant createdAt;
    @UpdateTimestamp   private Instant updatedAt;
}

// NoteRepository
public interface NoteRepository extends JpaRepository<Note, UUID> {

    Page<Note> findByAuthorIdOrderByUpdatedAtDesc(UUID authorId, Pageable pageable);

    @Query(value = """
        SELECT * FROM notes
        WHERE tenant_id = :tenantId
          AND to_tsvector('korean', title || ' ' || COALESCE(content, ''))
              @@ plainto_tsquery('korean', :query)
        ORDER BY ts_rank(
            to_tsvector('korean', title || ' ' || COALESCE(content, '')),
            plainto_tsquery('korean', :query)) DESC
        """, nativeQuery = true)
    List<Note> fullTextSearch(@Param("tenantId") UUID tenantId,
                              @Param("query") String query);

    @Modifying
    @Query("DELETE FROM Note n WHERE n.author.id = :userId")
    int deleteAllByAuthorId(@Param("userId") UUID userId);
}
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| N+1 문제 | LAZY 로딩 연관 관계 반복 조회 | `@EntityGraph` 또는 `JOIN FETCH` |
| LazyInitializationException | 트랜잭션 외부에서 Lazy 로딩 | `@Transactional` 범위 확장 또는 DTO 프로젝션 |
| UUID 타입 오류 (PostgreSQL) | Hibernate UUID 매핑 설정 | `@Column(columnDefinition = "uuid")` 명시 |
| 배치 인서트 미작동 | Identity 전략 사용 시 배치 불가 | `@GeneratedValue` 전략을 `SEQUENCE`로 변경 |
| 멀티 테넌시 필터 누락 | TenantContext 미설정 | Filter/Interceptor에서 TenantContext 설정 확인 |

#### 참고 자료
- Spring Data JPA: https://docs.spring.io/spring-data/jpa/docs/current/reference/html/
- Hibernate 7 마이그레이션: https://docs.jboss.org/hibernate/orm/7.0/migration-guide/migration-guide.html
- Hibernate @TenantId: https://docs.jboss.org/hibernate/orm/7.0/userguide/html_single/Hibernate_User_Guide.html#multitenacy

---
