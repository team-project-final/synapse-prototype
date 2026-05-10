# 9. Git 규칙 정의서

> **프로젝트명**: Synapse — 통합 학습-지식 그래프 SaaS
> **버전**: v2.0
> **작성일**: 2026-05-07
> **수정일**: 2026-05-09
> **기술 스택**: Spring Boot 4, Flutter 3.x, FastAPI, PostgreSQL 16, Redis, Elasticsearch, Kafka, K8s

> ⚠️ **v2.0 전면 개편 안내**
>
> 본 문서는 v1.x의 모노레포 가정에서 **4-서비스 폴리레포(+ 미러 + GitOps + Schema Registry)** 전제로 전면 재작성되었다. 근거: ADR-001 (10→4 서비스 통합) / ADR-002 (AI Service 통합) — 채택일 2026-05-09 (Appendix A·B).
>
> 본 개편의 전제와 일시적으로 어긋나는 위키 문서:
>  - `03_프로젝트_아키텍처_정의서` (여전히 10개 서비스 그림)
>  - `14_배포_가이드` (GitOps / ArgoCD ApplicationSet 미반영)
>  - `17_스케줄` (4주 일정 / 트랙 분배가 §0.3 매핑과 다름)
>  - `18_기술_스택_정의서` (Schema Registry / Spring Modulith 미반영)
>  - `10_환경_설정_템플릿` (10-서비스 docker-compose 가정)
>
> 위 문서들은 본 09 v2.0 채택 직후 후속 작업으로 갱신된다. 신규 팀원은 충돌 시 09 v2.0을 우선한다.

---

## 목차

- [0. 전제](/synapse-prototype/docs/09_Git_규칙_정의서/01_0.)
- [Part A — 한 레포 안의 규칙](/synapse-prototype/docs/09_Git_규칙_정의서/02_part-a)
- [변경 사항](/synapse-prototype/docs/09_Git_규칙_정의서/03_section)
- [변경 유형](/synapse-prototype/docs/09_Git_규칙_정의서/04_section)
- [관련 이슈](/synapse-prototype/docs/09_Git_규칙_정의서/05_section)
- [테스트 방법](/synapse-prototype/docs/09_Git_규칙_정의서/06_section)
- [스크린샷 (UI 변경 시)](/synapse-prototype/docs/09_Git_규칙_정의서/07_(ui-))
- [체크리스트](/synapse-prototype/docs/09_Git_규칙_정의서/08_section)
- [영향 받는 다른 서비스](/synapse-prototype/docs/09_Git_규칙_정의서/09_section)
- [이벤트/스키마 변경 여부](/synapse-prototype/docs/09_Git_규칙_정의서/10_section)
- [호환성 검증](/synapse-prototype/docs/09_Git_규칙_정의서/11_section)
- [미러링/GitOps 영향](/synapse-prototype/docs/09_Git_규칙_정의서/12_gitops)
- [[1.1.0] - 2026-06-15](/synapse-prototype/docs/09_Git_규칙_정의서/13_1.1.0-2026-06-15)
- [Part B — 레포 간의 규칙](/synapse-prototype/docs/09_Git_규칙_정의서/14_part-b)
- [Part C — 운영](/synapse-prototype/docs/09_Git_규칙_정의서/15_part-c)
- [부록](/synapse-prototype/docs/09_Git_규칙_정의서/16_section)
- [변경 이력](/synapse-prototype/docs/09_Git_규칙_정의서/17_section)