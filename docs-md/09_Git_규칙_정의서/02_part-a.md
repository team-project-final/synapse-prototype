# Part A — 한 레포 안의 규칙

### A1. 브랜치 전략

각 Tier 1 레포는 독립적으로 GitHub Flow를 따른다. 모든 작업은 그 레포의 `main`에서 분기하여 PR로 병합한다.

#### 서비스별 main 도식

```
synapse-platform-svc:
  main
  ├── feature/PLAT-001-oauth-google
  ├── feature/PLAT-002-stripe-webhook
  └── fix/PLAT-003-jwt-expiry

synapse-knowledge-svc:
  main
  ├── feature/KNOW-001-wikilink-parser
  ├── feature/KNOW-002-pagerank
  └── ...

synapse-learning-svc:
  main
  ├── feature/LEARN-CARD-001-srs           (Java)
  ├── feature/LEARN-AI-001-rag             (Python)
  └── ...
```

#### 브랜치 명명 (8종 prefix)

| 접두사 | 용도 | 예시 |
|--------|------|------|
| `feature/PLAT-NNN-` | Platform 서비스 | `feature/PLAT-001-oauth-google` |
| `feature/ENG-NNN-` | Engagement 서비스 | `feature/ENG-001-xp-system` |
| `feature/KNOW-NNN-` | Knowledge 서비스 | `feature/KNOW-001-wikilink` |
| `feature/LEARN-CARD-NNN-` | Learning Card (Java) | `feature/LEARN-CARD-001-srs` |
| `feature/LEARN-AI-NNN-` | Learning AI (Python) | `feature/LEARN-AI-001-rag` |
| `feature/SHARED-NNN-` | Shared 라이브러리 | `feature/SHARED-001-avro-schema` |
| `feature/FE-NNN-` | Frontend (Flutter) | `feature/FE-001-note-editor` |
| `feature/INFRA-NNN-` | GitOps/인프라 | `feature/INFRA-001-argocd-app` |

`fix/`, `hotfix/`, `docs/`, `chore/`, `refactor/`, `test/` 도 동일한 prefix(PLAT/ENG/KNOW/...) 규칙을 따른다 — 예: `fix/KNOW-007-pagerank-overflow`, `hotfix/PLAT-012-jwt-leak`.

#### 브랜치 규칙 (각 레포 공통)

- `main`은 항상 배포 가능한 상태 유지
- 모든 작업은 `main`에서 분기 → PR로 병합
- 브랜치 수명: 최대 5일 (초과 시 분할 권장)
- 머지 후 원격 브랜치 자동 삭제
- Force push 금지 (main 브랜치 보호 규칙 적용)

#### Mermaid Git Graph (단일 서비스 예시 — synapse-knowledge-svc)

