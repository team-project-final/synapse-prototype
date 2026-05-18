
#### 개요
Python 생태계의 표준 테스트 프레임워크로, 간결한 `assert` 문, 강력한 픽스처 시스템, 풍부한 플러그인 생태계를 제공한다.

#### 역할
Synapse AI Service의 모든 테스트를 담당한다. 카드 생성 로직 단위 테스트, FastAPI 엔드포인트 통합 테스트, LangChain 체인 Mock 테스트를 `pytest`와 `pytest-asyncio`로 구현한다. CI/CD에서 `pytest-cov`로 80% 커버리지 게이트를 적용한다.

#### 선택 이유
Python 생태계에서 사실상의 표준 테스트 프레임워크이며, `pytest-asyncio`로 비동기 FastAPI 테스트를 자연스럽게 지원한다. `respx`, `pytest-mock`, `pytest-cov` 플러그인으로 AI 서비스 특화 테스트 요구사항을 모두 충족한다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **pytest** | 업계 표준, 풍부한 플러그인, 직관적 assert | - | ✅ 선택 |
| unittest | Python 표준 라이브러리 | 장황한 코드, pytest 대비 기능 부족 | ❌ |
| nose2 | unittest 확장 | 유지보수 저조 | ❌ |

#### 기술적 이점
- **픽스처 시스템**: 의존성 주입 방식의 테스트 설정 (`session/function/module` 스코프)
- **parametrize**: 여러 입력값으로 같은 테스트 반복 실행
- **monkeypatch**: 함수/클래스/환경변수 패치
- **respx**: httpx 요청 모킹 (OpenAI API 모킹)

#### 핵심 기능
- `@pytest.fixture` — 테스트 픽스처
- `@pytest.mark.asyncio` — 비동기 테스트
- `@pytest.mark.parametrize` — 파라미터화 테스트
- `pytest.raises()` — 예외 검증
- `--cov` — 커버리지 측정

#### 프로젝트 내 사용 위치
- `synapse-learning-svc/learning-ai/tests/unit/` — 단위 테스트
- `synapse-learning-svc/learning-ai/tests/integration/` — 통합 테스트
- `synapse-learning-svc/learning-ai/tests/conftest.py` — 공통 픽스처

#### 설정 가이드

```python
# tests/conftest.py
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        yield client

@pytest.fixture
def mock_llm(mocker):
    """LLM 호출 모킹"""
    mock = mocker.patch("app.services.card_generator.ChatOpenAI")
    mock.return_value.ainvoke.return_value = FlashCardList(cards=[
        FlashCard(front="Q1", back="A1", hint="H1", difficulty=2)
    ])
    return mock
```

```ini
# pytest.ini
[pytest]
asyncio_mode = auto
testpaths = tests
addopts = --cov=app --cov-report=term-missing --cov-fail-under=80
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| `RuntimeError: no running event loop` | `asyncio_mode` 미설정 | `pytest.ini`에 `asyncio_mode = auto` |
| 픽스처 스코프 충돌 | `session`/`function` 스코프 혼용 | 픽스처 스코프 일관성 유지 |
| OpenAI API 실제 호출 | Mock 미적용 | `respx` 또는 `pytest-mock`으로 httpx 모킹 |
| 커버리지 게이트 실패 | 새 코드에 테스트 없음 | PR 전 `pytest --cov` 로컬 실행 확인 |

#### 참고 자료
- pytest 공식: https://docs.pytest.org/en/stable/
- pytest-asyncio: https://pytest-asyncio.readthedocs.io/en/latest/
- respx (httpx 모킹): https://lundberg.github.io/respx/

---
