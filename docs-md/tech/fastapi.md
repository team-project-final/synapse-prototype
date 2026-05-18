
#### 개요
Python 3.7+ 타입 힌팅 기반의 고성능 비동기 웹 프레임워크로, Pydantic을 사용한 자동 요청/응답 검증과 OpenAPI 문서 자동 생성이 특징이다.

#### 역할
Synapse AI Service의 HTTP API 프레임워크이다. 카드 자동 생성(`POST /api/generate/cards`), 시맨틱 검색(`POST /api/search/semantic`), 노트 요약(`POST /api/summarize`), 임베딩 생성(`POST /api/embeddings`) 엔드포인트를 제공한다. 비동기 처리로 OpenAI API 호출 대기 중 다른 요청을 동시에 처리한다.

#### 선택 이유
FastAPI는 Starlette 기반으로 비동기 I/O를 네이티브 지원하여 OpenAI API처럼 I/O 바운드 작업이 많은 AI 서비스에 적합하다. Pydantic v2 통합으로 요청 검증 자동화, OpenAPI 문서 자동 생성으로 Spring Boot 서비스와의 계약 기반 통합이 용이하다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **FastAPI** | 비동기, Pydantic 통합, OpenAPI 자동 생성, 고성능 | 상대적으로 젊은 프레임워크 | ✅ 선택 |
| Flask | 단순, 오랜 역사 | 동기 기본, 비동기 추가 복잡 | ❌ |
| Django REST Framework | 풍부한 기능 | 무거움, AI 서비스에 과도 | ❌ |
| Litestar | FastAPI 대안, 성능 유사 | 커뮤니티 작음 | ❌ |

#### 기술적 이점
- **Pydantic v2 통합**: Rust 기반 검증으로 수십 배 성능 향상
- **OpenAPI 자동 생성**: `/docs` (Swagger UI) 자동 제공
- **의존성 주입**: `Depends()` 시스템으로 DB 세션, 인증, 설정 주입
- **비동기 엔드포인트**: `async def` 핸들러로 동시 요청 효율적 처리
- **WebSocket 지원**: 실시간 AI 스트리밍 응답 (SSE) 구현

#### 핵심 기능
- `@app.post()`, `@app.get()` — 라우팅 데코레이터
- `BaseModel` (Pydantic) — 요청/응답 스키마 정의
- `BackgroundTasks` — 비동기 백그라운드 작업
- `APIRouter` — 라우팅 모듈화
- `lifespan` — 앱 시작/종료 이벤트 (DB 연결 풀 초기화)

#### 프로젝트 내 사용 위치
- `synapse-learning-svc/learning-ai/app/main.py` — FastAPI 앱 초기화
- `synapse-learning-svc/learning-ai/app/routers/` — generate, search, summarize 라우터
- `synapse-learning-svc/learning-ai/app/models/` — Pydantic 요청/응답 모델
- `synapse-learning-svc/learning-ai/app/services/` — LangChain 통합 서비스

#### 설정 가이드

```python
# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import generate, search, summarize
from app.core.config import Settings
from app.core.database import init_db, close_db

settings = Settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()          # DB 연결 풀 초기화
    yield
    await close_db()         # 앱 종료 시 정리

app = FastAPI(
    title="Synapse AI Service",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
)

app.add_middleware(CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"])

app.include_router(generate.router, prefix="/api/generate", tags=["generation"])
app.include_router(search.router,   prefix="/api/search",   tags=["search"])
app.include_router(summarize.router,prefix="/api/summarize",tags=["summarize"])
```

```python
# app/routers/generate.py
from fastapi import APIRouter, Depends, HTTPException
from app.models.card import GenerateCardsRequest, GenerateCardsResponse
from app.services.card_generator import CardGeneratorService

router = APIRouter()

@router.post("/cards", response_model=GenerateCardsResponse)
async def generate_cards(
    request: GenerateCardsRequest,
    service: CardGeneratorService = Depends(),
) -> GenerateCardsResponse:
    """노트 내용을 기반으로 SRS 카드를 자동 생성합니다 (최대 10개)."""
    try:
        cards = await service.generate(
            content=request.content,
            card_count=min(request.card_count or 5, 10),
            language=request.language or "ko",
        )
        return GenerateCardsResponse(cards=cards)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"카드 생성 실패: {e}")
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| Pydantic v2 검증 오류 | v1 문법 사용 | `@validator` → `@field_validator`, `orm_mode` → `model_config` |
| `async def` 핸들러에서 블로킹 | 동기 라이브러리를 async에서 호출 | `anyio.to_thread.run_sync()` 사용 |
| CORS 거부 | Middleware 순서 잘못됨 | CORSMiddleware를 가장 먼저 추가 |
| 의존성 주입 오류 | `Depends()` 스코프 문제 | `yield` 기반 의존성으로 변경 |

#### 참고 자료
- FastAPI 공식: https://fastapi.tiangolo.com
- Pydantic v2: https://docs.pydantic.dev/latest/
- FastAPI 비동기 가이드: https://fastapi.tiangolo.com/async/

---
