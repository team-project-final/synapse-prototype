
#### 개요
Cloudflare는 전 세계 엣지 네트워크를 기반으로 CDN, WAF, DDoS 방어, DNS 관리를 통합 제공하는 클라우드 보안·성능 플랫폼이다.

#### 역할 (Synapse 프로젝트 내)
- **CDN**: Flutter Web 빌드 산출물(HTML/JS/CSS/WASM)을 전 세계 엣지에 캐싱하여 글로벌 사용자 로딩 속도 최소화
- **WAF**: OWASP Top 10 규칙 자동 적용, SQL Injection / XSS / CSRF 공격 차단
- **DDoS 방어**: L3/L4(네트워크 계층) 및 L7(애플리케이션 계층) DDoS 자동 완화
- **TLS 종료**: 클라이언트-Cloudflare 구간 TLS 1.3, Cloudflare-원본 서버 구간 Full(Strict) 모드
- **DNS 관리**: `synapse.app` 도메인, 서브도메인(`api.synapse.app`, `app.synapse.app`) 관리
- **Bot 관리**: 악성 봇 차단, 크롤러 제어

#### 선택 이유
- Flutter Web의 WASM 파일(대용량)을 CDN으로 제공하면 초기 로딩 시간 70% 이상 단축
- DDoS 방어와 WAF를 단일 서비스로 통합하여 보안 인프라 단순화
- Cloudflare Pages를 통한 Flutter Web 자동 배포 파이프라인
- 무료 티어에서도 DDoS 방어 기본 제공
- 전 세계 300+ PoP으로 아시아-태평양 지역 지연 시간 최소화

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **Cloudflare** | 통합 보안, CDN, 합리적 비용 | 일부 고급 기능 유료 | **선택** |
| AWS CloudFront + Shield | AWS 통합 | 비용 높음, WAF 별도 구성 복잡 | 미선택 |
| Akamai | 엔터프라이즈 성능 | 비용 극대화, 소규모 부적합 | 미선택 |
| Fastly | 실시간 캐시 퍼지 | 비용, 설정 복잡 | 미선택 |
| 자체 Nginx CDN | 완전 제어 | 글로벌 엣지 없음, 운영 부담 | 미선택 |

#### 기술적 이점
- **WASM 캐싱**: Flutter Web의 `main.dart.js`(~5MB), `flutter_service_worker.js` 등 대용량 자산 엣지 캐싱
- **Cache-Control 헤더 자동화**: 콘텐츠 해시 파일명으로 1년 캐시, `index.html`은 no-cache
- **Zero-downtime 배포**: Cloudflare Pages의 원자적 배포로 부분 배포 상태 없음
- **Argo Smart Routing**: 네트워크 경로 최적화로 API 지연 시간 추가 단축 (Pro 플랜)

#### 설정 가이드

```
# Cloudflare DNS 설정
app.synapse.app     CNAME  synapse.pages.dev     (Flutter Web CDN)
api.synapse.app     CNAME  k8s-alb.ap-northeast-2.elb.amazonaws.com  (API ALB)

# Page Rules
app.synapse.app/assets/*  → Cache Level: Cache Everything, Edge TTL: 1 year
app.synapse.app/          → Cache Level: Bypass (index.html)

# WAF 커스텀 규칙 예시 (Cloudflare Ruleset)
- 규칙: (http.request.uri.path contains "/api/" and
         cf.threat_score gt 20) → Block
- 규칙: Rate Limit /api/v1/ai/* → 100 req/min per IP
```

```javascript
// wrangler.toml (Cloudflare Pages 설정)
name = "synapse-web"
compatibility_date = "2024-01-01"

[env.production]
route = "app.synapse.app/*"

[[headers]]
for = "/assets/*"
[headers.values]
Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
for = "/*.html"
[headers.values]
Cache-Control = "no-cache, no-store, must-revalidate"
```

#### 트러블슈팅

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| Flutter Web 구버전 제공 | CDN 캐시 미퍼지 | Cloudflare Pages 배포 시 자동 캐시 퍼지 확인 |
| API 요청 차단 (WAF) | 정상 요청이 규칙에 매칭 | WAF 이벤트 로그 확인, 규칙 예외 추가 |
| TLS 인증서 오류 | Origin 서버 인증서 만료 | AWS ACM 인증서 자동 갱신 설정 |
| DDoS 완화 중 정상 사용자 차단 | 임계값 과민 | Challenge 페이지로 전환, IP 화이트리스트 추가 |

#### 참고 자료
- Cloudflare 공식 문서: https://developers.cloudflare.com/
- Cloudflare Pages: https://developers.cloudflare.com/pages/
- WAF 규칙: https://developers.cloudflare.com/waf/

---
