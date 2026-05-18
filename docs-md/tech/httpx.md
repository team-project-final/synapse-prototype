
#### 개요
Python용 완전한 기능을 갖춘 HTTP 클라이언트 라이브러리로, 동기 및 비동기(asyncio) 인터페이스를 모두 지원하며 HTTP/2를 내장 지원한다.

#### 역할
AI Service에서 외부 HTTP 호출과 FastAPI 통합 테스트에 사용한다. FastAPI의 공식 테스트 클라이언트(`TestClient`)가 httpx 기반이며, OpenAI SDK 내부적으로도 httpx를 사용한다.

#### 선택 이유
FastAPI의 공식 테스트 클라이언트가 httpx 기반이므로 테스트 코드에서 자연스럽게 사용된다. 동기/비동기를 동일한 API로 지원하여 테스트와 프로덕션 코드에서 같은 클라이언트를 사용할 수 있다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **httpx** | 동기/비동기 통합, HTTP/2, FastAPI 공식 테스트 클라이언트 | requests 대비 적은 레퍼런스 | ✅ 선택 |
| requests | 방대한 레퍼런스, 단순 API | 비동기 미지원 | ❌ |
| aiohttp | 비동기 특화 | API 복잡, 동기 인터페이스 없음 | ❌ |

#### 기술적 이점
- **async/sync 통합**: `httpx.Client` (동기) / `httpx.AsyncClient` (비동기)
- **Connection Pooling**: 연결 재사용으로 성능 향상
- **HTTP/2**: 멀티플렉싱으로 다중 요청 효율화
- **ASGITransport**: FastAPI 앱을 실제 서버 없이 테스트

#### 핵심 기능
- `AsyncClient` — 비동기 HTTP 클라이언트
- `ASGITransport` — FastAPI ASGI 앱 직접 테스트
- `respx` 플러그인 — httpx 요청 모킹

#### 프로젝트 내 사용 위치
- `synapse-learning-svc/learning-ai/tests/` — FastAPI 통합 테스트

#### 설정 가이드

```python
# tests/test_generate.py — httpx AsyncClient로 FastAPI 테스트
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_generate_cards():
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        response = await client.post(
            "/api/generate/cards",
            json={"content": "Python은 인터프리터 언어이다.", "card_count": 3},
            headers={"X-User-Id": "u1", "X-Tenant-Id": "t1"},
        )
    assert response.status_code == 200
    assert len(response.json()["cards"]) == 3
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| `RuntimeError: Event loop closed` | AsyncClient를 이벤트 루프 외부에서 사용 | `async with AsyncClient()` 컨텍스트 매니저 사용 |
| Connection pool exhausted | 클라이언트를 요청마다 생성 | 싱글톤 `AsyncClient` 사용 (lifespan에서 초기화) |
| SSL 인증서 오류 | 개발 환경 자체 서명 인증서 | `verify=False` (개발 전용) |

#### 참고 자료
- httpx 공식: https://www.python-httpx.org
- FastAPI 테스트: https://fastapi.tiangolo.com/tutorial/testing/

---