<figure class="mermaid-svg">
<svg preserveAspectRatio="xMidYMin meet" id="my-svg" width="100%" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="max-width: 827.812px; background-color: transparent;" viewBox="-269.8125 -36.70000076293945 827.8125 454.3953857421875" role="graphics-document document" aria-roledescription="gitGraph"><style>#my-svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#my-svg .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#my-svg .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#my-svg .error-icon{fill:#552222;}#my-svg .error-text{fill:#552222;stroke:#552222;}#my-svg .edge-thickness-normal{stroke-width:1px;}#my-svg .edge-thickness-thick{stroke-width:3.5px;}#my-svg .edge-pattern-solid{stroke-dasharray:0;}#my-svg .edge-thickness-invisible{stroke-width:0;fill:none;}#my-svg .edge-pattern-dashed{stroke-dasharray:3;}#my-svg .edge-pattern-dotted{stroke-dasharray:2;}#my-svg .marker{fill:#333333;stroke:#333333;}#my-svg .marker.cross{stroke:#333333;}#my-svg svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#my-svg p{margin:0;}#my-svg .commit-id,#my-svg .commit-msg,#my-svg .branch-label{fill:lightgrey;color:lightgrey;font-family:'trebuchet ms',verdana,arial,sans-serif;font-family:var(--mermaid-font-family);}#my-svg .branch-label0{fill:#ffffff;}#my-svg .commit0{stroke:hsl(240, 100%, 46.2745098039%);fill:hsl(240, 100%, 46.2745098039%);}#my-svg .commit-highlight0{stroke:hsl(60, 100%, 3.7254901961%);fill:hsl(60, 100%, 3.7254901961%);}#my-svg .label0{fill:hsl(240, 100%, 46.2745098039%);}#my-svg .arrow0{stroke:hsl(240, 100%, 46.2745098039%);}#my-svg .branch-label1{fill:black;}#my-svg .commit1{stroke:hsl(60, 100%, 43.5294117647%);fill:hsl(60, 100%, 43.5294117647%);}#my-svg .commit-highlight1{stroke:rgb(0, 0, 160.5);fill:rgb(0, 0, 160.5);}#my-svg .label1{fill:hsl(60, 100%, 43.5294117647%);}#my-svg .arrow1{stroke:hsl(60, 100%, 43.5294117647%);}#my-svg .branch-label2{fill:black;}#my-svg .commit2{stroke:hsl(80, 100%, 46.2745098039%);fill:hsl(80, 100%, 46.2745098039%);}#my-svg .commit-highlight2{stroke:rgb(48.8333333334, 0, 146.5000000001);fill:rgb(48.8333333334, 0, 146.5000000001);}#my-svg .label2{fill:hsl(80, 100%, 46.2745098039%);}#my-svg .arrow2{stroke:hsl(80, 100%, 46.2745098039%);}#my-svg .branch-label3{fill:#ffffff;}#my-svg .commit3{stroke:hsl(210, 100%, 46.2745098039%);fill:hsl(210, 100%, 46.2745098039%);}#my-svg .commit-highlight3{stroke:rgb(146.5000000001, 73.2500000001, 0);fill:rgb(146.5000000001, 73.2500000001, 0);}#my-svg .label3{fill:hsl(210, 100%, 46.2745098039%);}#my-svg .arrow3{stroke:hsl(210, 100%, 46.2745098039%);}#my-svg .branch-label4{fill:black;}#my-svg .commit4{stroke:hsl(180, 100%, 46.2745098039%);fill:hsl(180, 100%, 46.2745098039%);}#my-svg .commit-highlight4{stroke:rgb(146.5000000001, 0, 0);fill:rgb(146.5000000001, 0, 0);}#my-svg .label4{fill:hsl(180, 100%, 46.2745098039%);}#my-svg .arrow4{stroke:hsl(180, 100%, 46.2745098039%);}#my-svg .branch-label5{fill:black;}#my-svg .commit5{stroke:hsl(150, 100%, 46.2745098039%);fill:hsl(150, 100%, 46.2745098039%);}#my-svg .commit-highlight5{stroke:rgb(146.5000000001, 0, 73.2500000001);fill:rgb(146.5000000001, 0, 73.2500000001);}#my-svg .label5{fill:hsl(150, 100%, 46.2745098039%);}#my-svg .arrow5{stroke:hsl(150, 100%, 46.2745098039%);}#my-svg .branch-label6{fill:black;}#my-svg .commit6{stroke:hsl(300, 100%, 46.2745098039%);fill:hsl(300, 100%, 46.2745098039%);}#my-svg .commit-highlight6{stroke:rgb(0, 146.5000000001, 0);fill:rgb(0, 146.5000000001, 0);}#my-svg .label6{fill:hsl(300, 100%, 46.2745098039%);}#my-svg .arrow6{stroke:hsl(300, 100%, 46.2745098039%);}#my-svg .branch-label7{fill:black;}#my-svg .commit7{stroke:hsl(0, 100%, 46.2745098039%);fill:hsl(0, 100%, 46.2745098039%);}#my-svg .commit-highlight7{stroke:rgb(0, 146.5000000001, 146.5000000001);fill:rgb(0, 146.5000000001, 146.5000000001);}#my-svg .label7{fill:hsl(0, 100%, 46.2745098039%);}#my-svg .arrow7{stroke:hsl(0, 100%, 46.2745098039%);}#my-svg .branch-label8{fill:#ffffff;}#my-svg .commit8{stroke:hsl(240, 100%, 46.2745098039%);fill:hsl(240, 100%, 46.2745098039%);}#my-svg .commit-highlight8{stroke:hsl(60, 100%, 3.7254901961%);fill:hsl(60, 100%, 3.7254901961%);}#my-svg .label8{fill:hsl(240, 100%, 46.2745098039%);}#my-svg .arrow8{stroke:hsl(240, 100%, 46.2745098039%);}#my-svg .branch-label9{fill:black;}#my-svg .commit9{stroke:hsl(60, 100%, 43.5294117647%);fill:hsl(60, 100%, 43.5294117647%);}#my-svg .commit-highlight9{stroke:rgb(0, 0, 160.5);fill:rgb(0, 0, 160.5);}#my-svg .label9{fill:hsl(60, 100%, 43.5294117647%);}#my-svg .arrow9{stroke:hsl(60, 100%, 43.5294117647%);}#my-svg .branch-label10{fill:black;}#my-svg .commit10{stroke:hsl(80, 100%, 46.2745098039%);fill:hsl(80, 100%, 46.2745098039%);}#my-svg .commit-highlight10{stroke:rgb(48.8333333334, 0, 146.5000000001);fill:rgb(48.8333333334, 0, 146.5000000001);}#my-svg .label10{fill:hsl(80, 100%, 46.2745098039%);}#my-svg .arrow10{stroke:hsl(80, 100%, 46.2745098039%);}#my-svg .branch-label11{fill:#ffffff;}#my-svg .commit11{stroke:hsl(210, 100%, 46.2745098039%);fill:hsl(210, 100%, 46.2745098039%);}#my-svg .commit-highlight11{stroke:rgb(146.5000000001, 73.2500000001, 0);fill:rgb(146.5000000001, 73.2500000001, 0);}#my-svg .label11{fill:hsl(210, 100%, 46.2745098039%);}#my-svg .arrow11{stroke:hsl(210, 100%, 46.2745098039%);}#my-svg .branch{stroke-width:1;stroke:#333333;stroke-dasharray:2;}#my-svg .commit-label{font-size:10px;fill:#000021;}#my-svg .commit-label-bkg{font-size:10px;fill:#ffffde;opacity:0.5;}#my-svg .tag-label{font-size:10px;fill:#131300;}#my-svg .tag-label-bkg{fill:#ECECFF;stroke:hsl(240, 60%, 86.2745098039%);}#my-svg .tag-hole{fill:#333;}#my-svg .commit-merge{stroke:#ECECFF;fill:#ECECFF;}#my-svg .commit-reverse{stroke:#ECECFF;fill:#ECECFF;stroke-width:3;}#my-svg .commit-highlight-inner{stroke:#ECECFF;fill:#ECECFF;}#my-svg .arrow{stroke-width:8;stroke-linecap:round;fill:none;}#my-svg .gitTitleText{text-anchor:middle;font-size:18px;fill:#333;}#my-svg .node .neo-node{stroke:#9370DB;}#my-svg [data-look="neo"].node rect,#my-svg [data-look="neo"].cluster rect,#my-svg [data-look="neo"].node polygon{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node path{stroke:#9370DB;stroke-width:1px;}#my-svg [data-look="neo"].node .outer-path{filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node .neo-line path{stroke:#9370DB;filter:none;}#my-svg [data-look="neo"].node circle{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].node circle .state-start{fill:#000000;}#my-svg [data-look="neo"].icon-shape .icon{fill:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg [data-look="neo"].icon-shape .icon-neo path{stroke:#9370DB;filter:drop-shadow(1px 2px 2px rgba(185, 185, 185, 1));}#my-svg :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g/><g class="commit-bullets"/><g class="commit-labels"/><g><line x1="0" y1="-2" x2="550" y2="-2" class="branch branch0"/><rect class="branchLabelBkg label0" style="" rx="4" ry="4" x="-68.6875" y="1.5" width="52.6875" height="21" transform="translate(-19, -14)"/><g class="branchLabel"><g class="label branch-label0" transform="translate(-78.6875, -12.5)"><text><tspan xml:space="preserve" dy="1em" x="0" class="row">main</tspan></text></g></g><line x1="0" y1="88" x2="550" y2="88" class="branch branch1"/><rect class="branchLabelBkg label1" style="" rx="4" ry="4" x="-226.765625" y="1.5" width="210.765625" height="21" transform="translate(-19, 76)"/><g class="branchLabel"><g class="label branch-label1" transform="translate(-236.765625, 77.5)"><text><tspan xml:space="preserve" dy="1em" x="0" class="row">feature/KNOW-001-wikilink</tspan></text></g></g><line x1="0" y1="178" x2="550" y2="178" class="branch branch2"/><rect class="branchLabelBkg label2" style="" rx="4" ry="4" x="-242.8125" y="1.5" width="226.8125" height="21" transform="translate(-19, 166)"/><g class="branchLabel"><g class="label branch-label2" transform="translate(-252.8125, 167.5)"><text><tspan xml:space="preserve" dy="1em" x="0" class="row">feature/KNOW-002-pagerank</tspan></text></g></g><line x1="0" y1="268" x2="550" y2="268" class="branch branch3"/><rect class="branchLabelBkg label3" style="" rx="4" ry="4" x="-180.40625" y="1.5" width="164.40625" height="21" transform="translate(-19, 256)"/><g class="branchLabel"><g class="label branch-label3" transform="translate(-190.40625, 257.5)"><text><tspan xml:space="preserve" dy="1em" x="0" class="row">hotfix/KNOW-003-rls</tspan></text></g></g></g><g class="commit-arrows"><path d="M 10 -2 L 10 68 A 20 20, 0, 0, 0, 30 88 L 60 88" class="arrow arrow1"/><path d="M 60 88 L 110 88" class="arrow arrow1"/><path d="M 110 88 L 160 88" class="arrow arrow1"/><path d="M 10 -2 L 210 -2" class="arrow arrow0"/><path d="M 160 88 L 190 88 A 20 20, 0, 0, 0, 210 68 L 210 -2" class="arrow arrow1"/><path d="M 210 -2 L 210 158 A 20 20, 0, 0, 0, 230 178 L 260 178" class="arrow arrow2"/><path d="M 210 -2 L 210 248 A 20 20, 0, 0, 0, 230 268 L 310 268" class="arrow arrow3"/><path d="M 210 -2 L 360 -2" class="arrow arrow0"/><path d="M 310 268 L 340 268 A 20 20, 0, 0, 0, 360 248 L 360 -2" class="arrow arrow3"/><path d="M 260 178 L 410 178" class="arrow arrow2"/><path d="M 360 -2 L 460 -2" class="arrow arrow0"/><path d="M 410 178 L 440 178 A 20 20, 0, 0, 0, 460 158 L 460 -2" class="arrow arrow2"/><path d="M 460 -2 L 510 -2" class="arrow arrow0"/></g><g class="commit-bullets"><circle cx="10" cy="-2" r="10" class="commit v1.0.0 commit0"/><circle cx="60" cy="88" r="10" class="commit feat(note): add wikilink parser commit1"/><circle cx="110" cy="88" r="10" class="commit feat(note): debounced search commit1"/><circle cx="160" cy="88" r="10" class="commit test(note): wikilink integration tests commit1"/><circle cx="210" cy="-2" r="10" class="commit PR #12 merged commit0"/><circle cx="210" cy="-2" r="6" class="commit commit-merge PR #12 merged commit0"/><circle cx="260" cy="178" r="10" class="commit feat(graph): pagerank base commit2"/><circle cx="310" cy="268" r="10" class="commit fix(note): enforce RLS on note queries commit3"/><circle cx="360" cy="-2" r="10" class="commit PR #15 merged commit0"/><circle cx="360" cy="-2" r="6" class="commit commit-merge PR #15 merged commit0"/><circle cx="410" cy="178" r="10" class="commit feat(graph): cluster cache commit2"/><circle cx="460" cy="-2" r="10" class="commit PR #16 merged commit0"/><circle cx="460" cy="-2" r="6" class="commit commit-merge PR #16 merged commit0"/><circle cx="510" cy="-2" r="10" class="commit release commit0"/></g><g class="commit-labels"><g transform="translate(-21.81828125, 19.41109375) rotate(-45, 0, -2)"><rect class="commit-label-bkg" x="-5.83984375" y="11.5" width="31.6796875" height="15"/><text x="-3.83984375" y="23" class="commit-label">v1.0.0</text></g><g transform="translate(-61.188359375, 54.636953125) rotate(-45, 50, 88)"><rect class="commit-label-bkg" x="-7.642578125" y="101.5" width="135.28515625" height="15"/><text x="-5.642578125" y="113" class="commit-label">feat(note): add wikilink parser</text></g><g transform="translate(-60.949374999999996, 54.423125) rotate(-45, 100, 88)"><rect class="commit-label-bkg" x="42.671875" y="101.5" width="134.65625" height="15"/><text x="44.671875" y="113" class="commit-label">feat(note): debounced search</text></g><g transform="translate(-69.38062500000001, 61.966874999999995) rotate(-45, 150, 88)"><rect class="commit-label-bkg" x="81.578125" y="101.5" width="156.84375" height="15"/><text x="83.578125" y="113" class="commit-label">test(note): wikilink integration tests</text></g><g transform="translate(-37.9178125, 33.815937500000004) rotate(-45, 200, -2)"><rect class="commit-label-bkg" x="172.9765625" y="11.5" width="74.046875" height="15"/><text x="174.9765625" y="23" class="commit-label">PR #12 merged</text></g><g transform="translate(-57.30783203125, 51.16490234375) rotate(-45, 250, 178)"><rect class="commit-label-bkg" x="197.46337890625" y="191.5" width="125.0732421875" height="15"/><text x="199.46337890625" y="203" class="commit-label">feat(graph): pagerank base</text></g><g transform="translate(-75.5140625, 67.4546875) rotate(-45, 300, 268)"><rect class="commit-label-bkg" x="223.5078125" y="281.5" width="172.984375" height="15"/><text x="225.5078125" y="293" class="commit-label">fix(note): enforce RLS on note queries</text></g><g transform="translate(-37.9178125, 33.815937500000004) rotate(-45, 350, -2)"><rect class="commit-label-bkg" x="322.9765625" y="11.5" width="74.046875" height="15"/><text x="324.9765625" y="23" class="commit-label">PR #15 merged</text></g><polygon class="tag-label-bkg" points="334.16015625,-19.2  &#10;      334.16015625,-23.2&#10;      342.16015625,-28.7&#10;      377.83984375,-28.7&#10;      377.83984375,-13.7&#10;      342.16015625,-13.7"/><circle cy="-21.2" cx="338.16015625" r="1.5" class="tag-hole"/><text y="-18" class="tag-label" x="346.16015625">v1.0.1</text><g transform="translate(-54.55431640625, 48.70123046875) rotate(-45, 400, 178)"><rect class="commit-label-bkg" x="351.08642578125" y="191.5" width="117.8271484375" height="15"/><text x="353.08642578125" y="203" class="commit-label">feat(graph): cluster cache</text></g><g transform="translate(-37.9178125, 33.815937500000004) rotate(-45, 450, -2)"><rect class="commit-label-bkg" x="422.9765625" y="11.5" width="74.046875" height="15"/><text x="424.9765625" y="23" class="commit-label">PR #16 merged</text></g><g transform="translate(-23.9298046875, 21.300351562499998) rotate(-45, 500, -2)"><rect class="commit-label-bkg" x="491.3818359375" y="11.5" width="37.236328125" height="15"/><text x="493.3818359375" y="23" class="commit-label">release</text></g><polygon class="tag-label-bkg" points="484.16015625,-19.2  &#10;      484.16015625,-23.2&#10;      492.16015625,-28.7&#10;      527.83984375,-28.7&#10;      527.83984375,-13.7&#10;      492.16015625,-13.7"/><circle cy="-21.2" cx="488.16015625" r="1.5" class="tag-hole"/><text y="-18" class="tag-label" x="496.16015625">v1.1.0</text></g></svg>
</figure>
### A2. 커밋 메시지

