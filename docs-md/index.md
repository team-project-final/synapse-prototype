# Synapse — 프로젝트 Wiki

> **통합 학습-지식 그래프 SaaS** | Obsidian + Anki + RAG 융합 플랫폼

---

## 문서 목차

### 기획 / 설계

| # | 문서 | 설명 |
|---|------|------|
| 01 | [프로젝트 계획서](01_프로젝트_계획서) | 배경, 목표, 범위, KPI, 비즈니스 모델 |
| 02 | [ERD 문서](02_ERD_문서) | DB 스키마, 도메인별 테이블, Mermaid ER 다이어그램 |
| 03 | [프로젝트 아키텍처 정의서](03_프로젝트_아키텍처_정의서) | 시스템 구성도, 레이어 구조, 멀티테넌시, 이벤트 기반 통합 |
| 04 | [API 명세서](04_API_명세서) | REST API 전체 엔드포인트, 공통 규약, 에러 코드 |
| 05 | [화면 흐름 시퀀스 다이어그램](05_화면_흐름_시퀀스_다이어그램) | 핵심 유저 플로우 8개 시퀀스 다이어그램 |
| 06 | [화면 기능 정의서](06_화면_기능_정의서) | 화면 인벤토리, ASCII 목업, 기능 상세 |
| 07 | [요구사항 정의서](07_요구사항_정의서) | 기능/비기능 요구사항 (FR/NFR), 우선순위 |
| 08 | [스토리 보드](08_스토리_보드) | 페르소나, 유저 스토리, Acceptance Criteria |

### 개발 규칙

| # | 문서 | 설명 |
|---|------|------|
| 09 | [Git 규칙 정의서](09_Git_규칙_정의서) | 브랜치 전략, 커밋 규칙, PR 프로세스 |
| 10 | [환경 설정 템플릿](10_환경_설정_템플릿) | 환경 매트릭스, .env, Docker Compose |
| 11 | [테스트 전략서](11_테스트_전략서) | 테스트 피라미드, 커버리지 목표, CI 연동 |
| 12 | [코드 리뷰 규칙](12_코드_리뷰_규칙) | 리뷰 프로세스, 체크리스트, 에티켓 |

### 운영 / 배포

| # | 문서 | 설명 |
|---|------|------|
| 13 | [테스트 보고서](13_테스트_보고서) | 릴리즈별 테스트 결과 템플릿 |
| 14 | [배포 가이드](14_배포_가이드) | CI/CD 파이프라인, Blue/Green, 롤백 절차 |
| 15 | [사용자 메뉴얼](15_사용자_메뉴얼) | 최종 사용자용 기능 안내 |
| 16 | [운영 메뉴얼](16_운영_메뉴얼) | 모니터링, 장애 대응, 백업/복구 |
| 17 | [스케줄](17_스케줄) | 마일스톤, 주차별 계획, Gantt 차트 |
| 18 | [기술 스택 정의서](18_기술_스택_정의서) | 전체 기술 스택 목록, 선택 이유, 대안 비교, 설정 가이드, 트러블슈팅 |

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Backend | Spring Boot 4 + Java 21, FastAPI (AI) |
| Frontend | Flutter 3.x (Web / iOS / Android) |
| Database | PostgreSQL 16 + pgvector + RLS |
| Cache | Redis 7 Cluster |
| Search | Elasticsearch 8 + nori |
| Messaging | Apache Kafka 3.x |
| Infra | Docker + Kubernetes (EKS) + ArgoCD |
| Monitoring | Prometheus + Grafana + Loki + OpenTelemetry |
| AI/LLM | Anthropic Claude + OpenAI Embeddings |

---

## 관련 링크

- [메인 리포](https://github.com/Public-Project-Area-Oragans/syn)
- [설계 문서 (docs/)](https://github.com/Public-Project-Area-Oragans/syn/tree/main/docs)
