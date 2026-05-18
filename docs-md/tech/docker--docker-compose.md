
#### 개요
Docker는 애플리케이션을 컨테이너 단위로 패키징하는 플랫폼이며, Docker Compose는 다중 컨테이너 애플리케이션의 로컬 개발 환경을 정의하고 실행하는 도구이다.

#### 역할 (Synapse 프로젝트 내)
- 4개 서비스 레포와 learning-svc 내부 2개 런타임 및 모든 인프라(PostgreSQL, Redis, Elasticsearch, Kafka, Zookeeper)를 단일 `docker-compose.yml`로 로컬 실행
- 개발자 온보딩: `docker compose up -d` 한 명령으로 전체 환경 구동
- 프로덕션 이미지: 멀티 스테이지 빌드로 개발용 도구 제거, 최소화된 런타임 이미지 생성
- GitHub Actions CI에서 Docker 이미지 빌드 → AWS ECR 푸시
- 서비스별 독립적인 `Dockerfile` 유지 (Spring Boot: `eclipse-temurin:21-jre`, FastAPI: `python:3.12-slim`)

#### 선택 이유
- 마이크로서비스 아키텍처에서 서비스 간 환경 불일치 완전 제거
- K8s 프로덕션 환경과 동일한 컨테이너 이미지 사용으로 "works on my machine" 문제 해결
- Docker Compose v3의 `profiles` 기능으로 필요한 서비스만 선택 실행 가능
- 업계 표준으로 팀원 모두에게 친숙한 기술

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **Docker + Docker Compose** | 표준, K8s 호환, 풍부한 생태계 | 리소스 사용량 높음 | **선택** |
| Podman + podman-compose | 루트리스, 보안 강화 | Windows 지원 미흡, 생태계 작음 | 미선택 |
| 로컬 직접 실행 | 빠른 기동 | 환경 불일치, 의존성 충돌 | 미선택 |
| Vagrant + VirtualBox | 완전 격리 | 느린 기동, 리소스 과다 | 미선택 |

#### 기술적 이점
- **멀티 스테이지 빌드**: Spring Boot 이미지 크기 1.2GB → 280MB 감소 (빌드 도구 제외)
- **레이어 캐싱**: 의존성 레이어 분리로 코드 변경 시 빌드 시간 80% 단축
- **건강 체크**: `healthcheck` 설정으로 의존 서비스 준비 후 기동 보장
- **프로파일 분리**: `--profile monitoring` 으로 Prometheus/Grafana 선택 기동

#### 핵심 기능

```yaml
# docker-compose.yml 핵심 구조
version: '3.9'

services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: synapse
      POSTGRES_USER: synapse
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U synapse"]
      interval: 10s
      timeout: 5s
      retries: 5
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD} --cluster-enabled yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]

  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile
      target: production   # 멀티 스테이지 타겟
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DATABASE_URL=postgresql://synapse:${POSTGRES_PASSWORD}@postgres:5432/synapse
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
```

```dockerfile
# ai-service/Dockerfile (멀티 스테이지)
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.12-slim AS production
WORKDIR /app
COPY --from=builder /install /usr/local
COPY . .
RUN useradd -m appuser && chown -R appuser /app
USER appuser
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### 프로젝트 내 사용 위치
- 로컬 개발: 모든 팀원의 `docker-compose.yml`
- CI/CD: GitHub Actions에서 빌드 및 ECR 푸시
- 프로덕션: K8s Pod의 컨테이너 이미지 소스

#### 트러블슈팅

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| 포트 충돌 | 로컬 서비스와 충돌 | `.env`에서 포트 오버라이드 설정 |
| 빌드 캐시 오염 | 구버전 레이어 캐시 | `docker compose build --no-cache` |
| 볼륨 권한 오류 | Linux/Mac 파일 시스템 차이 | `user: "${UID}:${GID}"` 설정 |
| 메모리 부족 | 4개 서비스와 learning-svc 2개 런타임 동시 실행 | Docker Desktop 메모리 8GB 이상 할당 |

#### 참고 자료
- Docker Compose: https://docs.docker.com/compose/
- 멀티 스테이지 빌드: https://docs.docker.com/develop/develop-images/multistage-build/
- pgvector Docker: https://hub.docker.com/r/pgvector/pgvector

---
