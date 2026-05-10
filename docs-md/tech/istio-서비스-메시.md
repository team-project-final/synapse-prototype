
#### 개요
Istio는 Kubernetes 환경에서 서비스 간 통신을 투명하게 제어하는 오픈소스 서비스 메시로, 사이드카 프록시(Envoy) 패턴을 사용한다.

#### 역할 (Synapse 프로젝트 내)
- **mTLS**: 모든 서비스 간 통신에 상호 TLS 인증 적용 (Zero Trust 내부 네트워크)
- **트래픽 관리**: 가중치 기반 라우팅, 카나리 배포 지원
- **내부 API 라우팅**: `POST /internal/decks/copy` (Community → Card Service) 는 Gateway를 우회하여 Istio mTLS로 직접 통신
- **Circuit Breaker**: Envoy 레벨 서킷 브레이커 (Resilience4j 보완)
- **관측성**: 서비스 간 트래픽 메트릭 수집 (Prometheus 연동)
- **Ingress Gateway**: 외부 트래픽의 클러스터 진입점 (ALB → Istio Ingress → 서비스)

#### 선택 이유
- 애플리케이션 코드 변경 없이 mTLS 적용 (사이드카 패턴)
- 서비스 간 통신 전체를 Envoy 프록시가 처리하여 일관된 보안 정책 적용
- Kiali 대시보드로 서비스 간 트래픽 흐름 시각화
- Jaeger와 자동 연동으로 분산 추적 구현

#### 대안 비교

| 기술 | 장점 | 단점 | 선택 여부 |
|------|------|------|-----------|
| **Istio** | 기능 완성도, Envoy 성능, 대규모 커뮤니티 | 복잡성, 리소스 오버헤드 | **선택** |
| Linkerd | 경량, 단순 | 기능 제한, Envoy 미사용 | 미선택 |
| Consul Connect | HashiCorp 통합 | K8s 통합 복잡 | 미선택 |
| mTLS 직접 구현 | 완전 제어 | 모든 서비스 코드 수정 필요 | 미선택 |
| 없음 (Kubernetes NetworkPolicy만) | 단순 | mTLS 없음, L7 정책 불가 | 미선택 |

#### 기술적 이점
- **Zero Trust**: 네임스페이스 내 모든 서비스 간 통신 암호화 (내부 네트워크 탈취 방어)
- **인증서 자동 갱신**: Istio CA가 서비스 인증서 자동 발급/갱신 (90일 주기)
- **카나리 배포**: `VirtualService` 가중치 설정으로 트래픽 5%씩 신버전 테스트
- **트래픽 미러링**: 프로덕션 트래픽 복사하여 새 버전 테스트 (사용자 영향 없음)

#### 설정 가이드

```yaml
# PeerAuthentication — 네임스페이스 전체 mTLS 강제
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: synapse-prod
spec:
  mtls:
    mode: STRICT   # 모든 서비스 간 mTLS 필수

---
# VirtualService — 내부 API 라우팅
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: card-service-internal
  namespace: synapse-prod
spec:
  hosts:
  - card-service
  http:
  - match:
    - uri:
        prefix: /internal/decks/copy
    route:
    - destination:
        host: card-service
        port:
          number: 8080
    headers:
      request:
        add:
          X-Internal-Call: "true"

---
# DestinationRule — Circuit Breaker
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: ai-service-circuit-breaker
spec:
  host: ai-service
  trafficPolicy:
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s
```

#### 트러블슈팅

| 문제 | 원인 | 해결 방법 |
|------|------|-----------|
| 서비스 간 503 오류 | mTLS 정책 불일치 | `istioctl analyze` 로 정책 충돌 진단 |
| 사이드카 미주입 | 네임스페이스 레이블 누락 | `kubectl label namespace synapse-prod istio-injection=enabled` |
| 높은 사이드카 메모리 | Envoy 캐시 과다 | Pilot 환경변수 `PILOT_ENABLE_CROSS_CLUSTER_WORKLOAD_ENTRY=false` |
| 추적 데이터 누락 | B3 헤더 미전파 | 애플리케이션 코드에서 `x-b3-traceid` 등 헤더 전파 확인 |

#### 참고 자료
- Istio 공식 문서: https://istio.io/latest/docs/
- mTLS 설정: https://istio.io/latest/docs/tasks/security/authentication/mtls-migration/

---