#### 형식 (Conventional Commits)

```
<type>(<scope>): <subject>

[body]

[footer]
```

#### Type 정의

| Type | 설명 | SemVer 영향 |
|------|------|-------------|
| `feat` | 새로운 기능 추가 | MINOR |
| `fix` | 버그 수정 | PATCH |
| `docs` | 문서 수정 | - |
| `style` | 코드 포맷팅 (로직 변경 없음) | - |
| `refactor` | 리팩토링 (기능/버그 아님) | - |
| `test` | 테스트 추가/수정 | - |
| `chore` | 빌드/설정/의존성 변경 | - |
| `perf` | 성능 개선 | PATCH |
| `ci` | CI/CD 설정 변경 | - |
| `revert` | 이전 커밋 되돌리기 | - |

#### Scope (4-서비스 × 내부 모듈 매트릭스)

| 서비스 / 영역 | scope 값 |
|---|---|
| platform-svc 내부 모듈 | `auth`, `audit`, `billing`, `notification` |
| engagement-svc 내부 모듈 | `community`, `gamification` |
| knowledge-svc 내부 모듈 | `note`, `graph`, `chunking` |
| learning-svc 내부 모듈 | `card`, `srs`, `ai` |
| Cross-cutting | `shared`, `infra`, `ui`, `api` |

