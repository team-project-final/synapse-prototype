# 부록

### Appendix A. ADR-001 — 10개 서비스를 4개로 통합

**상태**: Accepted (채택일 2026-05-09)

**결정**:
- 원안의 10개 마이크로서비스를 4개의 큰 서비스로 통합
- 각 서비스 내부는 Spring Modulith로 모듈 분리

**근거**:
- 7명 팀에 10개 서비스는 운영 부담 과다
- 콘웨이 법칙: 팀 구조 ≈ 시스템 구조
- MSA의 핵심 가치(독립 배포)는 4개에서도 보존
- 분리 옵션은 모듈 경계로 보존

**대안 고려**:
- A. 풀 10개 분리: 7명에 운영 부담 과다 → 거부
- B. Modular Monolith (1개): MSA 결정사항 위배 → 거부
- C. 4개 통합 ← **채택**
- D. 6개 통합: 1+1+2+2 인력 패턴 안 맞음 → 거부

**결과**:
- 운영 비용 30% 절감
- 7명 팀 협업 자연스러움
- 미래 분리 옵션 보존

### Appendix B. ADR-002 — AI Service를 learning-svc에 통합

**상태**: Accepted (채택일 2026-05-09) — 논쟁 사항은 아래 위험·완화 절 참조

**결정**:
- AI Service (Python)를 learning-svc 안에 두되, 별도 컨테이너로 운영

**근거**:
- AI의 주 use case가 Card 생성 (Note → Card)
- 7명 팀에 AI Service만 별도 owner 둘 인력 없음
- Java + Python을 한 팀이 다루는 것이 가능 (인터페이스 명확 시)

**위험**:
- 멀티 스택의 학습 부담
- Java ↔ Python 통합 패턴 결정 필요

**완화**:
- 처음부터 Kafka 이벤트 + Internal REST 명확히
- 페어보다 분담 (한 명 Java, 한 명 Python)

### Appendix C. v1.x → v2.0 절 매핑표

```
v1.x 절                  → v2.0 위치
1.1 브랜치 구조           → A1 브랜치 전략 (서비스별 main으로 갱신)
1.2 브랜치 명명           → A1 브랜치 전략 (8종 prefix로 재정의)
1.3 브랜치 규칙           → A1 브랜치 전략
1.4 Mermaid Git Graph    → A1 브랜치 전략 (단일 서비스 예시로 재작성)
2.1~2.6 커밋 메시지       → A2 커밋 메시지 (Scope 4-서비스 매트릭스로 재정의)
3.1 PR 제목              → A3 PR
3.2 PR 본문 템플릿        → A3 PR (4개 항목 추가)
3.3 PR 규칙              → A3 PR (승인 정책 7행 표로 재정의)
3.4 자동화 (CI)           → A3 PR (4종 추가)
4.1 SemVer 형식          → A5 릴리즈/태깅
4.2 릴리즈 프로세스       → A5 릴리즈/태깅 (5단계로 재작성)
4.3 CHANGELOG            → A5 릴리즈/태깅 (레포별 분리 + 통합 RELEASE_NOTES는 B5)
5.1 .gitignore           → A6 (.venv·Avro·K8s·AWS 등 추가)
5.2 Git Hooks            → A6 (그대로)
5.3 CODEOWNERS           → A4 (8개 레포 명시 + 영문 handle)
6. 변경 이력              → 변경 이력 (v2.0 추가)

v2.0 신규 절             → 출처
0.1 ADR 요지             → SYNAPSE_Service_Consolidation §1·§2
0.2 Phase 요지           → SYNAPSE_Service_Consolidation §5
0.3 매핑표               → SYNAPSE_Service_Consolidation §3 + Polyrepo §1.1
B1 레포 구조 3-Tier      → SYNAPSE_Git_Rules_Polyrepo_Supplement §1
B2 미러링 자동화         → Polyrepo §5.2
B3 GitOps 갱신           → Polyrepo §5.3·§9
B4 Schema Registry      → Polyrepo §8
B5 통합 배포 태그        → Polyrepo §7.2
B6 PAT 정책              → Polyrepo §6
C1 Day 1 체크리스트      → Polyrepo §12
C2 트랩 10가지           → Polyrepo §13
C3 FAQ                   → Polyrepo §15
C4 시리즈·위키 매핑      → Polyrepo §14·§11
Appendix A·B            → SYNAPSE_Service_Consolidation §8 (Accepted로 상태 갱신)
```

---
