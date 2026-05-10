
#### 개요
Fluent Bit는 경량 로그 수집 에이전트로, Kubernetes 파드의 로그를 수집하여 AWS CloudWatch Logs 또는 Grafana Loki로 전송한다.

#### 역할 (Synapse 프로젝트 내)
- K8s 각 노드에 DaemonSet으로 배포, 모든 파드 로그 자동 수집
- 구조화 로그(JSON) 파싱 및 필드 추출 (service, level, traceId, tenantId)
- CloudWatch Logs 전송: AWS 네이티브 통합, 장기 보존 (INFO 30일, ERROR 90일, AUDIT 1년)
- Grafana Loki 동시 전송: Grafana 대시보드에서 메트릭-로그 연동 조회
- 민감 정보 필터링: `password`, `token`, `api_key` 필드 마스킹 후 전송

#### 선택 이유
- Fluentd 대비 메모리 사용량 1/5 수준 (경량 DaemonSet에 적합)
- CloudWatch Logs와 네이티브 통합 (IAM 역할 기반, 별도 자격증명 불필요)
- Loki 연동으로 Grafana에서 메트릭-로그 동시 조회 가능
- Kubernetes 메타데이터(네임스페이스, 파드명) 자동 주입

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **Fluent Bit + CloudWatch/Loki** | 경량, AWS 통합, Grafana 연동 | 설정 복잡도 | **선택** |
| Fluentd | 플러그인 풍부 | 메모리 사용량 높음 | 미선택 |
| Logstash + ES | ELK 완성도 | 리소스 과다, 비용 | 미선택 |
| Vector | 고성능, Rust 기반 | 상대적으로 신생 | 미선택 |
| DataDog Logs | SaaS, 검색 강력 | 비용 극대화 | 미선택 |

#### 설정 가이드

```yaml
# fluent-bit-configmap.yaml 핵심
[INPUT]
    Name              tail
    Tag               kube.*
    Path              /var/log/containers/*.log
    Parser            docker
    Mem_Buf_Limit     50MB

[FILTER]
    Name                kubernetes
    Match               kube.*
    Merge_Log           on
    K8S-Logging.Parser  on

[FILTER]
    Name   modify
    Match  kube.*
    Set    password [REDACTED]
    Set    api_key  [REDACTED]

[OUTPUT]
    Name               cloudwatch_logs
    Match              kube.*
    region             ap-northeast-2
    log_group_name     /synapse/k8s
    log_stream_prefix  pod/
    auto_create_group  true

[OUTPUT]
    Name          loki
    Match         kube.*
    Host          loki.monitoring.svc.cluster.local
    Port          3100
    Labels        job=fluentbit,ns=$kubernetes['namespace_name']
```

#### 프로젝트 내 사용 위치
- **logging 네임스페이스**: Fluent Bit DaemonSet, Loki StatefulSet
- **모든 서비스**: 구조화 JSON 로그 출력 (logback-spring.xml / uvicorn JSON logging)

#### 트러블슈팅

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| 로그 수집 누락 | 노드 DaemonSet 미기동 | `kubectl get ds fluent-bit -n logging` 확인 |
| CloudWatch 전송 실패 | IAM 권한 부족 | 노드 역할에 `logs:PutLogEvents` 등 권한 추가 |
| 로그 파싱 오류 | JSON 형식 불일치 | `fluent-bit --dry-run` 으로 파서 테스트 |
| 버퍼 오버플로 | 로그 폭증 | `Mem_Buf_Limit` 증가, 샘플링 필터 추가 |

#### 참고 자료
- Fluent Bit 공식 문서: https://docs.fluentbit.io/
- CloudWatch 플러그인: https://docs.fluentbit.io/manual/pipeline/outputs/cloudwatch
- Loki 연동: https://docs.fluentbit.io/manual/pipeline/outputs/loki

---
