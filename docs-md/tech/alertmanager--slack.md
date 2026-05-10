
#### 개요
Prometheus AlertManager는 Prometheus 알림을 수신하여 중복 제거, 그룹화, 라우팅, 억제를 수행하는 알림 관리 컴포넌트이다.

#### 역할 (Synapse 프로젝트 내)
- Prometheus 알림 규칙 발동 시 AlertManager로 전달
- 슬랙 채널별 라우팅: `#alert-critical` (P1), `#alert-warning` (P2), `#alert-info` (P3)
- 중복 제거: 동일 알림 5분 이내 재발 시 새 알림 억제 (그룹 간격 5분)
- 그룹화: 동일 서비스의 여러 알림을 하나의 슬랙 메시지로 묶음
- 에스컬레이션: P1 알림 15분 내 미확인 시 PagerDuty로 에스컬레이션
- Silence: 계획된 유지보수 시간 동안 알림 일시 억제

#### 선택 이유
- Prometheus와 네이티브 통합으로 추가 설정 최소화
- 복잡한 라우팅 규칙으로 팀별 알림 세분화 가능
- Slack Webhook 연동이 단순하여 빠른 구축 가능
- 오픈소스로 추가 비용 없음

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **AlertManager + Slack** | Prometheus 통합, 오픈소스, 유연한 라우팅 | YAML 설정 복잡 | **선택** |
| PagerDuty (단독) | 온콜 관리, 에스컬레이션 강력 | 비용 (P1 에스컬레이션 보완 도구로만 사용) | 보완 도구 |
| Opsgenie | PagerDuty 유사 기능 | 비용 | 미선택 |
| Grafana Alerting | Grafana 내장 | AlertManager 일부 기능 미지원 | 미선택 |

#### 설정 가이드

```yaml
# alertmanager.yml
global:
  slack_api_url: 'https://hooks.slack.com/services/T.../B.../xxx'
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'slack-warning'
  routes:
  - match:
      severity: critical
    receiver: 'slack-critical'

receivers:
- name: 'slack-critical'
  slack_configs:
  - channel: '#alert-critical'
    icon_emoji: ':fire:'
    title: '[P1] {{ .GroupLabels.alertname }}'
    text: |
      *서비스*: {{ .GroupLabels.service }}
      *내용*: {{ range .Alerts }}{{ .Annotations.description }}{{ end }}
    send_resolved: true

- name: 'slack-warning'
  slack_configs:
  - channel: '#alert-warning'
    icon_emoji: ':warning:'
    title: '[P2] {{ .GroupLabels.alertname }}'
    send_resolved: true

inhibit_rules:
- source_match:
    severity: 'critical'
  target_match:
    severity: 'warning'
  equal: ['service']

# Prometheus 알림 규칙
groups:
- name: synapse-slo
  rules:
  - alert: HighErrorRate
    expr: |
      rate(http_requests_total{status=~"5.."}[5m]) /
      rate(http_requests_total[5m]) > 0.05
    for: 2m
    labels:
      severity: critical
    annotations:
      description: "{{ $labels.service }} 에러율 {{ $value | humanizePercentage }} 초과"

  - alert: AIServiceHighLatency
    expr: |
      histogram_quantile(0.95,
        rate(http_request_duration_seconds_bucket{service="ai-service"}[5m])
      ) > 10
    for: 5m
    labels:
      severity: warning
    annotations:
      description: "AI Service p95 응답 시간 {{ $value }}초 초과 (임계값 10초)"
```

#### 트러블슈팅

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| 알림 미발송 | Slack Webhook URL 만료 | Slack App 관리에서 URL 재생성, ConfigMap 업데이트 |
| 알림 폭주 | 그룹화 미설정 | `group_by`, `group_wait` 튜닝 |
| 해소 알림 미수신 | `send_resolved: false` | `send_resolved: true` 설정 확인 |
| Inhibition 미작동 | `equal` 레이블 불일치 | 소스/타겟 알림 공통 레이블 확인 |

#### 참고 자료
- AlertManager 공식 문서: https://prometheus.io/docs/alerting/latest/alertmanager/
- Slack 연동: https://prometheus.io/docs/alerting/latest/configuration/#slack_config

---
