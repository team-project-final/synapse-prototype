
#### 개요
uvloop과 httptools를 기반으로 구축된 ASGI 서버로, Python 비동기 웹 애플리케이션의 고성능 프로덕션 서버이다.

#### 역할
FastAPI 애플리케이션의 실행 서버이다. 개발 환경에서는 `--reload` 모드로, 프로덕션 환경에서는 `gunicorn`과 함께 다중 워커 모드로 실행한다. Kubernetes 파드 당 CPU 코어 수에 맞게 uvicorn 워커를 설정한다.

#### 선택 이유
FastAPI는 ASGI 프레임워크이므로 ASGI 서버가 필수이다. uvicorn은 FastAPI의 공식 권장 서버이며, uvloop(libev 기반 이벤트 루프)로 표준 asyncio 대비 2~4배 성능 향상을 제공한다.

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **uvicorn** | FastAPI 공식 권장, 고성능, uvloop 통합 | 단일 프로세스 | ✅ 선택 |
| Hypercorn | HTTP/2, HTTP/3 지원 | uvicorn 대비 성능 낮음 | ❌ |
| gunicorn + uvicorn worker | 다중 프로세스, 안정성 | uvicorn 단독 대비 복잡 | ✅ 프로덕션 조합 사용 |

#### 기술적 이점
- **uvloop**: C 기반 이벤트 루프로 표준 asyncio 대비 2~4배 빠른 I/O
- **httptools**: llhttp 파서 기반 빠른 HTTP 파싱
- **graceful shutdown**: SIGTERM 수신 시 진행 중인 요청 완료 후 종료

#### 핵심 기능
- `--reload`: 코드 변경 감지 자동 재시작 (개발 전용)
- `--workers N`: 다중 워커 프로세스 (`gunicorn` 연동 시)
- `--proxy-headers`: 리버스 프록시 뒤에서 실제 IP 추출

#### 프로젝트 내 사용 위치
- `synapse-ai/Dockerfile` — 프로덕션 서버 실행
- `synapse-ai/docker-compose.yml` — 로컬 개발 실행

#### 설정 가이드

```dockerfile
# Dockerfile — 프로덕션: gunicorn + uvicorn worker
FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml poetry.lock ./
RUN pip install poetry && poetry install --no-dev
COPY app/ ./app/

CMD ["gunicorn", "app.main:app",
     "--workers", "4",
     "--worker-class", "uvicorn.workers.UvicornWorker",
     "--bind", "0.0.0.0:8000",
     "--timeout", "120",
     "--graceful-timeout", "30"]
```

```yaml
# docker-compose.yml — 개발 환경
services:
  ai-service:
    build: ./synapse-ai
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    volumes:
      - ./synapse-ai/app:/app/app
```

#### 트러블슈팅

| 증상 | 원인 | 해결책 |
|------|------|--------|
| 워커 OOM Kill | OpenAI 응답 캐싱으로 메모리 증가 | `max_requests=1000` 설정 (메모리 릭 방지 주기적 재시작) |
| Graceful shutdown 지연 | 진행 중인 스트리밍 연결 | `--graceful-timeout 60` 증가 |
| 리로드 미작동 | `--reload-dir` 미설정 | `--reload-dir app` 명시 |

#### 참고 자료
- uvicorn 공식: https://www.uvicorn.org
- 배포 가이드: https://fastapi.tiangolo.com/deployment/server-workers/

---
