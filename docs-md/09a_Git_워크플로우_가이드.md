# 9a. Git 워크플로우 가이드 (팀원용)

> **프로젝트명**: Synapse — 통합 학습-지식 그래프 SaaS
> **프로젝트 기간**: 5주 (단기 팀 프로젝트, 2026-05-12 ~ 06-15)
> **문서 버전**: v1.1
> **최종 수정**: 2026-05-10
> **대상 독자**: 신규 합류자, 매일 작업하는 팀원
> **이 문서의 목적**: 09번 *Git 규칙 정의서*가 **무엇을 해야 하는지(규칙)** 를 정의한다면, 이 문서는 **어떻게 일하면 되는지(워크플로우)** 를 시나리오로 안내합니다.

---

## 📑 목차

- [0. 5분 치트시트](#0-5분-치트시트)
- [1. 시작하기 전에](#1-시작하기-전에)
  - [1.1 우리는 왜 폴리레포를 쓰는가](#11-우리는-왜-폴리레포를-쓰는가)
  - [1.2 8개 레포 한눈에 보기](#12-8개-레포-한눈에-보기)
  - [1.3 내 역할별 자주 만질 레포](#13-내-역할별-자주-만질-레포)
- [2. 첫 PR까지 30분](#2-첫-pr까지-30분)
  - [2.1 6개 레포 한 번에 클론하기](#21-6개-레포-한-번에-클론하기)
  - [2.2 로컬 개발 환경 부트스트랩](#22-로컬-개발-환경-부트스트랩)
  - [2.3 작은 변경으로 첫 PR 올려보기](#23-작은-변경으로-첫-pr-올려보기)
- [3. 일상 워크플로우 시나리오](#3-일상-워크플로우-시나리오)
  - [3.1 시나리오 A: 단일 레포 안에서 기능 추가](#31-시나리오-a-단일-레포-안에서-기능-추가)
  - [3.2 시나리오 B: frontend + 백엔드 동시 변경](#32-시나리오-b-frontend--백엔드-동시-변경)
  - [3.3 시나리오 C: shared 라이브러리 업데이트](#33-시나리오-c-shared-라이브러리-업데이트)
  - [3.4 시나리오 D: learning-svc에서 Java + Python 동시 변경](#34-시나리오-d-learning-svc에서-java--python-동시-변경)
  - [3.5 시나리오 E: hotfix 긴급 배포](#35-시나리오-e-hotfix-긴급-배포)
  - [3.6 시나리오 F: 통합 릴리즈 (gitops 태깅)](#36-시나리오-f-통합-릴리즈-gitops-태깅)
- [4. 결정 트리: 어디서부터 시작하지?](#4-결정-트리-어디서부터-시작하지)
- [5. 자주 하는 실수 & FAQ](#5-자주-하는-실수--faq)
- [6. 상세 규칙 레퍼런스](#6-상세-규칙-레퍼런스)
- [7. 결정 배경 (ADR)](#7-결정-배경-adr)
- [8. 도움 받기](#8-도움-받기)
- [9. 변경 이력](#9-변경-이력)

---

## 0. 5분 치트시트

> 매일 작업하는 사람을 위한 한 페이지 요약.
> 인쇄해서 모니터 옆에 붙이세요.

### 🚀 일일 워크플로우 5단계

```text
1. 작업 레포 식별        →  3장 시나리오 또는 4장 결정 트리 참고
2. 브랜치 생성            →  <prefix>/<TICKET-NNN>-<설명>
3. 커밋                   →  <type>(<scope>): <subject>  (50자 이내)
4. PR 올리기              →  템플릿 채우기 → CI 통과 → 1명 이상 Approve
5. Squash and Merge       →  머지 후 원격 브랜치 자동 삭제 확인
```

### 🏷️ 8개 브랜치 prefix

| Prefix | 레포 | 예시 브랜치 |
|--------|------|-------------|
| `PLAT` | synapse-platform-svc | `feature/PLAT-001-oauth-login` |
| `ENG` | synapse-engagement-svc | `feature/ENG-014-study-group` |
| `KNOW` | synapse-knowledge-svc | `feature/KNOW-007-wikilink` |
| `LEARN-CARD` | synapse-learning-svc (Java) | `feature/LEARN-CARD-022-srs-tweak` |
| `LEARN-AI` | synapse-learning-svc (Python) | `feature/LEARN-AI-005-card-gen` |
| `SHARED` | synapse-shared | `feature/SHARED-031-user-dto` |
| `FE` | synapse-frontend | `feature/FE-088-dark-mode` |
| `INFRA` | synapse-gitops | `chore/INFRA-012-argo-rollout` |

### ⚠️ 자주 잊는 것 3가지

1. **shared를 건드릴 때** → 4개 다운스트림 서비스 호환성을 반드시 확인하세요. (3.3 시나리오 참조)
2. **learning-svc** → Java만 수정해도 Python CI가 트리거됩니다. paths-filter로 실제 빌드는 스킵되니 로그를 확인하세요.
3. **gitops 통합 태그** → 주차별 데모 D-1에만 찍습니다. 개별 서비스 태그와 혼동하지 마세요.

---

## 1. 시작하기 전에

### 1.1 우리는 왜 폴리레포를 쓰는가

> 합류 첫날 가장 자주 듣는 질문: **"모노레포가 더 편하지 않나요?"**
> 미리 답을 정리해둡니다.

#### 흔한 오해

"여러 레포 클론하느라 귀찮고, 검색도 안 되고, 한 기능에 PR 여러 개 쓰는 게 더 비효율 아닌가요?"

→ 맞는 지적입니다. 그러나 우리가 폴리레포를 선택한 데는 **3가지 더 무거운 이유**가 있습니다. 그리고 단점은 **mirror + gitops + Renovate** 3종 세트로 보완합니다.

#### 우리가 폴리레포를 선택한 3가지 이유

**1️⃣ 도메인 경계의 물리적 강제**

4개 백엔드 서비스(platform/engagement/knowledge/learning)는 각각 **다른 비즈니스 책임**을 집니다. 한 PR이 두 도메인을 동시에 건드리는 건 대부분 잘못된 신호입니다 — "왜 결제 코드가 노트 서비스를 직접 부르고 있지?" 같은 의존성이 슬그머니 끼어들면, 나중에 떼어내는 비용이 훨씬 큽니다. 폴리레포는 이런 결합을 코드 리뷰 단계가 아니라 **레포 경계에서** 막습니다.

**2️⃣ 주차별 독립 검증과 부분 데모 가능성**

5주 프로젝트라도 — 아니, 오히려 5주이기 때문에 — 한 서비스의 빌드 실패가 다른 서비스의 데모를 막아서는 안 됩니다. 주차 발표 직전 learning-svc CI가 깨졌다고 platform/knowledge 데모까지 멈출 수는 없습니다.

| 서비스 | 안정화 목표 주차 | 데모 우선순위 |
|--------|:--------------:|:-----------:|
| platform (인증/결제) | 1주차 말 | **최고** (모든 기능의 기반) |
| knowledge (노트/그래프) | 2주차 말 | 높음 |
| engagement (커뮤니티/알림) | 3주차 말 | 중간 |
| learning (카드/SRS/AI) | 3~4주차 | 중간 |
| frontend | 매 주차 갱신 | 매 데모마다 필수 |

폴리레포 + ArgoCD GitOps로 각 서비스를 독립 배포하면, 한 서비스가 임시로 깨져도 나머지 데모는 그대로 진행 가능합니다.

**3️⃣ 팀원 간 작업 격리 + 학습/포트폴리오 가치**

5주 프로젝트의 가장 큰 위험은 "merge conflict 해결로 시간을 다 쓰는 것"입니다. 한 모노레포에 6명이 모이면 매일 충돌이 발생합니다. 폴리레포는 도메인별로 작업 영역을 물리적으로 분리해 충돌을 최소화합니다.

또한 실무에서 가장 자주 쓰이는 구조(MSA + 폴리레포 + GitOps + Argo CD)를 직접 경험하는 것이 이 프로젝트의 학습 목표 중 하나입니다. 단순함만을 위해 모노레포로 가면 포트폴리오 가치가 떨어지고, 졸업 후 실무에서 만날 폴리레포 협업 패턴을 배울 기회를 잃습니다.

#### 그래서 트레이드오프는?

| 폴리레포의 단점 | 우리의 보완책 |
|----------------|--------------|
| 코드 검색 불편 | `synapse-mirror` 자동 동기화 (Tier 2) |
| e2e 테스트 분산 | `synapse-gitops`에서 통합 e2e 실행 |
| shared 라이브러리 버전 hell | `synapse-shared` + Renovate 봇 자동 PR |
| 로컬 환경 부트스트랩 복잡 | gitops 레포의 `bootstrap.sh` 한 명령어 |
| cross-repo 변경 추적 | GitHub Project 메타 이슈 + PR 링크 컨벤션 |

**결론**: 폴리레포의 단점은 도구로 해결 가능, 모노레포의 단점(도메인 결합 + 충돌 폭증)은 5주 안에 해결 불가. 그래서 폴리레포입니다.

#### 더 깊이 알고 싶다면

- 📄 [ADR-001: 서비스 분리 기준](#7-결정-배경-adr)
- 📄 [ADR-002: learning-svc 내부 모노 예외 사유](#7-결정-배경-adr)

---

### 1.2 8개 레포 한눈에 보기

#### 의존 관계 다이어그램



<figure class="mermaid-svg">
<svg preserveAspectRatio="xMidYMin meet" id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart" style="max-width: 1296.96px; background-color: transparent;" viewBox="0 0 1296.9609375 596" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#my-svg{font-family:Plus Jakarta Sans,Helvetica,Arial,sans-serif;font-size:14px;fill:#ffffff;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:hsl(29.8378378378, 78.7234042553%, 51.0784313725%);}#my-svg .error-text{fill:rgb(26.5425531915, 125.2808510641, 222.9574468087);stroke:rgb(26.5425531915, 125.2808510641, 222.9574468087);}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#888888;stroke:#888888;}#my-svg .marker.cross{stroke:#888888;}#my-svg svg{font-family:Plus Jakarta Sans,Helvetica,Arial,sans-serif;font-size:14px;}#my-svg p{margin:0;}#my-svg .label{font-family:Plus Jakarta Sans,Helvetica,Arial,sans-serif;color:#ffffff;}#my-svg .cluster-label text{fill:rgb(26.5425531915, 125.2808510641, 222.9574468087);}#my-svg .cluster-label span{color:rgb(26.5425531915, 125.2808510641, 222.9574468087);}#my-svg .cluster-label span p{background-color:transparent;}#my-svg .label text,#my-svg span{fill:#ffffff;color:#ffffff;}#my-svg .node rect,#my-svg .node circle,#my-svg .node ellipse,#my-svg .node polygon,#my-svg .node path{fill:#1976d2;stroke:#0d47a1;stroke-width:1px;}#my-svg .rough-node .label text,#my-svg .node .label text,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-anchor:middle;}#my-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#my-svg .rough-node .label,#my-svg .node .label,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-align:center;}#my-svg .node.clickable{cursor:pointer;}#my-svg .root .anchor path{fill:#888888!important;stroke-width:0;stroke:#888888;}#my-svg .arrowheadPath{fill:#0b0b0b;}#my-svg .edgePath .path{stroke:#888888;stroke-width:1px;}#my-svg .flowchart-link{stroke:#888888;fill:none;}#my-svg .edgeLabel{background-color:hsl(89.8378378378, 78.7234042553%, 46.0784313725%);text-align:center;}#my-svg .edgeLabel p{background-color:hsl(89.8378378378, 78.7234042553%, 46.0784313725%);}#my-svg .edgeLabel rect{opacity:0.5;background-color:hsl(89.8378378378, 78.7234042553%, 46.0784313725%);fill:hsl(89.8378378378, 78.7234042553%, 46.0784313725%);}#my-svg .labelBkg{background-color:rgba(118, 209.9999999998, 25, 0.5);}#my-svg .cluster rect{fill:#f5f5f5;stroke:#9e9e9e;stroke-width:1px;}#my-svg .cluster text{fill:rgb(26.5425531915, 125.2808510641, 222.9574468087);}#my-svg .cluster span{color:rgb(26.5425531915, 125.2808510641, 222.9574468087);}#my-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:Plus Jakarta Sans,Helvetica,Arial,sans-serif;font-size:12px;background:hsl(29.8378378378, 78.7234042553%, 51.0784313725%);border:1px solid hsl(29.8378378378, 38.7234042553%, 41.0784313725%);border-radius:2px;pointer-events:none;z-index:100;}#my-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#ffffff;}#my-svg rect.text{fill:none;stroke-width:0;}#my-svg .icon-shape,#my-svg .image-shape{background-color:hsl(89.8378378378, 78.7234042553%, 46.0784313725%);text-align:center;}#my-svg .icon-shape p,#my-svg .image-shape p{background-color:hsl(89.8378378378, 78.7234042553%, 46.0784313725%);padding:2px;}#my-svg .icon-shape .label rect,#my-svg .image-shape .label rect{opacity:0.5;background-color:hsl(89.8378378378, 78.7234042553%, 46.0784313725%);fill:hsl(89.8378378378, 78.7234042553%, 46.0784313725%);}#my-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#my-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#my-svg .node .neo-node{stroke:#0d47a1;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:url(#my-svg-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#my-svg [data-look="neo"].node path{stroke:url(#my-svg-gradient);stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#0d47a1;filter:none;}#my-svg [data-look="neo"].node circle{stroke:url(#my-svg-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:url(#my-svg-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:url(#my-svg-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}#my-svg .tier1&gt;*{fill:#1976d2!important;stroke:#0d47a1!important;stroke-width:2px!important;color:#ffffff!important;}#my-svg .tier1 span{fill:#1976d2!important;stroke:#0d47a1!important;stroke-width:2px!important;color:#ffffff!important;}#my-svg .tier1 tspan{fill:#ffffff!important;}#my-svg .tier2&gt;*{fill:#f57c00!important;stroke:#e65100!important;stroke-width:2px!important;color:#ffffff!important;}#my-svg .tier2 span{fill:#f57c00!important;stroke:#e65100!important;stroke-width:2px!important;color:#ffffff!important;}#my-svg .tier2 tspan{fill:#ffffff!important;}#my-svg .tier3&gt;*{fill:#388e3c!important;stroke:#1b5e20!important;stroke-width:2px!important;color:#ffffff!important;}#my-svg .tier3 span{fill:#388e3c!important;stroke:#1b5e20!important;stroke-width:2px!important;color:#ffffff!important;}#my-svg .tier3 tspan{fill:#ffffff!important;}</style><g><marker id="my-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"/></marker><marker id="my-svg_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"><g class="cluster" id="my-svg-Tier3" data-look="classic"><rect style="" x="63.48046875" y="466" width="553.69921875" height="122"/><g class="cluster-label" transform="translate(301.306640625, 466)"><foreignObject width="78.046875" height="21"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5;"><span class="nodeLabel"><p>Tier 3 — 배포</p></span></div></foreignObject></g></g><g class="cluster" id="my-svg-Tier2" data-look="classic"><rect style="" x="637.1796875" y="466" width="623.90625" height="122"/><g class="cluster-label" transform="translate(910.109375, 466)"><foreignObject width="78.046875" height="21"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5;"><span class="nodeLabel"><p>Tier 2 — 보조</p></span></div></foreignObject></g></g><g class="cluster" id="my-svg-Tier1" data-look="classic"><rect style="" x="8" y="8" width="1280.9609375" height="387"/><g class="cluster-label" transform="translate(549.76171875, 8)"><foreignObject width="197.4375" height="21"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5;"><span class="nodeLabel"><p>Tier 1 — 핵심 코드 (개발자 작업 대상)</p></span></div></foreignObject></g></g></g><g class="edgePaths"><path d="M717.773,75.82L612.105,84.85C506.436,93.88,295.099,111.94,189.43,131.137C83.762,150.333,83.762,170.667,83.762,192.75C83.762,214.833,83.762,238.667,87.966,255.974C92.17,273.282,100.579,284.064,104.783,289.455L108.988,294.846" id="my-svg-L_SHARED_PLAT_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_SHARED_PLAT_0" data-points="W3sieCI6NzE3Ljc3MzQzNzUsInkiOjc1LjgyMDM5NDExNDAwOTZ9LHsieCI6ODMuNzYxNzE4NzUsInkiOjEzMH0seyJ4Ijo4My43NjE3MTg3NSwieSI6MTkxfSx7IngiOjgzLjc2MTcxODc1LCJ5IjoyNjIuNX0seyJ4IjoxMTEuNDQ3NjA3MDgwNDE5NTcsInkiOjI5OH1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M717.773,78.535L645.979,87.113C574.184,95.69,430.594,112.845,358.799,131.589C287.004,150.333,287.004,170.667,287.004,192.75C287.004,214.833,287.004,238.667,295.482,256.135C303.961,273.603,320.918,284.706,329.397,290.257L337.875,295.809" id="my-svg-L_SHARED_ENG_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_SHARED_ENG_0" data-points="W3sieCI6NzE3Ljc3MzQzNzUsInkiOjc4LjUzNTMxODkxNDUzNTM0fSx7IngiOjI4Ny4wMDM5MDYyNSwieSI6MTMwfSx7IngiOjI4Ny4wMDM5MDYyNSwieSI6MTkxfSx7IngiOjI4Ny4wMDM5MDYyNSwieSI6MjYyLjV9LHsieCI6MzQxLjIyMTcwMDE3NDgyNTIsInkiOjI5OH1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M739.215,105L732.459,109.167C725.703,113.333,712.191,121.667,705.436,136C698.68,150.333,698.68,170.667,698.68,192.75C698.68,214.833,698.68,238.667,704.923,256.06C711.166,273.454,723.652,284.408,729.895,289.885L736.138,295.362" id="my-svg-L_SHARED_KNOW_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_SHARED_KNOW_0" data-points="W3sieCI6NzM5LjIxNTAzNTg2MDY1NTcsInkiOjEwNX0seyJ4Ijo2OTguNjc5Njg3NSwieSI6MTMwfSx7IngiOjY5OC42Nzk2ODc1LCJ5IjoxOTF9LHsieCI6Njk4LjY3OTY4NzUsInkiOjI2Mi41fSx7IngiOjczOS4xNDQ3MjI0NjUwMzUsInkiOjI5OH1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M877.398,98.055L892.024,103.379C906.65,108.703,935.901,119.352,950.527,134.842C965.152,150.333,965.152,170.667,965.152,192.75C965.152,214.833,965.152,238.667,970.152,256.01C975.152,273.353,985.151,284.206,990.151,289.632L995.151,295.058" id="my-svg-L_SHARED_LEARN_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_SHARED_LEARN_0" data-points="W3sieCI6ODc3LjM5ODQzNzUsInkiOjk4LjA1NDUyNTk1NzUyNjE3fSx7IngiOjk2NS4xNTIzNDM3NSwieSI6MTMwfSx7IngiOjk2NS4xNTIzNDM3NSwieSI6MTkxfSx7IngiOjk2NS4xNTIzNDM3NSwieSI6MjYyLjV9LHsieCI6OTk3Ljg2MTQ1MTA0ODk1MSwieSI6Mjk4fV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M826.193,105L829.504,109.167C832.815,113.333,839.437,121.667,842.748,129.333C846.059,137,846.059,144,846.059,147.5L846.059,151" id="my-svg-L_SHARED_FE_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_SHARED_FE_0" data-points="W3sieCI6ODI2LjE5Mjc1MTAyNDU5MDIsInkiOjEwNX0seyJ4Ijo4NDYuMDU4NTkzNzUsInkiOjEzMH0seyJ4Ijo4NDYuMDU4NTkzNzUsInkiOjE1NX1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M761.965,201.066L676.424,211.305C590.884,221.544,419.803,242.022,325.784,257.812C231.766,273.603,214.808,284.706,206.33,290.257L197.851,295.809" id="my-svg-L_FE_PLAT_0" class="edge-thickness-normal edge-pattern-dotted edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_FE_PLAT_0" data-points="W3sieCI6NzYxLjk2NDg0Mzc1LCJ5IjoyMDEuMDY1ODY1MzY1NzUxNn0seyJ4IjoyNDguNzIyNjU2MjUsInkiOjI2Mi41fSx7IngiOjE5NC41MDQ4NjIzMjUxNzQ4MywieSI6Mjk4fV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M761.965,207.316L714.563,216.514C667.16,225.711,572.355,244.105,518.722,258.779C465.089,273.453,452.627,284.406,446.397,289.883L440.166,295.359" id="my-svg-L_FE_ENG_0" class="edge-thickness-normal edge-pattern-dotted edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_FE_ENG_0" data-points="W3sieCI6NzYxLjk2NDg0Mzc1LCJ5IjoyMDcuMzE2MzUxODQxMjUxNjd9LHsieCI6NDc3LjU1MDc4MTI1LCJ5IjoyNjIuNX0seyJ4Ijo0MzcuMTYxMzg1NDg5NTEwNSwieSI6Mjk4fV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M846.059,227L846.059,232.917C846.059,238.833,846.059,250.667,841.059,262.01C836.059,273.353,826.059,284.206,821.06,289.632L816.06,295.058" id="my-svg-L_FE_KNOW_0" class="edge-thickness-normal edge-pattern-dotted edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_FE_KNOW_0" data-points="W3sieCI6ODQ2LjA1ODU5Mzc1LCJ5IjoyMjd9LHsieCI6ODQ2LjA1ODU5Mzc1LCJ5IjoyNjIuNX0seyJ4Ijo4MTMuMzQ5NDg2NDUxMDQ5LCJ5IjoyOTh9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M930.152,216.128L956.017,223.857C981.882,231.585,1033.611,247.043,1055.384,260.157C1077.158,273.272,1068.977,284.043,1064.886,289.429L1060.795,294.815" id="my-svg-L_FE_LEARN_0" class="edge-thickness-normal edge-pattern-dotted edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_FE_LEARN_0" data-points="W3sieCI6OTMwLjE1MjM0Mzc1LCJ5IjoyMTYuMTI4MTgzMzYxNjI5ODh9LHsieCI6MTA4NS4zMzk4NDM3NSwieSI6MjYyLjV9LHsieCI6MTA1OC4zNzU0MzcwNjI5MzcsInkiOjI5OH1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M236.047,344.951L309.569,353.293C383.091,361.634,530.135,378.317,603.658,392.575C677.18,406.833,677.18,418.667,677.18,430.5C677.18,442.333,677.18,454.167,701.827,466.665C726.474,479.164,775.767,492.327,800.414,498.909L825.061,505.491" id="my-svg-L_PLAT_MIRROR_0" class="edge-thickness-normal edge-pattern-dotted edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_PLAT_MIRROR_0" data-points="W3sieCI6MjM2LjA0Njg3NSwieSI6MzQ0Ljk1MTEwNDMzMDEzNjU2fSx7IngiOjY3Ny4xNzk2ODc1LCJ5IjozOTV9LHsieCI6Njc3LjE3OTY4NzUsInkiOjQzMC41fSx7IngiOjY3Ny4xNzk2ODc1LCJ5Ijo0NjZ9LHsieCI6ODI4LjkyNTc4MTI1LCJ5Ijo1MDYuNTIzMDYwMzQ4NTEzMDd9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M506.359,354.211L543.413,361.009C580.466,367.807,654.573,381.404,691.626,394.118C728.68,406.833,728.68,418.667,728.68,430.5C728.68,442.333,728.68,454.167,744.757,465.626C760.835,477.086,792.989,488.173,809.067,493.716L825.144,499.259" id="my-svg-L_ENG_MIRROR_0" class="edge-thickness-normal edge-pattern-dotted edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_ENG_MIRROR_0" data-points="W3sieCI6NTA2LjM1OTM3NSwieSI6MzU0LjIxMDU0MTE1NjU2NjV9LHsieCI6NzI4LjY3OTY4NzUsInkiOjM5NX0seyJ4Ijo3MjguNjc5Njg3NSwieSI6NDMwLjV9LHsieCI6NzI4LjY3OTY4NzUsInkiOjQ2Nn0seyJ4Ijo4MjguOTI1NzgxMjUsInkiOjUwMC41NjI1ODE0MTQzNDY2fV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M780.18,370L780.18,374.167C780.18,378.333,780.18,386.667,780.18,396.75C780.18,406.833,780.18,418.667,780.18,430.5C780.18,442.333,780.18,454.167,788.147,463.958C796.115,473.75,812.051,481.5,820.019,485.375L827.987,489.251" id="my-svg-L_KNOW_MIRROR_0" class="edge-thickness-normal edge-pattern-dotted edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_KNOW_MIRROR_0" data-points="W3sieCI6NzgwLjE3OTY4NzUsInkiOjM3MH0seyJ4Ijo3ODAuMTc5Njg3NSwieSI6Mzk1fSx7IngiOjc4MC4xNzk2ODc1LCJ5Ijo0MzAuNX0seyJ4Ijo3ODAuMTc5Njg3NSwieSI6NDY2fSx7IngiOjgzMS41ODM2OTYyMDkwMTY0LCJ5Ijo0OTF9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M1031.031,370L1031.031,374.167C1031.031,378.333,1031.031,386.667,1031.031,396.75C1031.031,406.833,1031.031,418.667,1031.031,430.5C1031.031,442.333,1031.031,454.167,1023.063,463.958C1015.096,473.75,999.16,481.5,991.192,485.375L983.224,489.251" id="my-svg-L_LEARN_MIRROR_0" class="edge-thickness-normal edge-pattern-dotted edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_LEARN_MIRROR_0" data-points="W3sieCI6MTAzMS4wMzEyNSwieSI6MzcwfSx7IngiOjEwMzEuMDMxMjUsInkiOjM5NX0seyJ4IjoxMDMxLjAzMTI1LCJ5Ijo0MzAuNX0seyJ4IjoxMDMxLjAzMTI1LCJ5Ijo0NjZ9LHsieCI6OTc5LjYyNzI0MTI5MDk4MzYsInkiOjQ5MX1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M930.152,209.118L971.449,218.015C1012.745,226.912,1095.337,244.706,1136.633,265.52C1177.93,286.333,1177.93,310.167,1177.93,332.25C1177.93,354.333,1177.93,374.667,1177.93,390.75C1177.93,406.833,1177.93,418.667,1177.93,430.5C1177.93,442.333,1177.93,454.167,1145.973,467.242C1114.016,480.317,1050.102,494.633,1018.145,501.791L986.188,508.95" id="my-svg-L_FE_MIRROR_0" class="edge-thickness-normal edge-pattern-dotted edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_FE_MIRROR_0" data-points="W3sieCI6OTMwLjE1MjM0Mzc1LCJ5IjoyMDkuMTE3NTg2MTI5NzgwMjV9LHsieCI6MTE3Ny45Mjk2ODc1LCJ5IjoyNjIuNX0seyJ4IjoxMTc3LjkyOTY4NzUsInkiOjMzNH0seyJ4IjoxMTc3LjkyOTY4NzUsInkiOjM5NX0seyJ4IjoxMTc3LjkyOTY4NzUsInkiOjQzMC41fSx7IngiOjExNzcuOTI5Njg3NSwieSI6NDY2fSx7IngiOjk4Mi4yODUxNTYyNSwieSI6NTA5LjgyMzkyNTk4NDM2NDl9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M877.398,80.701L933.445,88.917C989.492,97.134,1101.586,113.567,1157.633,131.95C1213.68,150.333,1213.68,170.667,1213.68,192.75C1213.68,214.833,1213.68,238.667,1213.68,262.5C1213.68,286.333,1213.68,310.167,1213.68,332.25C1213.68,354.333,1213.68,374.667,1213.68,390.75C1213.68,406.833,1213.68,418.667,1213.68,430.5C1213.68,442.333,1213.68,454.167,1175.768,467.59C1137.856,481.013,1062.033,496.027,1024.121,503.533L986.209,511.04" id="my-svg-L_SHARED_MIRROR_0" class="edge-thickness-normal edge-pattern-dotted edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_SHARED_MIRROR_0" data-points="W3sieCI6ODc3LjM5ODQzNzUsInkiOjgwLjcwMDYzODM3Nzc2OTQ0fSx7IngiOjEyMTMuNjc5Njg3NSwieSI6MTMwfSx7IngiOjEyMTMuNjc5Njg3NSwieSI6MTkxfSx7IngiOjEyMTMuNjc5Njg3NSwieSI6MjYyLjV9LHsieCI6MTIxMy42Nzk2ODc1LCJ5IjozMzR9LHsieCI6MTIxMy42Nzk2ODc1LCJ5IjozOTV9LHsieCI6MTIxMy42Nzk2ODc1LCJ5Ijo0MzAuNX0seyJ4IjoxMjEzLjY3OTY4NzUsInkiOjQ2Nn0seyJ4Ijo5ODIuMjg1MTU2MjUsInkiOjUxMS44MTcwOTcxMzgyMjAwNX1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M139.523,370L139.523,374.167C139.523,378.333,139.523,386.667,139.523,396.75C139.523,406.833,139.523,418.667,139.523,430.5C139.523,442.333,139.523,454.167,176.602,467.536C213.681,480.906,287.839,495.812,324.918,503.264L361.996,510.717" id="my-svg-L_PLAT_GITOPS_0" class="edge-thickness-normal edge-pattern-dotted edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_PLAT_GITOPS_0" data-points="W3sieCI6MTM5LjUyMzQzNzUsInkiOjM3MH0seyJ4IjoxMzkuNTIzNDM3NSwieSI6Mzk1fSx7IngiOjEzOS41MjM0Mzc1LCJ5Ijo0MzAuNX0seyJ4IjoxMzkuNTIzNDM3NSwieSI6NDY2fSx7IngiOjM2NS45MTc5Njg3NSwieSI6NTExLjUwNTYxODQxMTM5OX1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M396.203,370L396.203,374.167C396.203,378.333,396.203,386.667,396.203,396.75C396.203,406.833,396.203,418.667,396.203,430.5C396.203,442.333,396.203,454.167,398.994,463.721C401.785,473.275,407.367,480.551,410.158,484.189L412.949,487.826" id="my-svg-L_ENG_GITOPS_0" class="edge-thickness-normal edge-pattern-dotted edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_ENG_GITOPS_0" data-points="W3sieCI6Mzk2LjIwMzEyNSwieSI6MzcwfSx7IngiOjM5Ni4yMDMxMjUsInkiOjM5NX0seyJ4IjozOTYuMjAzMTI1LCJ5Ijo0MzAuNX0seyJ4IjozOTYuMjAzMTI1LCJ5Ijo0NjZ9LHsieCI6NDE1LjM4Mzc3MzA1MzI3ODcsInkiOjQ5MX1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M675.477,354.765L641.663,361.47C607.849,368.176,540.221,381.588,506.408,394.211C472.594,406.833,472.594,418.667,472.594,430.5C472.594,442.333,472.594,454.167,470.864,463.65C469.133,473.134,465.673,480.267,463.943,483.834L462.213,487.401" id="my-svg-L_KNOW_GITOPS_0" class="edge-thickness-normal edge-pattern-dotted edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_KNOW_GITOPS_0" data-points="W3sieCI6Njc1LjQ3NjU2MjUsInkiOjM1NC43NjQ1NzI5MDg5OTM5Nn0seyJ4Ijo0NzIuNTkzNzUsInkiOjM5NX0seyJ4Ijo0NzIuNTkzNzUsInkiOjQzMC41fSx7IngiOjQ3Mi41OTM3NSwieSI6NDY2fSx7IngiOjQ2MC40NjY3NjQ4NTY1NTczNSwieSI6NDkxfV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M934.883,346.167L870.566,354.306C806.25,362.445,677.617,378.722,613.301,392.778C548.984,406.833,548.984,418.667,548.984,430.5C548.984,442.333,548.984,454.167,542.323,463.917C535.662,473.668,522.339,481.336,515.678,485.171L509.017,489.005" id="my-svg-L_LEARN_GITOPS_0" class="edge-thickness-normal edge-pattern-dotted edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_LEARN_GITOPS_0" data-points="W3sieCI6OTM0Ljg4MjgxMjUsInkiOjM0Ni4xNjY5ODAwMDA2NDgyN30seyJ4Ijo1NDguOTg0Mzc1LCJ5IjozOTV9LHsieCI6NTQ4Ljk4NDM3NSwieSI6NDMwLjV9LHsieCI6NTQ4Ljk4NDM3NSwieSI6NDY2fSx7IngiOjUwNS41NDk3NTY2NTk4MzYxLCJ5Ijo0OTF9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M761.965,215.159L734.501,223.049C707.036,230.939,652.108,246.72,624.644,266.527C597.18,286.333,597.18,310.167,597.18,332.25C597.18,354.333,597.18,374.667,597.18,390.75C597.18,406.833,597.18,418.667,597.18,430.5C597.18,442.333,597.18,454.167,584.951,464.922C572.723,475.676,548.266,485.353,536.038,490.191L523.809,495.029" id="my-svg-L_FE_GITOPS_0" class="edge-thickness-normal edge-pattern-dotted edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_FE_GITOPS_0" data-points="W3sieCI6NzYxLjk2NDg0Mzc1LCJ5IjoyMTUuMTU5MTUxMTkzNjMzOTZ9LHsieCI6NTk3LjE3OTY4NzUsInkiOjI2Mi41fSx7IngiOjU5Ny4xNzk2ODc1LCJ5IjozMzR9LHsieCI6NTk3LjE3OTY4NzUsInkiOjM5NX0seyJ4Ijo1OTcuMTc5Njg3NSwieSI6NDMwLjV9LHsieCI6NTk3LjE3OTY4NzUsInkiOjQ2Nn0seyJ4Ijo1MjAuMDg5ODQzNzUsInkiOjQ5Ni41MDA3NzI3NTgzNjczfV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_SHARED_PLAT_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_SHARED_ENG_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_SHARED_KNOW_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_SHARED_LEARN_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_SHARED_FE_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(473.17041, 235.63402)"><g class="label" data-id="L_FE_PLAT_0" transform="translate(-18.28125, -10.5)"><foreignObject width="36.5625" height="21"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>HTTP</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(593.36346, 240.02936)"><g class="label" data-id="L_FE_ENG_0" transform="translate(-18.28125, -10.5)"><foreignObject width="36.5625" height="21"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>HTTP</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(846.05859375, 262.5)"><g class="label" data-id="L_FE_KNOW_0" transform="translate(-18.28125, -10.5)"><foreignObject width="36.5625" height="21"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>HTTP</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(1029.10276, 245.69571)"><g class="label" data-id="L_FE_LEARN_0" transform="translate(-18.28125, -10.5)"><foreignObject width="36.5625" height="21"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>HTTP</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(677.1796875, 430.5)"><g class="label" data-id="L_PLAT_MIRROR_0" transform="translate(-15.75, -10.5)"><foreignObject width="31.5" height="21"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>동기화</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(728.6796875, 430.5)"><g class="label" data-id="L_ENG_MIRROR_0" transform="translate(-15.75, -10.5)"><foreignObject width="31.5" height="21"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>동기화</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(780.1796875, 430.5)"><g class="label" data-id="L_KNOW_MIRROR_0" transform="translate(-15.75, -10.5)"><foreignObject width="31.5" height="21"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>동기화</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(1031.03125, 430.5)"><g class="label" data-id="L_LEARN_MIRROR_0" transform="translate(-15.75, -10.5)"><foreignObject width="31.5" height="21"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>동기화</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(1177.9296875, 334)"><g class="label" data-id="L_FE_MIRROR_0" transform="translate(-15.75, -10.5)"><foreignObject width="31.5" height="21"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>동기화</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(1213.6796875, 262.5)"><g class="label" data-id="L_SHARED_MIRROR_0" transform="translate(-15.75, -10.5)"><foreignObject width="31.5" height="21"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>동기화</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(139.5234375, 430.5)"><g class="label" data-id="L_PLAT_GITOPS_0" transform="translate(-28.1953125, -10.5)"><foreignObject width="56.390625" height="21"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>이미지 태그</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(396.203125, 430.5)"><g class="label" data-id="L_ENG_GITOPS_0" transform="translate(-28.1953125, -10.5)"><foreignObject width="56.390625" height="21"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>이미지 태그</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(472.59375, 430.5)"><g class="label" data-id="L_KNOW_GITOPS_0" transform="translate(-28.1953125, -10.5)"><foreignObject width="56.390625" height="21"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>이미지 태그</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(548.984375, 430.5)"><g class="label" data-id="L_LEARN_GITOPS_0" transform="translate(-28.1953125, -10.5)"><foreignObject width="56.390625" height="21"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>이미지 태그</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(597.1796875, 334)"><g class="label" data-id="L_FE_GITOPS_0" transform="translate(-28.1953125, -10.5)"><foreignObject width="56.390625" height="21"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>이미지 태그</p></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default tier1" id="my-svg-flowchart-FE-0" data-look="classic" transform="translate(846.05859375, 191)"><rect class="basic label-container" style="fill:#1976d2 !important;stroke:#0d47a1 !important;stroke-width:2px !important" x="-84.09375" y="-36" width="168.1875" height="72"/><g class="label" style="color:#ffffff !important" transform="translate(-54.09375, -21)"><rect/><foreignObject width="108.1875" height="42"><div style="color: rgb(255, 255, 255) !important; display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;" xmlns="http://www.w3.org/1999/xhtml"><span style="color:#ffffff !important" class="nodeLabel"><p>synapse-frontend<br />Flutter 3.x</p></span></div></foreignObject></g></g><g class="node default tier1" id="my-svg-flowchart-PLAT-1" data-look="classic" transform="translate(139.5234375, 334)"><rect class="basic label-container" style="fill:#1976d2 !important;stroke:#0d47a1 !important;stroke-width:2px !important" x="-96.5234375" y="-36" width="193.046875" height="72"/><g class="label" style="color:#ffffff !important" transform="translate(-66.5234375, -21)"><rect/><foreignObject width="133.046875" height="42"><div style="color: rgb(255, 255, 255) !important; display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;" xmlns="http://www.w3.org/1999/xhtml"><span style="color:#ffffff !important" class="nodeLabel"><p>synapse-platform-svc<br />Spring Boot 4</p></span></div></foreignObject></g></g><g class="node default tier1" id="my-svg-flowchart-ENG-2" data-look="classic" transform="translate(396.203125, 334)"><rect class="basic label-container" style="fill:#1976d2 !important;stroke:#0d47a1 !important;stroke-width:2px !important" x="-110.15625" y="-36" width="220.3125" height="72"/><g class="label" style="color:#ffffff !important" transform="translate(-80.15625, -21)"><rect/><foreignObject width="160.3125" height="42"><div style="color: rgb(255, 255, 255) !important; display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;" xmlns="http://www.w3.org/1999/xhtml"><span style="color:#ffffff !important" class="nodeLabel"><p>synapse-engagement-svc<br />Spring Boot 4</p></span></div></foreignObject></g></g><g class="node default tier1" id="my-svg-flowchart-KNOW-3" data-look="classic" transform="translate(780.1796875, 334)"><rect class="basic label-container" style="fill:#1976d2 !important;stroke:#0d47a1 !important;stroke-width:2px !important" x="-104.703125" y="-36" width="209.40625" height="72"/><g class="label" style="color:#ffffff !important" transform="translate(-74.703125, -21)"><rect/><foreignObject width="149.40625" height="42"><div style="color: rgb(255, 255, 255) !important; display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;" xmlns="http://www.w3.org/1999/xhtml"><span style="color:#ffffff !important" class="nodeLabel"><p>synapse-knowledge-svc<br />Spring Boot 4</p></span></div></foreignObject></g></g><g class="node default tier1" id="my-svg-flowchart-LEARN-4" data-look="classic" transform="translate(1031.03125, 334)"><rect class="basic label-container" style="fill:#1976d2 !important;stroke:#0d47a1 !important;stroke-width:2px !important" x="-96.1484375" y="-36" width="192.296875" height="72"/><g class="label" style="color:#ffffff !important" transform="translate(-66.1484375, -21)"><rect/><foreignObject width="132.296875" height="42"><div style="color: rgb(255, 255, 255) !important; display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;" xmlns="http://www.w3.org/1999/xhtml"><span style="color:#ffffff !important" class="nodeLabel"><p>synapse-learning-svc<br />Java + Python</p></span></div></foreignObject></g></g><g class="node default tier1" id="my-svg-flowchart-SHARED-5" data-look="classic" transform="translate(797.5859375, 69)"><rect class="basic label-container" style="fill:#1976d2 !important;stroke:#0d47a1 !important;stroke-width:2px !important" x="-79.8125" y="-36" width="159.625" height="72"/><g class="label" style="color:#ffffff !important" transform="translate(-49.8125, -21)"><rect/><foreignObject width="99.625" height="42"><div style="color: rgb(255, 255, 255) !important; display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;" xmlns="http://www.w3.org/1999/xhtml"><span style="color:#ffffff !important" class="nodeLabel"><p>synapse-shared<br />공통 라이브러리</p></span></div></foreignObject></g></g><g class="node default tier2" id="my-svg-flowchart-MIRROR-6" data-look="classic" transform="translate(905.60546875, 527)"><rect class="basic label-container" style="fill:#f57c00 !important;stroke:#e65100 !important;stroke-width:2px !important" x="-76.6796875" y="-36" width="153.359375" height="72"/><g class="label" style="color:#ffffff !important" transform="translate(-46.6796875, -21)"><rect/><foreignObject width="93.359375" height="42"><div style="color: rgb(255, 255, 255) !important; display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;" xmlns="http://www.w3.org/1999/xhtml"><span style="color:#ffffff !important" class="nodeLabel"><p>synapse-mirror<br />read-only 미러</p></span></div></foreignObject></g></g><g class="node default tier3" id="my-svg-flowchart-GITOPS-7" data-look="classic" transform="translate(443.00390625, 527)"><rect class="basic label-container" style="fill:#388e3c !important;stroke:#1b5e20 !important;stroke-width:2px !important" x="-77.0859375" y="-36" width="154.171875" height="72"/><g class="label" style="color:#ffffff !important" transform="translate(-47.0859375, -21)"><rect/><foreignObject width="94.171875" height="42"><div style="color: rgb(255, 255, 255) !important; display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;" xmlns="http://www.w3.org/1999/xhtml"><span style="color:#ffffff !important" class="nodeLabel"><p>synapse-gitops<br />K8s + ArgoCD</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="my-svg-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="my-svg-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><linearGradient id="my-svg-gradient" gradientUnits="objectBoundingBox" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#0d47a1" stop-opacity="1"/><stop offset="100%" stop-color="hsl(89.8378378378, 38.7234042553%, 36.0784313725%)" stop-opacity="1"/></linearGradient></svg>
</figure>


#### 레포 카탈로그

| 레포 | Tier | Prefix | 주요 기술 | 책임 도메인 | CODEOWNERS |
|------|:---:|--------|-----------|-------------|------------|
| **synapse-platform-svc** | 1 | `PLAT` | Spring Boot 4, Spring Modulith | 인증, 결제, 사용자, 멀티테넌트 | `@platform-team` |
| **synapse-engagement-svc** | 1 | `ENG` | Spring Boot 4, Spring Modulith | 커뮤니티, 게이미피케이션, 알림 | `@community-team` |
| **synapse-knowledge-svc** | 1 | `KNOW` | Spring Boot 4, Spring Modulith, Elasticsearch | 노트, 위키링크, 지식 그래프, 검색 | `@learning-team` |
| **synapse-learning-svc** | 1 | `LEARN-CARD` `LEARN-AI` | Spring Boot 4 + FastAPI | 카드, SRS(SM-2), AI 카드 생성 | `@learning-team` `@ai-team` |
| **synapse-frontend** | 1 | `FE` | Flutter 3.x (모바일 + 웹) | 모든 클라이언트 UI | `@frontend-team` |
| **synapse-shared** | 1 | `SHARED` | Java/Dart/Python 공통 라이브러리 | DTO, proto, util, error 코드 | `@maintainers` |
| **synapse-mirror** | 2 | (자동) | git mirror | Tier 1 전체의 검색 가능한 사본 | `@maintainers` |
| **synapse-gitops** | 3 | `INFRA` | Kustomize, Argo CD, Helm | K8s 매니페스트, 통합 배포 태그 | `@devops-team` |

#### 색깔로 구분되는 작업 성격

- 🔵 **Tier 1**: 매일 직접 작업하는 곳. PR과 커밋이 일어나는 곳.
- 🟠 **Tier 2 (mirror)**: 직접 push 금지. 검색용으로만 클론.
- 🟢 **Tier 3 (gitops)**: 직접 매니페스트 수정 금지. PR로만 변경.

---

### 1.3 내 역할별 자주 만질 레포

신규 합류자가 "내가 봐야 할 게 뭔지" 즉시 파악하기 위한 매핑입니다.

#### 백엔드 개발자 — Platform 팀

| 빈도 | 레포 |
|:---:|------|
| 매일 | `synapse-platform-svc` |
| 주 1~2회 | `synapse-shared`, `synapse-gitops` |
| 거의 안 봄 | `synapse-frontend`, `synapse-mirror` |

#### 백엔드 개발자 — Community 팀

| 빈도 | 레포 |
|:---:|------|
| 매일 | `synapse-engagement-svc` |
| 주 1~2회 | `synapse-shared`, `synapse-gitops` |
| 가끔 | `synapse-platform-svc` (이벤트 publish 협의 시) |

#### 백엔드 개발자 — Learning 팀

| 빈도 | 레포 |
|:---:|------|
| 매일 | `synapse-knowledge-svc` 또는 `synapse-learning-svc` |
| 주 1~2회 | `synapse-shared`, `synapse-gitops` |
| AI 협업 시 | `synapse-learning-svc/ai/` (Python 영역) |

#### AI 개발자

| 빈도 | 레포 |
|:---:|------|
| 매일 | `synapse-learning-svc/ai/` (Python) |
| 주 1~2회 | `synapse-shared` (Python 패키지), `synapse-gitops` |
| 가끔 | `synapse-learning-svc/card/` `synapse-learning-svc/srs/` (Java 인터페이스 협의) |

#### 프론트엔드 개발자

| 빈도 | 레포 |
|:---:|------|
| 매일 | `synapse-frontend` |
| 주 1~2회 | `synapse-mirror` (백엔드 API 변경 확인용) |
| API 변경 협의 시 | `synapse-platform-svc` 등 백엔드 레포 |

#### DevOps / SRE

| 빈도 | 레포 |
|:---:|------|
| 매일 | `synapse-gitops` |
| 종종 | 모든 서비스 레포 (CI 파이프라인 점검) |
| 모니터링 | `synapse-mirror` (cross-repo 분석) |

---

## 2. 첫 PR까지 30분

> 신규 합류자 온보딩 튜토리얼.
> 이 장만 따라하면 30분 안에 첫 PR을 올릴 수 있습니다.

### 2.1 6개 레포 한 번에 클론하기

#### 사전 준비

```bash
# GitHub CLI 설치 확인
gh --version  # 2.40.0 이상 권장

# 인증
gh auth login

# 작업 디렉토리 생성
mkdir -p ~/workspace/synapse && cd ~/workspace/synapse
```

#### 부트스트랩 스크립트 실행

`synapse-gitops` 레포에 모든 신규 합류자가 사용할 부트스트랩 스크립트가 있습니다.

```bash
# gitops 먼저 클론
gh repo clone team-project-final/synapse-gitops
cd synapse-gitops

# 부트스트랩 실행 (나머지 5개 레포 + mirror 자동 클론)
./scripts/bootstrap.sh

# 결과 확인
cd ..
ls
# synapse-engagement-svc/  synapse-frontend/   synapse-gitops/
# synapse-knowledge-svc/   synapse-learning-svc/  synapse-mirror/
# synapse-platform-svc/    synapse-shared/
```

> **💡 Tip**: bootstrap.sh는 내부적으로 다음을 수행합니다.
> - `gh repo clone` × 7
> - 각 레포에서 `git config user.email` 자동 설정
> - pre-commit 훅 설치 (Husky 또는 pre-commit)
> - `.envrc` 또는 `mise.toml` 기반 환경변수 설정

---

### 2.2 로컬 개발 환경 부트스트랩

#### 인프라 컴포넌트 띄우기 (PostgreSQL/Redis/ES/Kafka)

```bash
cd synapse-gitops/local
docker compose -f docker-compose.infra.yml up -d

# 상태 확인
docker compose ps
# postgres-16    healthy
# redis-7        healthy
# elastic-8      healthy
# kafka-3        healthy
```

#### 본인 서비스만 로컬 실행

전체 8개 서비스를 모두 띄울 필요는 없습니다. **본인 담당 서비스 + 최소 의존성**만 띄우세요.

```bash
# 예: knowledge-svc 개발자라면
cd synapse-knowledge-svc
./gradlew bootRun

# 다른 서비스가 필요하면 docker-compose에서 prebuilt 이미지 사용
cd ../synapse-gitops/local
docker compose -f docker-compose.local.yml up -d platform-svc
```

#### 프론트 개발자

```bash
cd synapse-frontend
flutter pub get
flutter run -d chrome  # 또는 -d <device-id>
```

> **⚠️ 주의**: 백엔드는 가급적 docker-compose로 띄우세요. 본인이 직접 빌드해서 띄우면 버전 mismatch로 인한 디버깅 시간이 길어집니다.

---

### 2.3 작은 변경으로 첫 PR 올려보기

가장 안전한 첫 PR은 **`synapse-shared`의 README나 문서 오타 수정**입니다.

```bash
cd synapse-shared

# 1. 브랜치 생성
git checkout -b docs/SHARED-999-fix-readme-typo

# 2. 파일 수정
vi README.md

# 3. 커밋 (Conventional Commits 형식)
git add README.md
git commit -m "docs(shared): fix typo in README"

# 4. push
git push origin docs/SHARED-999-fix-readme-typo

# 5. PR 생성
gh pr create \
  --title "docs(shared): fix typo in README" \
  --body "README의 오타 수정. 사소한 문서 변경입니다."
```

#### PR 체크리스트

- [ ] 브랜치명에 prefix와 티켓 번호가 있는가? (`docs/SHARED-999-...`)
- [ ] 커밋 메시지가 `<type>(<scope>): <subject>` 형식인가?
- [ ] PR 본문 템플릿을 채웠는가?
- [ ] CI가 모두 초록색인가?
- [ ] Reviewer를 지정했는가? (CODEOWNERS 자동 지정됨)

#### 머지 후

- 원격 브랜치 자동 삭제 확인
- 로컬 브랜치 정리: `git checkout main && git pull && git branch -d docs/SHARED-999-fix-readme-typo`

🎉 **축하합니다. 첫 PR 완료!**

---

## 3. 일상 워크플로우 시나리오

> 이 장이 이 문서의 핵심입니다.
> 추상적 규칙이 아니라 **실제 상황을 끝까지 따라가는 워크스루**입니다.

### 3.1 시나리오 A: 단일 레포 안에서 기능 추가

#### 상황

당신은 Community 팀 백엔드 개발자입니다. 스터디 그룹 초대 기능을 새로 추가합니다. 이 작업은 `synapse-engagement-svc` 안에서만 끝납니다.

#### 작업 흐름

```bash
cd synapse-engagement-svc
git checkout main && git pull
git checkout -b feature/ENG-014-study-group-invite
```

**1. Spring Modulith 모듈 안에서 작업**

```text
synapse-engagement-svc/
├── community/                  ← 이 모듈에서 작업
│   ├── domain/
│   │   ├── StudyGroup.java
│   │   └── Invitation.java     ← 새 도메인 클래스
│   ├── application/
│   │   └── InvitationService.java   ← 새 서비스
│   └── presentation/
│       └── InvitationController.java ← 새 API
├── gamification/               ← 건드리지 않음
└── notification/               ← 알림 발송 시 이벤트만 publish
```

**2. 커밋을 작은 단위로**

```bash
# 도메인 모델
git commit -m "feat(community): add Invitation entity and value objects"

# 서비스 로직
git commit -m "feat(community): implement invitation issue and accept"

# API
git commit -m "feat(community): add invitation REST endpoints"

# 테스트
git commit -m "test(community): add invitation acceptance flow tests"
```

**3. PR 생성**

```bash
git push origin feature/ENG-014-study-group-invite
gh pr create --fill
```

PR 본문 핵심:
- "변경 사항"에 4개 커밋의 내용을 한 줄씩 요약
- "테스트 방법"에 cURL 예시 또는 Postman collection 링크
- 멀티테넌트 격리 체크박스 ✅

**4. 머지**

- 1명 이상 Approve (CODEOWNERS 기반 `@community-team`에서 자동 지정)
- CI 통과
- **Squash and Merge** 선택
- 머지 메시지: `feat(community): add study group invitation (#42)`

#### 함정

| ❌ 하면 안 되는 것 | ✅ 대안 |
|------------------|--------|
| `community` 모듈에서 `gamification` 모듈을 직접 import | 도메인 이벤트 publish (`InvitationAccepted` 등) |
| 한 커밋에 도메인 + API + 테스트 모두 묶기 | 논리 단위로 분리 (위 예시처럼) |
| feature 브랜치를 1주일 이상 유지 | 5일 초과 시 분할 (09번 § 1.3 참조) |

---

### 3.2 시나리오 B: frontend + 백엔드 동시 변경

#### 상황

노트 화면에 "공유 링크 생성" 버튼을 추가합니다. 이 작업은 **`synapse-frontend` + `synapse-knowledge-svc`** 두 레포를 건드립니다.

#### 작업 흐름

**Step 1. GitHub Project에 Epic 이슈 생성**

먼저 메타 이슈를 만들어 두 PR을 묶습니다.

```markdown
# Epic: 노트 공유 링크 생성 기능

## 관련 PR
- [ ] knowledge-svc: API 추가 → #PR번호
- [ ] frontend: 버튼 + 다이얼로그 추가 → #PR번호

## API 계약
- `POST /api/v1/notes/{id}/share-links`
- Request: `{ "expiresIn": "7d" }`
- Response: `{ "url": "https://...", "expiresAt": "..." }`
```

**Step 2. 백엔드 PR 먼저**

```bash
cd synapse-knowledge-svc
git checkout -b feature/KNOW-007-share-link-api

# API 구현
# ...

git commit -m "feat(note): add share link generation API"
git push
gh pr create --title "feat(note): share link API (#42)" \
             --body "Epic: #40\n\nAPI 계약은 메타 이슈 참조."
```

**Step 3. 백엔드 머지 후 프론트 PR**

백엔드가 머지되어 dev 환경에 배포된 후 프론트 작업.

```bash
cd synapse-frontend
git checkout -b feature/FE-088-share-link-button

# UI 구현 + dev API 호출 테스트
# ...

git commit -m "feat(note): add share link button and dialog"
git push
gh pr create --title "feat(note): share link UI (#42)" \
             --body "Epic: #40\nDepends on: knowledge-svc PR #43 (merged)"
```

**Step 4. Epic 이슈 close**

두 PR이 모두 머지되면 Epic 이슈를 close.

#### 핵심 원칙

> **백엔드 → 프론트 순서로 머지하세요.**

순서를 거꾸로 하면 프론트가 존재하지 않는 API를 호출하는 일이 생깁니다. dev 환경에서는 잠깐 깨져도 괜찮지만, 매번 발생하면 신뢰가 무너집니다.

#### 함정

| ❌ 잘못 | ✅ 올바름 |
|--------|---------|
| 한 PR로 두 레포 동시 변경 시도 | 물리적으로 불가능. 두 PR로 분리 |
| API 계약 합의 없이 양쪽 동시 작업 시작 | Epic 이슈에 API 명세 먼저 합의 |
| 프론트 머지를 먼저 | 항상 백엔드 머지 → dev 배포 확인 → 프론트 머지 |

---

### 3.3 시나리오 C: shared 라이브러리 업데이트

> ⚠️ **가장 신중하게 다뤄야 할 시나리오**입니다. shared의 변경은 4개 다운스트림 서비스 모두에 영향을 줍니다.

#### 상황

공통 DTO인 `UserDto`에 `timezone` 필드를 추가해야 합니다.

#### 작업 흐름

**Step 1. 변경 종류 판단 (SemVer)**

| 변경 종류 | SemVer | 예시 |
|----------|:-----:|------|
| 필드 **추가** (선택값) | MINOR | `timezone` 필드 추가 (nullable) |
| 필드 **추가** (필수값) | **MAJOR** | `timezone` 필드 추가 (NOT NULL) |
| 필드 **이름 변경** | MAJOR | `tz` → `timezone` |
| 필드 **삭제** | MAJOR | `legacyField` 제거 |
| 메서드 시그니처 변경 | MAJOR | 매개변수 타입 변경 |
| 버그 수정 (계약 동일) | PATCH | 직렬화 버그 수정 |
| 신규 util 클래스 추가 | MINOR | `DateTimeUtils` 추가 |

이번 케이스: nullable 필드 추가 → **MINOR**.

**Step 2. shared 레포에서 작업**

```bash
cd synapse-shared
git checkout -b feature/SHARED-031-add-timezone-field

# UserDto.java 수정
# UserDto.dart 수정 (Flutter용)
# user_dto.py 수정 (Python용)

git add .
git commit -m "feat(dto): add nullable timezone field to UserDto"
git push origin feature/SHARED-031-add-timezone-field
```

**Step 3. PR CI에서 다운스트림 빌드 검증**

`synapse-shared`의 PR CI는 자동으로 4개 다운스트림 서비스의 빌드 호환성을 테스트합니다.

```yaml
# .github/workflows/downstream-check.yml (shared 레포 내부)
jobs:
  check-downstream:
    strategy:
      matrix:
        repo:
          - synapse-platform-svc
          - synapse-engagement-svc
          - synapse-knowledge-svc
          - synapse-learning-svc
    steps:
      - name: Checkout downstream
        run: gh repo clone team-project-final/${{ matrix.repo }}
      - name: Build with shared SNAPSHOT
        run: # ... shared의 SNAPSHOT을 임시 버전으로 빌드
```

CI가 모두 초록색이어야 머지 가능.

**Step 4. 머지 후 자동 릴리즈**

머지하면 다음이 자동 실행:

1. `synapse-shared:1.5.0` 태그 생성 (semantic-release)
2. Maven Central / pub.dev / PyPI에 패키지 배포
3. **Renovate 봇**이 4개 다운스트림 레포에 PR 자동 생성
   - `chore(deps): bump synapse-shared from 1.4.2 to 1.5.0`

**Step 5. 다운스트림 PR 처리 (각 서비스 담당자)**

```bash
# 예: knowledge-svc 담당자
cd synapse-knowledge-svc
gh pr checkout <Renovate PR 번호>

# 빌드 + 테스트
./gradlew clean build

# 문제 없으면 그대로 머지
gh pr review --approve
gh pr merge --squash
```

**Step 6. shared 새 기능 사용 PR (별도)**

`timezone` 필드를 실제로 활용하는 코드는 **shared 업그레이드 PR과 분리**해서 별도 feature PR로 작성합니다.

#### ⚠️ 함정 모음

**함정 1**: shared MAJOR 버전을 가볍게 올림
```text
❌ 사소한 리팩토링이라 생각해서 메서드명 변경 후 PATCH 릴리즈
→ 다운스트림 빌드가 무더기로 깨짐
✅ 메서드명 변경 = MAJOR. deprecation 2 MINOR 유지 후 다음 MAJOR에서 제거
```

**함정 2**: Renovate PR을 무한정 미룸
```text
❌ "다음 스프린트에 처리하지 뭐"
→ 4개 서비스가 각기 다른 shared 버전을 쓰는 상황 발생
→ 통합 테스트가 깨지기 시작
✅ Renovate PR은 24시간 내 처리 원칙
```

**함정 3**: 필드 삭제를 1 PR로 끝내려 함
```text
❌ shared에서 필드 삭제 → 다운스트림 빌드 깨짐
✅ 3단계로 진행:
   1. 필드에 @Deprecated 추가 (MINOR)
   2. 다운스트림에서 사용 제거 (각 서비스 PR)
   3. shared에서 실제 필드 삭제 (MAJOR)
```

#### 관련 문서

- 09번 § 2.2 Type 정의
- 09번 § 4.1 SemVer 형식
- ADR-003 (있다면): shared 라이브러리 버전 정책

---

### 3.4 시나리오 D: learning-svc에서 Java + Python 동시 변경

> 이 시나리오가 **`synapse-learning-svc`가 내부 모노인 이유**를 가장 잘 보여줍니다.

#### 상황

AI 카드 생성 결과의 품질 점수를 SRS 알고리즘 입력으로 활용하도록 수정합니다. Python(ai)과 Java(card/srs)를 동시에 수정해야 합니다.

#### 레포 내부 구조

```text
synapse-learning-svc/
├── card/                       # Java, Spring Modulith 모듈
│   ├── src/main/java/...
│   └── build.gradle.kts
├── srs/                        # Java, Spring Modulith 모듈
│   └── ...
├── ai/                         # Python, FastAPI
│   ├── app/
│   │   ├── api/
│   │   ├── llm/
│   │   └── card_generator.py
│   ├── tests/
│   └── pyproject.toml
├── shared-java/                # Java 내부 공통
├── shared-python/              # Python 내부 공통
├── docker/
│   ├── Dockerfile.card-srs     # Java 컨테이너
│   └── Dockerfile.ai           # Python 컨테이너
├── settings.gradle.kts
└── .github/workflows/ci.yml
```

#### 작업 흐름

**Step 1. 단일 브랜치에서 양쪽 작업**

```bash
cd synapse-learning-svc
git checkout -b feature/LEARN-AI-005-quality-score-to-srs

# Python 수정 (AI 응답에 score 필드 추가)
vi ai/app/card_generator.py

# Java 수정 (SRS가 score를 받도록)
vi srs/src/main/java/.../SrsService.java
vi card/src/main/java/.../CardController.java

# 한 커밋으로 묶기 (논리적 단위)
git add ai/ srs/ card/
git commit -m "feat(srs): use AI quality score in initial interval calculation"
```

이게 **모노 구조의 핵심 이점**입니다 — Java와 Python의 계약 변경이 한 커밋, 한 PR로 atomic하게 처리됩니다.

**Step 2. CI 동작 이해**



<figure class="mermaid-svg">
<svg preserveAspectRatio="xMidYMin meet" id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="flowchart" style="max-width: 1145.97px; background-color: transparent;" viewBox="0 0 1145.96875 278" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#my-svg{font-family:Plus Jakarta Sans,Helvetica,Arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:#552222;}#my-svg .error-text{fill:#552222;stroke:#552222;}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#333333;stroke:#333333;}#my-svg .marker.cross{stroke:#333333;}#my-svg svg{font-family:Plus Jakarta Sans,Helvetica,Arial,sans-serif;font-size:16px;}#my-svg p{margin:0;}#my-svg .label{font-family:Plus Jakarta Sans,Helvetica,Arial,sans-serif;color:#333;}#my-svg .cluster-label text{fill:#333;}#my-svg .cluster-label span{color:#333;}#my-svg .cluster-label span p{background-color:transparent;}#my-svg .label text,#my-svg span{fill:#333;color:#333;}#my-svg .node rect,#my-svg .node circle,#my-svg .node ellipse,#my-svg .node polygon,#my-svg .node path{fill:#ECECFF;stroke:#9370DB;stroke-width:1px;}#my-svg .rough-node .label text,#my-svg .node .label text,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-anchor:middle;}#my-svg .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#my-svg .rough-node .label,#my-svg .node .label,#my-svg .image-shape .label,#my-svg .icon-shape .label{text-align:center;}#my-svg .node.clickable{cursor:pointer;}#my-svg .root .anchor path{fill:#333333!important;stroke-width:0;stroke:#333333;}#my-svg .arrowheadPath{fill:#333333;}#my-svg .edgePath .path{stroke:#333333;stroke-width:1px;}#my-svg .flowchart-link{stroke:#333333;fill:none;}#my-svg .edgeLabel{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .edgeLabel p{background-color:rgba(232,232,232, 0.8);}#my-svg .edgeLabel rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .labelBkg{background-color:rgba(232, 232, 232, 0.5);}#my-svg .cluster rect{fill:#ffffde;stroke:#aaaa33;stroke-width:1px;}#my-svg .cluster text{fill:#333;}#my-svg .cluster span{color:#333;}#my-svg div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:Plus Jakarta Sans,Helvetica,Arial,sans-serif;font-size:12px;background:hsl(80, 100%, 96.2745098039%);border:1px solid #aaaa33;border-radius:2px;pointer-events:none;z-index:100;}#my-svg .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#333;}#my-svg rect.text{fill:none;stroke-width:0;}#my-svg .icon-shape,#my-svg .image-shape{background-color:rgba(232,232,232, 0.8);text-align:center;}#my-svg .icon-shape p,#my-svg .image-shape p{background-color:rgba(232,232,232, 0.8);padding:2px;}#my-svg .icon-shape .label rect,#my-svg .image-shape .label rect{opacity:0.5;background-color:rgba(232,232,232, 0.8);fill:rgba(232,232,232, 0.8);}#my-svg .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#my-svg .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#my-svg .node .neo-node{stroke:#9370DB;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#my-svg [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="my-svg_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"/></marker><marker id="my-svg_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"/></marker><marker id="my-svg_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"/></marker><g class="root"><g class="clusters"/><g class="edgePaths"><path d="M118.672,139L122.839,139C127.005,139,135.339,139,143.005,139C150.672,139,157.672,139,161.172,139L164.672,139" id="my-svg-L_PR_Filter_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_PR_Filter_0" data-points="W3sieCI6MTE4LjY3MTg3NSwieSI6MTM5fSx7IngiOjE0My42NzE4NzUsInkiOjEzOX0seyJ4IjoxNjguNjcxODc1LCJ5IjoxMzl9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M269.128,110.753L285.265,98.127C301.403,85.502,333.678,60.251,362.136,47.625C390.594,35,415.234,35,427.555,35L439.875,35" id="my-svg-L_Filter_BuildJava_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Filter_BuildJava_0" data-points="W3sieCI6MjY5LjEyNzk1OTQwOTEwNzQsInkiOjExMC43NTI5NTk0MDkxMDczOX0seyJ4IjozNjUuOTUzMTI1LCJ5IjozNX0seyJ4Ijo0NDMuODc1LCJ5IjozNX1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M297.375,139L308.805,139C320.234,139,343.094,139,365.286,139C387.479,139,409.005,139,419.768,139L430.531,139" id="my-svg-L_Filter_BuildPython_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Filter_BuildPython_0" data-points="W3sieCI6Mjk3LjM3NSwieSI6MTM5fSx7IngiOjM2NS45NTMxMjUsInkiOjEzOX0seyJ4Ijo0MzQuNTMxMjUsInkiOjEzOX1d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M269.128,167.247L285.265,179.873C301.403,192.498,333.678,217.749,363.102,230.375C392.526,243,419.099,243,432.385,243L445.672,243" id="my-svg-L_Filter_Both_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Filter_Both_0" data-points="W3sieCI6MjY5LjEyNzk1OTQwOTEwNzQsInkiOjE2Ny4yNDcwNDA1OTA4OTI2fSx7IngiOjM2NS45NTMxMjUsInkiOjI0M30seyJ4Ijo0NDkuNjcxODc1LCJ5IjoyNDN9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M572.359,35L578.083,35C583.807,35,595.255,35,604.479,35C613.703,35,620.703,35,624.203,35L627.703,35" id="my-svg-L_BuildJava_Image1_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_BuildJava_Image1_0" data-points="W3sieCI6NTcyLjM1OTM3NSwieSI6MzV9LHsieCI6NjA2LjcwMzEyNSwieSI6MzV9LHsieCI6NjMxLjcwMzEyNSwieSI6MzV9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M581.703,139L585.87,139C590.036,139,598.37,139,609.814,139C621.258,139,635.813,139,643.09,139L650.367,139" id="my-svg-L_BuildPython_Image2_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_BuildPython_Image2_0" data-points="W3sieCI6NTgxLjcwMzEyNSwieSI6MTM5fSx7IngiOjYwNi43MDMxMjUsInkiOjEzOX0seyJ4Ijo2NTQuMzY3MTg3NSwieSI6MTM5fV0=" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M809.063,35L813.229,35C817.396,35,825.729,35,836.313,38.825C846.896,42.651,859.729,50.301,866.146,54.126L872.563,57.952" id="my-svg-L_Image1_IntegTest_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Image1_IntegTest_0" data-points="W3sieCI6ODA5LjA2MjUsInkiOjM1fSx7IngiOjgzNC4wNjI1LCJ5IjozNX0seyJ4Ijo4NzUuOTk4MzQ3MzU1NzY5MywieSI6NjB9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M786.398,139L794.342,139C802.286,139,818.174,139,832.535,135.175C846.896,131.349,859.729,123.699,866.146,119.874L872.563,116.048" id="my-svg-L_Image2_IntegTest_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_Image2_IntegTest_0" data-points="W3sieCI6Nzg2LjM5ODQzNzUsInkiOjEzOX0seyJ4Ijo4MzQuMDYyNSwieSI6MTM5fSx7IngiOjg3NS45OTgzNDczNTU3NjkzLCJ5IjoxMTR9XQ==" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/><path d="M983.516,87L987.682,87C991.849,87,1000.182,87,1007.849,87C1015.516,87,1022.516,87,1026.016,87L1029.516,87" id="my-svg-L_IntegTest_Done_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_IntegTest_Done_0" data-points="W3sieCI6OTgzLjUxNTYyNSwieSI6ODd9LHsieCI6MTAwOC41MTU2MjUsInkiOjg3fSx7IngiOjEwMzMuNTE1NjI1LCJ5Ijo4N31d" data-look="classic" marker-end="url(#my-svg_flowchart-v2-pointEnd)"/></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_PR_Filter_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(365.953125, 35)"><g class="label" data-id="L_Filter_BuildJava_0" transform="translate(-34.234375, -12)"><foreignObject width="68.46875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>java/* 변경</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(365.953125, 139)"><g class="label" data-id="L_Filter_BuildPython_0" transform="translate(-43.578125, -12)"><foreignObject width="87.15625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>python/* 변경</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(365.953125, 243)"><g class="label" data-id="L_Filter_Both_0" transform="translate(-26.2265625, -12)"><foreignObject width="52.453125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>양쪽 변경</p></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_BuildJava_Image1_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_BuildPython_Image2_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_Image1_IntegTest_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_Image2_IntegTest_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_IntegTest_Done_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="my-svg-flowchart-PR-0" data-look="classic" transform="translate(63.3359375, 139)"><rect class="basic label-container" style="" x="-55.3359375" y="-27" width="110.671875" height="54"/><g class="label" style="" transform="translate(-25.3359375, -12)"><rect/><foreignObject width="50.671875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>PR 생성</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-Filter-1" data-look="classic" transform="translate(233.0234375, 139)"><polygon points="64.3515625,0 128.703125,-64.3515625 64.3515625,-128.703125 0,-64.3515625" class="label-container" transform="translate(-63.8515625, 64.3515625)"/><g class="label" style="" transform="translate(-37.3515625, -12)"><rect/><foreignObject width="74.703125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>paths-filter</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-BuildJava-3" data-look="classic" transform="translate(508.1171875, 35)"><rect class="basic label-container" style="" x="-64.2421875" y="-27" width="128.484375" height="54"/><g class="label" style="" transform="translate(-34.2421875, -12)"><rect/><foreignObject width="68.484375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>build-java</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-BuildPython-5" data-look="classic" transform="translate(508.1171875, 139)"><rect class="basic label-container" style="" x="-73.5859375" y="-27" width="147.171875" height="54"/><g class="label" style="" transform="translate(-43.5859375, -12)"><rect/><foreignObject width="87.171875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>build-python</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-Both-7" data-look="classic" transform="translate(508.1171875, 243)"><rect class="basic label-container" style="" x="-58.4453125" y="-27" width="116.890625" height="54"/><g class="label" style="" transform="translate(-28.4453125, -12)"><rect/><foreignObject width="56.890625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>둘 다 실행</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-Image1-9" data-look="classic" transform="translate(720.3828125, 35)"><rect class="basic label-container" style="" x="-88.6796875" y="-27" width="177.359375" height="54"/><g class="label" style="" transform="translate(-58.6796875, -12)"><rect/><foreignObject width="117.359375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Docker: card-srs</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-Image2-11" data-look="classic" transform="translate(720.3828125, 139)"><rect class="basic label-container" style="" x="-66.015625" y="-27" width="132.03125" height="54"/><g class="label" style="" transform="translate(-36.015625, -12)"><rect/><foreignObject width="72.03125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Docker: ai</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-IntegTest-13" data-look="classic" transform="translate(921.2890625, 87)"><rect class="basic label-container" style="" x="-62.2265625" y="-27" width="124.453125" height="54"/><g class="label" style="" transform="translate(-32.2265625, -12)"><rect/><foreignObject width="64.453125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>통합 테스트</p></span></div></foreignObject></g></g><g class="node default" id="my-svg-flowchart-Done-17" data-look="classic" transform="translate(1085.7421875, 87)"><rect class="basic label-container" style="" x="-52.2265625" y="-27" width="104.453125" height="54"/><g class="label" style="" transform="translate(-22.2265625, -12)"><rect/><foreignObject width="44.453125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>CI 완료</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="my-svg-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs><defs><filter id="my-svg-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"/></filter></defs></svg>
</figure>


```yaml
# .github/workflows/ci.yml (learning-svc)
jobs:
  detect-changes:
    outputs:
      java: ${{ steps.filter.outputs.java }}
      python: ${{ steps.filter.outputs.python }}
    steps:
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            java:
              - 'card/**'
              - 'srs/**'
              - 'shared-java/**'
            python:
              - 'ai/**'
              - 'shared-python/**'

  build-java:
    needs: detect-changes
    if: needs.detect-changes.outputs.java == 'true'
    # ./gradlew :card:build :srs:build

  build-python:
    needs: detect-changes
    if: needs.detect-changes.outputs.python == 'true'
    # poetry install && pytest

  integration-test:
    needs: [build-java, build-python]
    if: always() && !failure()
    # docker-compose로 두 이미지 띄워서 e2e
```

**Step 3. Docker 이미지 태깅**

learning-svc는 한 레포에서 **두 개의 컨테이너 이미지**를 빌드합니다.

| 이미지 | 빌드 트리거 | 태그 정책 |
|-------|------------|----------|
| `learning-card-srs:1.2.3` | Java 코드 변경 | learning-svc 레포 SemVer |
| `learning-ai:1.2.3` | Python 코드 변경 | learning-svc 레포 SemVer |

> **⚠️ 주의**: 두 이미지는 **동일한 SemVer**를 공유합니다. ADR-002에서 결정된 사항입니다. 이유: 같은 레포 = 같은 변경 단위 = 같은 버전.

**Step 4. PR과 머지**

- PR 본문 체크리스트:
  - [ ] Java 변경이 있다면 Java CI 통과
  - [ ] Python 변경이 있다면 Python CI 통과
  - [ ] 양쪽 변경이 있다면 통합 테스트 통과
  - [ ] Docker 이미지 빌드 성공
- Squash and Merge

#### 함정

| ❌ 잘못 | ✅ 올바름 |
|--------|---------|
| Java만 수정했는데 "Python CI 왜 돌지?" 의심 | paths-filter가 알아서 스킵함. 로그 확인 |
| Java/Python을 별도 PR로 쪼개려 함 | atomic 변경이므로 한 PR이 정답 |
| Python 변경 후 Java 이미지 태그도 올림 | 변경된 쪽만 새 태그 |

---

### 3.5 시나리오 E: hotfix 긴급 배포

#### 상황

운영 환경에서 RLS(Row-Level Security) 우회 취약점 발견. 즉시 패치 필요.

#### 작업 흐름

**Step 1. hotfix 브랜치 생성**

```bash
cd synapse-platform-svc
git checkout main && git pull
git checkout -b hotfix/PLAT-SEC-001-rls-bypass
```

**Step 2. 최소 범위 수정**

hotfix는 **수정 범위를 절대 넓히지 않습니다.** 리팩토링 금지, 관련 없는 청소 금지.

```bash
# 보안 패치만 정확히
vi src/main/java/.../NoteRepository.java

git commit -m "fix(auth)!: enforce RLS on all note queries

BREAKING CHANGE: 이전에 우회 가능했던 노트 조회 경로 차단.
영향: 직접 SQL을 호출하던 일부 admin 도구 영향 가능.

Fixes #SEC-001"
```

**Step 3. PR과 빠른 리뷰**

```bash
git push origin hotfix/PLAT-SEC-001-rls-bypass
gh pr create --label "priority/critical" --label "hotfix"
```

- 슬랙 `#incident` 채널에 PR 링크 공유
- 리뷰어 2명 이상 즉시 핑
- CI 통과 즉시 머지

**Step 4. 머지 방식: Merge Commit**

09번 § 3.3에 명시:
> 머지 방식: Squash and Merge (feature), **Merge Commit (hotfix)**

이유: hotfix는 시간 추적을 위해 모든 커밋이 main 히스토리에 남아야 합니다.

**Step 5. 즉시 패치 릴리즈**

```bash
# 머지 후 main에서
git checkout main && git pull
git tag -a v1.2.4 -m "Hotfix: RLS bypass patch"
git push origin v1.2.4
```

→ GitHub Actions가 Docker 이미지 빌드 → ArgoCD가 자동 배포 (또는 수동 sync)

**Step 6. gitops에 통합 태그 (필요 시)**

```bash
cd ../synapse-gitops
git checkout -b hotfix/INFRA-SEC-001-deploy-platform-1.2.4

# overlays/prod/platform-svc/kustomization.yaml에서 이미지 태그 변경
yq -i '.images[0].newTag = "1.2.4"' overlays/prod/platform-svc/kustomization.yaml

git commit -m "chore(infra): bump platform-svc to 1.2.4 (hotfix RLS)"
git push
gh pr create --label "priority/critical"
```

→ 머지 즉시 ArgoCD sync.

**Step 7. 사후 처리**

- `#incident` 채널에 배포 완료 보고
- Postmortem 문서 작성 (RCA, 재발 방지)
- ADR 업데이트 (보안 정책 변경 시)

#### 함정

| ❌ 잘못 | ✅ 올바름 |
|--------|---------|
| hotfix에 리팩토링 묶기 | 보안 패치만. 정리는 다음 PR |
| Squash merge로 커밋 합치기 | hotfix는 Merge Commit (히스토리 보존) |
| 메인 릴리즈 사이클 기다리기 | 즉시 패치 태그 + ArgoCD sync |
| 슬랙 보고 누락 | `#incident`에 시작/완료 모두 보고 |

---

### 3.6 시나리오 F: 통합 릴리즈 (gitops 태깅)

#### 상황

각 주차 종료 직전(주차별 데모 D-1). 한 주 동안 4개 백엔드 + 프론트가 각자 배포한 새 버전을 검증해서 **주차별 통합 릴리즈 태그**를 찍습니다. 5주 프로젝트 기준 총 5회의 통합 릴리즈 + 발표일 hotfix 1회(필요 시)가 발생합니다.

| 주차 | 통합 릴리즈 태그 | 데모 범위 |
|:----:|:--------------:|---------|
| 1주차 말 | `v0.1.0` (alpha) | platform 인증 + 기본 frontend |
| 2주차 말 | `v0.2.0` (alpha) | + knowledge (노트/그래프) |
| 3주차 말 | `v0.3.0` (beta) | + engagement (gamification 발행) + producer 토픽 |
| 4주차 말 | `v0.4.0` (rc) | + learning (카드/SRS/AI) + 이벤트 소비자 (notification/audit/admin) |
| 5주차 말 | `v1.0.0-rc` (release candidate) | + E2E + Staging 배포 + 발표 자료 |
| 6/15 발표 | `v1.0.0` (release) | 최종 발표·시연·제출 (코드 동결) |

#### 작업 흐름 (DevOps 또는 Release Manager)

**Step 1. 각 서비스 최신 stable 버전 확인**

```bash
cd synapse-gitops/scripts
./list-current-versions.sh
# platform-svc:    1.2.3 (deployed dev/staging)
# engagement-svc:  0.8.4 (deployed dev/staging)
# knowledge-svc:   0.9.1 (deployed dev/staging)
# learning-svc:    0.5.7 (deployed dev/staging, card-srs + ai)
# frontend:        2.1.0 (deployed dev/staging)
# shared:          1.5.0 (latest)
```

**Step 2. e2e 테스트 (gitops 레포에서)**

```bash
cd synapse-gitops
git checkout -b release/INFRA-202615-week-19

# 통합 e2e 실행 (staging 환경 대상)
./scripts/run-e2e.sh --env=staging
```

모든 e2e 통과 시 다음 단계.

**Step 3. compatibility.yaml 업데이트**

```yaml
# synapse-gitops/compatibility-matrix.yaml
releases:
  - version: v2.3.0
    date: 2026-05-15
    services:
      platform-svc: 1.2.3
      engagement-svc: 0.8.4
      knowledge-svc: 0.9.1
      learning-svc: 0.5.7
      frontend: 2.1.0
      shared: 1.5.0
    e2e_passed: true
    notes: "주간 정기 릴리즈"
```

**Step 4. PR과 태그**

```bash
git add compatibility-matrix.yaml
git commit -m "chore(infra): release v2.3.0 (week 19)"
git push
gh pr create --title "Release v2.3.0" --label "release"

# 머지 후
git checkout main && git pull
git tag -a v2.3.0 -m "Synapse v2.3.0 — Weekly release"
git push origin v2.3.0
```

**Step 5. ArgoCD prod sync**

태그 푸시 → ArgoCD가 prod 오버레이를 새 매니페스트로 sync → Blue-Green 배포 진행.

**Step 6. 릴리즈 노트 발행**

GitHub Release 페이지에 변경 내역 자동 생성 (각 서비스의 CHANGELOG.md 모음).

#### 통합 태그 vs 개별 태그 구분

| 태그 위치 | 의미 | 예시 |
|----------|------|------|
| 각 서비스 레포 | 개별 서비스 버전 | `synapse-platform-svc:v1.2.3` |
| `synapse-gitops` | **통합 배포 버전** | `synapse-gitops:v2.3.0` |

> 사용자/외부 커뮤니케이션은 항상 **gitops의 통합 태그**를 기준으로 합니다.
> "Synapse v2.3.0 출시" → 내부적으로는 platform 1.2.3 + engagement 0.8.4 + ...

---

## 4. 결정 트리: 어디서부터 시작하지?

길을 잃었을 때 따라가는 흐름도입니다.

```text
당신의 작업은 무엇을 건드리나?
│
├─ 📱 UI만 바꾼다
│   └→ synapse-frontend (FE/)
│      → 시나리오 A 참조
│
├─ 🔐 인증/결제/사용자 관련
│   └→ synapse-platform-svc (PLAT/)
│      → 시나리오 A 참조
│
├─ 💬 커뮤니티/알림/게이미피케이션
│   └→ synapse-engagement-svc (ENG/)
│      → 시나리오 A 참조
│
├─ 📝 노트/그래프/검색
│   └→ synapse-knowledge-svc (KNOW/)
│      → 시나리오 A 참조
│
├─ 🎴 카드/SRS만 (Java)
│   └→ synapse-learning-svc/card/ 또는 /srs/ (LEARN-CARD/)
│      → 시나리오 A 참조
│
├─ 🤖 AI 카드 생성만 (Python)
│   └→ synapse-learning-svc/ai/ (LEARN-AI/)
│      → 시나리오 A 참조
│
├─ 🎴+🤖 카드/SRS와 AI 모두
│   └→ synapse-learning-svc (LEARN-CARD/ 또는 LEARN-AI/)
│      → 시나리오 D 참조 (한 PR로 atomic)
│
├─ 📱+🔧 UI와 백엔드 동시
│   └→ 두 PR (백엔드 먼저)
│      → 시나리오 B 참조
│
├─ 📦 공통 DTO/util/proto
│   └→ synapse-shared (SHARED/)
│      ⚠️ 4개 서비스 영향 확인 필수
│      → 시나리오 C 참조
│
├─ ☸️ K8s 매니페스트/배포
│   └→ synapse-gitops (INFRA/)
│      → 시나리오 F 참조
│
├─ 🚨 운영 장애 / 긴급 보안 패치
│   └→ #incident 채널 먼저 알림
│      → 시나리오 E 참조 (hotfix)
│
└─ ❓ 모르겠다
    └→ #synapse-dev 채널에 질문
       → 부끄러운 일이 아닙니다. 잘못된 레포에서 시작하는 것보다 낫습니다.
```

---

## 5. 자주 하는 실수 & FAQ

### 자주 하는 실수

#### ❌ "프론트랑 백엔드 같이 PR 하면 편하잖아요"

폴리레포에서는 **물리적으로 불가능**합니다. 두 PR을 동시에 올리되, PR 본문에 서로 링크하고 Epic 이슈로 묶으세요. 머지 순서는 항상 백엔드 → 프론트.

→ 시나리오 B 참조.

#### ❌ "shared 작은 변경인데 그냥 PATCH로 올릴게요"

필드 **추가**도 MINOR입니다. PATCH는 외부 동작이 동일한 버그 수정 한정.

→ 시나리오 C의 SemVer 표 참조.

#### ❌ "learning-svc에서 Java만 수정했는데 Python CI가 왜 돌지?"

`paths-filter`가 자동으로 스킵합니다. 트리거는 발생하지만 실제 빌드는 1초 안에 종료됩니다. 로그를 확인해보세요. 의심되면 #devops에 문의.

#### ❌ "mirror 레포에 직접 push하고 싶어요"

mirror는 **read-only**입니다. 모든 변경은 원본 Tier 1 레포에 PR로 진행하세요. mirror는 자동 동기화됩니다.

#### ❌ "여러 도메인을 한 모듈에서 import해도 되죠?"

Spring Modulith가 빌드 시간에 막습니다. CI가 깨질 거예요. 도메인 간 통신은 **이벤트 publish/subscribe**로.

#### ❌ "release 태그를 각 서비스 레포에서 v2.3.0으로 찍을게요"

각 서비스는 자체 SemVer를 따릅니다. v2.3.0은 **gitops 통합 릴리즈**의 태그입니다. 혼동하지 마세요.

#### ❌ "hotfix인데 김에 함께 리팩토링도 할게요"

절대 금지. hotfix는 최소 변경. 리팩토링은 별도 PR.

#### ❌ "Renovate PR은 다음에 처리할게요"

24시간 룰을 지키세요. 미루면 4개 서비스가 다른 shared 버전을 쓰는 hell이 발생합니다.

---

### FAQ

**Q1. 모노레포가 더 좋아 보이는데요?**

→ § 1.1 참조. 도메인 경계, 독립 배포, 팀 분화 대비 3가지가 폴리레포 선택의 핵심 이유입니다. 단점은 도구로 보완합니다.

**Q2. learning-svc만 왜 모노 구조인가요?**

→ ADR-002 참조. card/srs(Java)와 ai(Python)는 데이터 흐름 결합도가 매우 높아서, 분리 시 항상 짝 PR이 필요해집니다. 운영 비용이 분리 이득보다 큽니다.

**Q3. 미러 레포는 어떻게 검색하나요?**

→ 로컬 클론 후 `ripgrep` 사용:
```bash
cd synapse-mirror
rg "UserDto" --type java
```
또는 GitHub 웹 검색 UI를 사용해도 됩니다.

**Q4. 한 기능이 4개 서비스를 동시에 건드려야 하면?**

→ 그건 도메인 분리가 잘못됐다는 신호입니다. 코드 작성 전에 #architecture 채널에서 토론하세요. 정말 필요한 경우는 4개 PR + Epic 이슈로 진행합니다.

**Q5. shared의 메이저 버전을 올려야 할 때 절차는?**

→ 3단계:
1. shared에서 기존 API에 `@Deprecated` 추가 → MINOR 릴리즈
2. 4개 서비스에서 deprecated API 사용 제거 (각 서비스 PR)
3. shared에서 실제 제거 → MAJOR 릴리즈

→ 시나리오 C "함정 3" 참조.

**Q6. 로컬에서 8개 서비스를 모두 띄우려면 메모리가 부족합니다.**

→ 본인 담당 서비스만 직접 실행하고, 나머지는 docker-compose의 prebuilt 이미지를 사용하세요. 프론트 개발자도 백엔드 4개를 다 띄울 필요 없이 mock 또는 dev 환경 API를 사용하면 됩니다.

**Q7. 통합 e2e가 깨지면 누가 책임지나요?**

→ 깨진 변경의 **원인 서비스 담당자**가 1차 책임. 단, gitops의 release manager가 통합 검증 책임을 가집니다. 회피보다는 빠르게 #incident에 공유.

**Q8. CODEOWNERS가 자동으로 reviewer를 지정해주나요?**

→ Yes. PR을 올리면 변경된 경로에 매칭되는 팀이 자동으로 reviewer로 지정됩니다. 다른 팀의 리뷰가 추가로 필요하면 수동으로 추가 지정.

**Q9. 외부 라이브러리 추가는 어떻게 하나요?**

→ 각 레포의 빌드 파일에서 추가 후 PR. 보안 스캔(Snyk)이 CI에서 돌고, 라이선스 호환성도 자동 체크됩니다. GPL 등 카피레프트 라이선스는 별도 승인 필요.

**Q10. 이 문서가 헷갈립니다. 어떻게 개선을 제안하나요?**

→ `synapse-documents` 레포에 PR을 올리거나, #docs 채널에 의견을 주세요. 신규 합류자의 피드백이 가장 가치 있는 개선 신호입니다.

---

## 6. 상세 규칙 레퍼런스

이 문서는 **워크플로우 가이드**이고, 정확한 규칙은 다음 문서를 참조하세요.

| 문서 | 내용 |
|------|------|
| [09. Git 규칙 정의서](09_Git_규칙_정의서) | 브랜치 명명, 커밋 형식, PR 규칙, SemVer 등 정확한 규칙 |
| [10. 환경 설정 템플릿](10_환경_설정_템플릿) | `.gitignore`, `.editorconfig`, IDE 설정 |
| [11. 테스트 전략서](11_테스트_전략서) | 단위/통합/e2e 테스트 정책 |
| [12. 코드 리뷰 규칙](12_코드_리뷰_규칙) | 리뷰어 가이드, 승인 기준 |
| [14. 배포 가이드](14_배포_가이드) | ArgoCD 운영, 롤백 절차 |

---

## 7. 결정 배경 (ADR)

폴리레포 + 부분 모노 구조는 다음 ADR(Architecture Decision Records)에 근거합니다.

| ADR | 제목 | 핵심 결정 |
|-----|------|----------|
| **ADR-001** | 서비스 분리 기준 | 4개 백엔드 서비스로 분리, Spring Modulith로 내부 모듈 분리 |
| **ADR-002** | learning-svc 내부 모노 예외 | card/srs(Java)와 ai(Python)는 결합도가 높아 한 레포 |
| **ADR-003** | shared 라이브러리 버전 정책 | SemVer 엄격 적용, deprecation 2 MINOR 유지 |
| **ADR-004** | GitOps 도입 | Argo CD + 별도 gitops 레포로 배포 분리 |
| **ADR-005** | mirror 레포 도입 | 폴리레포 검색 한계 보완 |

> ADR은 `synapse-documents` 레포의 `Appendix B` 또는 `/adr/` 디렉토리에 있습니다.

---

## 8. 도움 받기

### 슬랙 채널 가이드

| 상황 | 채널 | 응답 시간 |
|------|------|----------|
| 일반 개발 질문 | `#synapse-dev` | 영업시간 내 ~2시간 |
| 아키텍처 결정 필요 | `#architecture` | 1~3일 (ADR 토론) |
| 빌드/배포 문제 | `#devops` (담당자 멘션) | 영업시간 내 ~1시간 |
| 보안 관련 | `#security` (DM 권장) | 영업시간 내 ~30분 |
| 🚨 긴급 (운영 장애) | `#incident` + on-call 호출 | 즉시 |
| 이 문서가 헷갈림 | `@maintainers` 멘션 | 1일 내 |

### 멘토 / 온보딩 버디

신규 합류 첫 2주 동안은 같은 도메인의 시니어 1명이 멘토로 지정됩니다. 사소한 질문도 부담 없이.

### 외부 리소스

- [Conventional Commits](https://www.conventionalcommits.org/ko/v1.0.0/)
- [Semantic Versioning](https://semver.org/lang/ko/)
- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Spring Modulith 공식 문서](https://docs.spring.io/spring-modulith/reference/)
- [Argo CD 공식 문서](https://argo-cd.readthedocs.io/)

---

## 9. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| v1.0 | 2026-05-10 | Synapse Team | 초안 작성. 09번 정의서를 보완하는 워크플로우 가이드. |
| v1.1 | 2026-05-10 | Synapse Team | 4주 프로젝트 맥락 반영 (§1.1 폴리레포 이유 #2/#3 재구성, §3.6 주차별 통합 릴리즈로 수정), §1.2 Mermaid 다이어그램 색상 가독성 개선 (라이트/다크 모드 양쪽 호환). |
| v1.2 | 2026-05-11 | Synapse Team | 4주 → 5주 일정 개편 반영. 헤더 "프로젝트 기간" 5주로 갱신, §1.1 본문 "4주" 표현 3곳 보정, §3.6 주차별 통합 릴리즈 4회 → 5회 + 발표 행 추가. 설계 근거: `syn/docs/superpowers/specs/2026-05-11-schedule-5week-revamp-design.md` |

---

> 📘 **이 문서는 살아있는 문서입니다.**
> 신규 합류자가 헷갈렸던 부분, 시나리오에 빠진 케이스, 새로운 함정을 발견하면 PR로 기여해주세요.
> 가장 좋은 개선은 **"내가 처음 합류했을 때 이게 있었으면 좋았겠다"** 싶은 내용을 추가하는 것입니다.
