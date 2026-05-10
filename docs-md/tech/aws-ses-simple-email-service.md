
#### 개요
AWS Simple Email Service(SES)는 대량 이메일 발송을 위한 클라우드 기반 이메일 플랫폼으로, 트랜잭션 이메일과 마케팅 이메일을 모두 지원한다.

#### 역할 (Synapse 프로젝트 내)
- **복습 리마인더**: 매일 오전 9시, 오늘 복습할 카드가 있는 사용자에게 이메일 발송
- **계정 알림**: 이메일 인증, 비밀번호 재설정, 구독 변경 확인
- **결제 알림**: 결제 실패, 구독 만료 예정 이메일 (Stripe Webhook 연동)
- **반송/컴플레인 처리**: SNS 토픽으로 반송/컴플레인 수신 → 해당 이메일 발송 중단 (suppression list)
- Notification Service에서 Kafka `notification.send` 이벤트 소비 후 SES API 호출

#### 선택 이유
- AWS 인프라와 동일 생태계 — IAM 역할 기반 인증, VPC 내부 통신
- 이메일 1,000건당 $0.10 수준의 저렴한 비용
- DKIM/DMARC/SPF 설정으로 스팸 분류 방지
- 반송/컴플레인 자동 처리로 발신 평판 유지

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **AWS SES** | AWS 통합, 저비용, 고볼륨 | 초기 샌드박스 제한 | **선택** |
| SendGrid | 템플릿 UI, 분석 강력 | 비용, 외부 서비스 | 미선택 |
| Mailgun | 개발자 친화적 API | 비용, 외부 서비스 | 미선택 |
| Postmark | 트랜잭션 이메일 특화 | 비용, 외부 서비스 | 미선택 |

#### 설정 가이드

```java
// Notification Service - EmailService.java
@Service
public class EmailService {
    private final SesV2Client sesClient;

    public void sendEmail(String to, String subject,
                           String htmlBody, String textBody) {
        SendEmailRequest request = SendEmailRequest.builder()
            .fromEmailAddress("noreply@synapse.app")
            .destination(Destination.builder().toAddresses(to).build())
            .content(EmailContent.builder()
                .simple(Message.builder()
                    .subject(Content.builder().data(subject).charset("UTF-8").build())
                    .body(Body.builder()
                        .html(Content.builder().data(htmlBody).charset("UTF-8").build())
                        .text(Content.builder().data(textBody).charset("UTF-8").build())
                        .build())
                    .build())
                .build())
            .build();
        sesClient.sendEmail(request);
    }
}
```

```
# 반송 처리 아키텍처
SES 반송/컴플레인 이벤트
  → SNS Topic (ses-bounce-complaints)
  → SQS Queue
  → Notification Service Consumer
  → email_suppression_list 테이블 추가
  → 이후 해당 이메일 발송 차단
```

#### 트러블슈팅

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| 샌드박스 제한 | SES 신규 계정 기본값 | AWS Support로 프로덕션 액세스 요청 |
| 이메일 스팸 분류 | DKIM/SPF 미설정 | SES DKIM 설정, Route53 DNS TXT 레코드 추가 |
| 반송율 높음 | 오래된 이메일 주소 | 반송 이벤트 처리 → suppression list 관리 |
| 발송 한도 초과 | 계정 기본 한도 | SES Sending Limits 증가 요청 |

#### 참고 자료
- AWS SES 공식 문서: https://docs.aws.amazon.com/ses/latest/dg/
- 반송 처리: https://docs.aws.amazon.com/ses/latest/dg/monitor-sending-activity.html

---
