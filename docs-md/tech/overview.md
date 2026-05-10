본 문서는 Synapse 프로젝트에서 사용하는 **모든 기술 스택**을 백과사전 형식으로 정의한다. 각 기술의 선택 근거, 기술적 이점, 설정 가이드, 트러블슈팅을 포함하여 신규 팀원 온보딩 및 기술 의사결정의 단일 참고 문서로 활용한다.

| 레이어 | 기술 | 버전 | 용도 |
|--------|------|------|------|
| Client | Flutter | 3.x | 크로스플랫폼 UI |
| Client | Dart | 3.x | 클라이언트 언어 |
| Client | flutter_riverpod | 3.0.x | 상태 관리 |
| Client | google_fonts | 6.x | 타이포그래피 |
| Client | CanvasKit | - | 웹 렌더러 |
| Client | D3.js | 7.x | 지식 그래프 시각화 |
| Client | flutter_test / integration_test | - | 클라이언트 테스트 |
| Gateway | Spring Cloud Gateway | 5.x | API 게이트웨이 |
| Gateway | Resilience4j | 2.x | 서킷 브레이커 |
| Gateway | Redis Token Bucket | - | Rate Limiting |
| Backend | Java | 21 LTS | 백엔드 언어 |
| Backend | Spring Boot | 4.x | 마이크로서비스 프레임워크 |
| Backend | Spring Security | 7.x | 인증/인가 |
| Backend | Spring Data JPA + Hibernate | 7.x | ORM (Jakarta EE 11 기반) |
| Backend | Flyway | 10.x | DB 마이그레이션 |
| Backend | Spring WebFlux | Spring Framework 7 내장 | 리액티브 |
| Backend | Testcontainers | 2.x | 통합 테스트 |
| Backend | Python | 3.12 | AI 서비스 언어 |
| Backend | FastAPI | 0.136.x | AI/RAG API |
| Backend | uvicorn | 0.46.x | ASGI 서버 |
| Backend | LangChain | 1.x | LLM 오케스트레이션 |
| Backend | httpx | 0.28.x | 비동기 HTTP 클라이언트 |
| Backend | pytest | 9.x | Python 테스트 |
| Data | PostgreSQL | 16 | 주 RDBMS |
| Data | pgvector | 0.8.x | 벡터 유사도 검색 |
| Data | Redis | 7 | 인메모리 캐시/큐 |
| Data | Elasticsearch | 8.x | 전문 검색 |
| Data | Apache Kafka | 3.x | 이벤트 스트리밍 |
| Data | AWS S3 | - | 오브젝트 스토리지 |
| Backend | Spring Modulith | 1.x | 모듈 경계 강제 + ArchUnit 통합 검증 |
| Data | Confluent Schema Registry | 7.x | Avro 스키마 진화 호환성 검증 |
| Data | Apache Avro | 1.11.x | 이벤트 직렬화 / 스키마 정의 |
| Infra | ArgoCD ApplicationSet | 2.x | 매트릭스 제너레이터 (5×3 환경) |