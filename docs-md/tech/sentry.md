
#### 개요
Sentry는 애플리케이션 에러 추적 및 성능 모니터링 SaaS 플랫폼으로, 실시간 예외 캡처, 스택 트레이스 분석, 릴리스 추적을 제공한다.

#### 역할 (Synapse 프로젝트 내)
- 4개 서비스와 learning-svc 내부 런타임의 예외(Exception)를 실시간 캡처하여 Sentry 프로젝트로 전송
- Flutter Web: Source Map 연동으로 난독화된 스택 트레이스를 원본 코드 위치로 디코딩
- 릴리스 추적: 배포 버전별 에러 발생 추이 비교 (신규 배포 후 에러 급증 감지)
- 성능 모니터링: 슬로우 트랜잭션, N+1 쿼리, LLM API 지연 감지
- 에러 발생 시 `user_id`, `tenant_id` 자동 연결 (사용자 컨텍스트)
- Slack 연동: 신규 에러 발생 시 즉시 팀 채널 알림

#### 선택 이유
- Flutter, Spring Boot, FastAPI 모두 Sentry SDK 공식 지원
- Source Map 자동 업로드로 Flutter Web 프로덕션 디버깅 현실화
- 에러 그루핑으로 동일 에러 중복 알림 제거
- Issue 추적 → GitHub PR 연동으로 에러 해결 추적

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **Sentry** | Flutter 지원, Source Map, 에러 그루핑 | SaaS 비용 | **선택** |
| Rollbar | 간단한 설정 | Flutter 지원 미흡 | 미선택 |
| Bugsnag | 모바일 특화 | 비용, 기능 제한 | 미선택 |
| Firebase Crashlytics | 무료, 모바일 강력 | Web 지원 제한, 백엔드 미지원 | 미선택 |
| 자체 ELK 에러 추적 | 비용 없음 | Source Map, 그루핑 직접 구현 필요 | 미선택 |

#### 설정 가이드

```dart
// Flutter - main.dart
import 'package:sentry_flutter/sentry_flutter.dart';

Future<void> main() async {
  await SentryFlutter.init(
    (options) {
      options.dsn = 'https://xxx@sentry.io/yyy';
      options.environment = const String.fromEnvironment('ENV');
      options.release = 'synapse@1.2.3';
      options.tracesSampleRate = 0.1;
    },
    appRunner: () => runApp(MyApp()),
  );
}

// 로그인 후 사용자 컨텍스트 설정
Sentry.configureScope((scope) {
  scope.setUser(SentryUser(id: userId, email: userEmail));
  scope.setTag('tenant_id', tenantId);
});
```

```python
# FastAPI - main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.asyncpg import AsyncPGIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    environment=os.getenv("ENV", "production"),
    release=os.getenv("APP_VERSION"),
    integrations=[FastApiIntegration(), AsyncPGIntegration()],
    traces_sample_rate=0.1,
    before_send=scrub_sensitive_data,
)
```

```yaml
# GitHub Actions - Source Map 업로드
- name: Upload Source Maps to Sentry
  uses: getsentry/action-release@v1
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: synapse-team
    SENTRY_PROJECT: flutter-web
  with:
    environment: production
    sourcemaps: build/web
    version: ${{ github.sha }}
```

#### 트러블슈팅

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| Flutter 스택 트레이스 난독화 | Source Map 미업로드 | CI에 Sentry Source Map 업로드 단계 추가 |
| 에러 그루핑 부정확 | 지문(fingerprint) 기본값 | `sentry_sdk.set_tag("fingerprint", custom_key)` |
| 과다 알림 | 에러 폭증 | Alert Rule에 최소 10건 임계값 설정 |
| 성능 데이터 미수집 | `traces_sample_rate=0` | 0.1 이상으로 설정 |

#### 참고 자료
- Sentry Flutter SDK: https://docs.sentry.io/platforms/flutter/
- Sentry FastAPI: https://docs.sentry.io/platforms/python/integrations/fastapi/
- Source Maps: https://docs.sentry.io/platforms/javascript/sourcemaps/

---
