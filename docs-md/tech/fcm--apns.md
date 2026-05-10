
#### 개요
Firebase Cloud Messaging(FCM)은 Android 및 Web 푸시 알림 서비스이며, Apple Push Notification service(APNs)는 iOS 푸시 알림 서비스이다.

#### 역할 (Synapse 프로젝트 내)
- **복습 알림**: 오늘 복습할 카드가 있을 때 푸시 알림 발송 (`card.review.due` Kafka 이벤트)
- **배지/레벨업 알림**: XP/배지 획득 알림 (`gamification.badge.earned`)
- **공유 알림**: 그룹에 덱/노트 공유 시 멤버 알림 (`community.deck.shared`)
- Notification Service가 Kafka 이벤트 소비 → FCM/APNs API 호출
- **디바이스 토큰 관리**: 앱 설치 시 등록, 410 Gone 응답 시 자동 삭제
- FCM 서비스 계정 JSON, APNs P8 키는 AWS Secrets Manager 관리

#### 선택 이유
- FCM은 Android/Web 푸시의 유일한 표준 (Google Play Services 기반)
- APNs는 iOS 기기 푸시의 필수 경로 (Apple 정책)
- FCM으로 Android + Web 동시 지원 (단일 API)
- Firebase Admin SDK로 백엔드 통합 용이

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **FCM + APNs (직접 연동)** | 표준, 무료, 직접 제어 | 플랫폼별 별도 처리 | **선택** |
| OneSignal | 멀티 플랫폼 통합, 대시보드 | 외부 SaaS 의존, 비용 | 미선택 |
| AWS SNS + FCM/APNs | AWS 통합 | 추가 레이어, 지연 발생 가능 | 미선택 |
| WebSocket만 사용 | 실시간성 | 배터리 소모, 앱 종료 시 미수신 | 미선택 |

#### 설정 가이드

```java
// Notification Service - PushNotificationService.java
@Service
public class PushNotificationService {
    private final FirebaseMessaging fcm;
    private final ApnsClient apnsClient;

    // FCM 발송 (Android + Web)
    public void sendFCM(String token, NotificationPayload payload) {
        Message message = Message.builder()
            .setToken(token)
            .setNotification(Notification.builder()
                .setTitle(payload.getTitle())
                .setBody(payload.getBody())
                .build())
            .putAllData(payload.getData())
            .setAndroidConfig(AndroidConfig.builder()
                .setPriority(AndroidConfig.Priority.HIGH).build())
            .build();
        try {
            fcm.send(message);
        } catch (FirebaseMessagingException e) {
            if (e.getMessagingErrorCode() ==
                    MessagingErrorCode.REGISTRATION_TOKEN_NOT_REGISTERED) {
                deviceTokenRepository.deleteByToken(token);  // 만료 토큰 삭제
            }
        }
    }

    // APNs 발송 (iOS)
    public void sendAPNs(String token, NotificationPayload payload) {
        SimpleApnsPushNotification notification = new SimpleApnsPushNotification(
            token, bundleId,
            new ApnsPayloadBuilder()
                .setAlertTitle(payload.getTitle())
                .setAlertBody(payload.getBody())
                .setBadgeNumber(payload.getBadgeCount())
                .build()
        );
        apnsClient.sendNotification(notification).whenComplete((response, cause) -> {
            if (response != null && !response.isAccepted()) {
                if ("Unregistered".equals(response.getRejectionReason())) {
                    deviceTokenRepository.deleteByToken(token);
                }
            }
        });
    }
}
```

```yaml
# AWS Secrets Manager 키 구조
synapse/production/fcm:
  serviceAccountJson: '{"type":"service_account",...}'
synapse/production/apns:
  keyId: "XXXXXXXXXX"
  teamId: "YYYYYYYYYY"
  p8Key: "-----BEGIN PRIVATE KEY-----\n..."
  bundleId: "app.synapse.ios"
```

#### 트러블슈팅

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| FCM 토큰 무효화 | 앱 재설치 또는 토큰 갱신 | 410 응답 수신 시 DB에서 해당 토큰 즉시 삭제 |
| APNs 인증 실패 | P8 키 또는 Team ID 오류 | AWS Secrets Manager 값 재확인 |
| iOS 알림 미수신 | APNs 환경 불일치 (dev/prod) | 프로덕션 빌드 → production APNs 서버 사용 |
| 대량 발송 지연 | 순차 처리 | FCM Multicast (최대 500개) 또는 비동기 병렬 처리 |

#### 참고 자료
- FCM 공식 문서: https://firebase.google.com/docs/cloud-messaging
- APNs 공식 문서: https://developer.apple.com/documentation/usernotifications
- Pushy APNs Java: https://github.com/jchambers/pushy

---
