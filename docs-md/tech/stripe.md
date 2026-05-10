
#### 개요
Stripe는 결제 처리, 구독 관리, 인보이싱을 제공하는 글로벌 결제 인프라 플랫폼이다.

#### 역할 (Synapse 프로젝트 내)
- **결제 처리**: Stripe Checkout Session으로 플랜 업그레이드 결제 처리
- **구독 관리**: Free/Pro/Team/Enterprise 플랜의 월정기 구독 생성, 변경, 취소
- **Customer Portal**: 사용자가 결제 수단 변경, 구독 취소, 청구서 조회를 셀프서비스로 처리
- **Webhook 처리**: `checkout.session.completed`, `invoice.payment_failed`, `customer.subscription.deleted` 이벤트 수신 → Billing Service 처리
- **Proration**: 플랜 업/다운그레이드 시 일할 계산 자동 처리
- **테스트 모드**: 개발/스테이징 환경에서 실제 결제 없이 전체 플로우 테스트

#### 선택 이유
- 구독 결제의 복잡한 로직(갱신, 실패, 재시도, 프로레이션)을 Stripe가 완전 처리
- Strong Customer Authentication(SCA), 3DS 등 글로벌 결제 규정 자동 준수
- 한국 원화(KRW) 결제 및 해외 카드 모두 지원
- PCI DSS Level 1 인증으로 카드 정보 자체 저장 불필요
- Webhook 서명 검증으로 위조 이벤트 방지

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **Stripe** | 구독 완성도, 글로벌, PCI DSS | 수수료 2.9%+30¢ | **선택** |
| 토스페이먼츠 | 한국 특화, 낮은 수수료 | 해외 결제 제한, 구독 기능 미흡 | 미선택 |
| 아임포트(포트원) | 한국 PG 연동 다양 | 구독 관리 직접 구현 필요 | 미선택 |
| PayPal | 글로벌 인지도 | API 복잡, 한국 사용자 낯섦 | 미선택 |
| Paddle | SaaS 특화, 세금 처리 | 수수료 높음, 한국 서비스 제한 | 미선택 |

#### 기술적 이점
- **Checkout Session**: 결제 UI를 Stripe가 호스팅하여 PCI 범위 최소화
- **Idempotency Key**: 동일 요청 재시도 시 중복 결제 방지
- **Webhook 자동 재시도**: 실패한 Webhook을 72시간 동안 자동 재시도
- **Stripe CLI**: 로컬 개발 시 `stripe listen --forward-to localhost:8080/webhooks` 로 실시간 테스트

#### 설정 가이드

```java
// Billing Service - StripeWebhookController.java
@RestController
@RequestMapping("/webhooks/stripe")
public class StripeWebhookController {
    private final String webhookSecret = System.getenv("STRIPE_WEBHOOK_SECRET");

    @PostMapping
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            return ResponseEntity.badRequest().body("Invalid signature");
        }
        switch (event.getType()) {
            case "checkout.session.completed" -> handleCheckoutCompleted(event);
            case "invoice.payment_failed"     -> handlePaymentFailed(event);
            case "customer.subscription.deleted" -> handleSubscriptionDeleted(event);
        }
        return ResponseEntity.ok("OK");
    }
}

// Checkout Session 생성 (플랜 업그레이드)
SessionCreateParams params = SessionCreateParams.builder()
    .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
    .setSuccessUrl("https://app.synapse.app/billing/success?session_id={CHECKOUT_SESSION_ID}")
    .setCancelUrl("https://app.synapse.app/billing")
    .setCustomer(stripeCustomerId)
    .addLineItem(SessionCreateParams.LineItem.builder()
        .setPrice(proPlanPriceId)
        .setQuantity(1L)
        .build())
    .putMetadata("tenant_id", tenantId.toString())
    .build();
Session session = Session.create(params);
```

```yaml
# 환경변수 (AWS Secrets Manager)
# synapse/production/stripe
STRIPE_SECRET_KEY: sk_live_...
STRIPE_WEBHOOK_SECRET: whsec_...
STRIPE_PRO_PRICE_ID: price_...
STRIPE_TEAM_PRICE_ID: price_...
# 개발 환경
STRIPE_SECRET_KEY: sk_test_...
```

#### 트러블슈팅

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| Webhook 서명 검증 실패 | 요청 바디 재파싱 | `@RequestBody String` 으로 원본 바이트 수신 |
| 구독 상태 불일치 | Webhook 미수신 | Stripe Dashboard에서 Webhook 재발송 |
| 중복 결제 | Idempotency Key 미사용 | API 호출 시 `Idempotency-Key` 헤더 추가 |
| 테스트 카드 실패 | 잘못된 번호 | 4242424242424242 (Stripe 공식 테스트 카드) 사용 |
| 프로레이션 미적용 | 기간 종료 후 변경 설정 | `proration_behavior: create_prorations` 확인 |

#### 참고 자료
- Stripe 공식 문서: https://stripe.com/docs
- Webhook 핸들링: https://stripe.com/docs/webhooks
- 구독 관리: https://stripe.com/docs/billing/subscriptions/overview
- 테스트 카드: https://stripe.com/docs/testing

---
