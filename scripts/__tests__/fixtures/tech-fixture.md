# 18. 기술 스택 정의서

## 1. 개요

### 1.1 문서 목적

본 문서는 기술 스택을 정의한다.

### 1.2 전체 시스템 아키텍처

<figure class="mermaid-svg">
<svg data-stub="overview-diagram"></svg>
</figure>

### 1.3 기술 선택 기준

- **Production-ready** — 운영 검증된 기술만 채택한다.
- **Type-safe** — 타입 안전성 우선.
- **Observable** — 모니터링이 가능해야 한다.

### 1.4 기술 스택 전체 목록

| 레이어 | 기술 |
|--------|------|
| Client | Flutter |
| Backend | Spring Boot |

## 2. Client Layer

### 2.1 Flutter 3.x

크로스플랫폼 UI 프레임워크.

#### 설치

설치 가이드.

### 2.2 Dart 3.x

Flutter의 언어. null-safety.

## 4. Backend Services Layer

### 4.1 Java/Spring Ecosystem

JVM 기반 마이크로서비스.

### 4.1.1 Java 21 (LTS)

LTS 릴리즈, virtual threads.

### 4.1.2 Spring Boot 4

자동 설정 프레임워크.

### 4.2 Python/FastAPI Ecosystem

AI 서비스용.

### 4.2.1 Python 3.12

타입 힌트.

## 10. 기술 선택 요약 매트릭스

| 항목 | 결정 |
|------|------|
| 채택 | A |

## 11. 변경 이력

- v1
