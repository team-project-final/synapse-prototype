
#### 개요
동적 타입, 고수준 범용 프로그래밍 언어의 3.12 버전으로, 개선된 오류 메시지, 성능 개선, f-string 확장이 포함된 최신 안정 릴리스이다.

#### 역할
Synapse AI Service의 런타임 환경이다. OpenAI API 연동, RAG(Retrieval Augmented Generation) 파이프라인, SRS 카드 자동 생성, 시맨틱 검색, 노트 요약 기능을 Python/FastAPI 스택으로 구현한다.

#### 선택 이유
AI/ML 라이브러리 생태계(LangChain, OpenAI SDK, sentence-transformers, huggingface_hub)가 Python에 집중되어 있어 선택이 사실상 필수적이다. Python 3.12의 성능 개선과 asyncio 성숙도가 FastAPI와 시너지를 만든다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **Python 3.12** | AI/ML 생태계 최강, asyncio 성숙, 빠른 개발 | GIL, Java 대비 낮은 성능 | ✅ 선택 |
| Python 3.11 | 안정성 | 3.12 성능 개선 미적용 | ❌ |
| Node.js | LangChain.js 존재 | Python AI 라이브러리 지원 부족 | ❌ |
| Java (DJL) | JVM 통합 | AI 라이브러리 Python 대비 부족 | ❌ |

#### 기술적 이점
- **Python 3.12 성능**: CPython 최적화로 3.11 대비 약 5% 향상
- **개선된 오류 메시지**: 디버깅 시간 단축
- **asyncio 성숙**: FastAPI와 완벽한 비동기 I/O 조합
- **타입 힌팅 강화**: PEP 695 타입 파라미터 (`type Vector = list[float]`)

#### 핵심 기능
- `asyncio`: 이벤트 루프 기반 비동기 프로그래밍
- `typing` 모듈: 타입 힌팅으로 Pydantic 모델 정의
- `dataclasses`: 경량 데이터 컨테이너
- `poetry`: 의존성 및 가상환경 관리

#### 프로젝트 내 사용 위치
- `synapse-ai/` — AI Service 전체
- `synapse-ai/app/services/` — LangChain, OpenAI 통합

#### 설정 가이드

```toml
# pyproject.toml
[tool.poetry]
name = "synapse-ai"
version = "1.0.0"
python = "^3.12"

[tool.poetry.dependencies]
python = "^3.12"
fastapi = "^0.130.0"
uvicorn = {extras = ["standard"], version = "^0.46.0"}
langchain = "^1.2.0"
langchain-openai = "^0.2.0"
openai = "^1.40.0"
pydantic = "^2.7.0"
pydantic-settings = "^2.3.0"
httpx = "^0.28.0"
asyncpg = "^0.29.0"
redis = "^5.0.0"
sqlalchemy = {extras = ["asyncio"], version = "^2.0.0"}

[tool.mypy]
python_version = "3.12"
strict = true
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| asyncio 이벤트 루프 오류 | 동기 함수에서 `asyncio.run()` 중첩 | `asyncio.run()`은 최상위에서만 사용 |
| GIL로 CPU 성능 저하 | CPU 집약적 작업 | `ProcessPoolExecutor` 또는 C extension 사용 |
| 패키지 충돌 | 전역 설치 패키지 | 반드시 가상환경 사용 (poetry env) |

#### 참고 자료
- Python 3.12 새 기능: https://docs.python.org/3/whatsnew/3.12.html
- Poetry: https://python-poetry.org/docs/

---