> Scope는 **모듈** 단위로 선택한다. 한 PR이 여러 모듈을 건드리면 잘 나뉘는 단위로 PR을 분할하거나, scope를 가장 큰 변경 모듈로 둔다.

#### 도메인별 커밋 예시

| Scope | 예시 |
|---|---|
| `feat(auth)` | `feat(auth): add OAuth provider config` |
| `feat(note)` | `feat(note): add wikilink auto-completion` |
| `fix(srs)` | `fix(srs): correct SM-2 ease factor calculation` |
| `feat(community)` | `feat(community): add study group CRUD` |
| `feat(gamification)` | `feat(gamification): implement XP system` |
| `feat(notification)` | `feat(notification): add FCM push` |
| `feat(ai)` | `feat(ai): semantic cache hit ratio` |
| `chore(shared)` | `chore(shared): bump avro plugin to 1.11.3` |
| `feat(infra)` | `feat(infra): add ArgoCD ApplicationSet for staging` |

#### 커밋 메시지 예시

```
feat(note): add wikilink auto-completion

- Implement [[...]] syntax detection in editor
- Add debounced search for existing note titles
- Show dropdown with matching notes

Closes #42
```

```
fix(srs): correct SM-2 ease factor calculation

EaseFactor was not clamped to minimum 1.3 when
quality < 3, causing intervals to shrink indefinitely.

Fixes #78
```

```
feat(auth)!: migrate to OAuth 2.1 with PKCE

BREAKING CHANGE: Legacy OAuth 2.0 implicit flow
tokens are no longer accepted. All clients must
use authorization code flow with PKCE.
```

#### 커밋 규칙

- 제목(subject): 50자 이내, 영문 소문자 시작, 마침표 없음
- 본문(body): 72자 줄바꿈, "무엇"보다 "왜" 설명
- Breaking Change: `!` 접미사 + footer에 `BREAKING CHANGE:` 명시
- Issue 연결: `Closes #N`, `Fixes #N`, `Refs #N`
- 하나의 커밋 = 하나의 논리적 변경

### A3. Pull Request 규칙

#### PR 제목 형식

```
<type>(<scope>): <간결한 설명> (#이슈번호)
```

예시: `feat(note): implement wikilink navigation (#42)`

#### PR 본문 템플릿

```markdown
