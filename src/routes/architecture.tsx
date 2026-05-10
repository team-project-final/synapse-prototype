import { SiteHeader } from '@/components/shared/SiteHeader';
import { MermaidDiagram } from '@/components/shared/MermaidDiagram';
import { StepThroughDiagram } from '@/components/shared/StepThroughDiagram';

const SYSTEM_DIAGRAM = `graph TB
  CL[Flutter Web/Mobile] --> CF[Cloudflare CDN]
  CF --> GW[Spring Cloud Gateway 5]
  GW --> P[platform-svc]
  GW --> E[engagement-svc]
  GW --> K[knowledge-svc]
  GW --> L[learning-svc]
  P --> PG[(PostgreSQL 16<br/>+pgvector)]
  K --> PG
  L --> PG
  P --> RD[(Redis 7)]
  K --> ES[(Elasticsearch 8)]
  P --> KF[Kafka 3.x]
  E --> KF
  L --> OPENAI[OpenAI API]`;

const NOTE_FLOW_STEPS = [
  {
    title: '1. 사용자 노트 작성',
    description: '에디터에 마크다운 입력. [[과적합]] 형식의 위키링크 포함.',
    mermaid: 'sequenceDiagram\n  participant 사용자\n  participant Gateway\n  participant NoteService\n  사용자->>Gateway: POST /notes\n  Gateway->>NoteService: forward',
  },
  {
    title: '2. 위키링크 추출 + 백링크 갱신',
    description: '서버가 마크다운에서 [[…]]를 파싱하여 outgoingLinks를 추출.',
    mermaid: 'sequenceDiagram\n  participant NoteService\n  participant PostgreSQL\n  participant 사용자\n  NoteService->>PostgreSQL: INSERT note\n  NoteService->>PostgreSQL: INSERT note_links\n  NoteService-->>사용자: 201 Created',
  },
  {
    title: '3. 비동기 임베딩 + 인덱싱',
    description: 'Kafka로 note.created 이벤트 발행. AI Service가 임베딩 생성, ES가 인덱싱.',
    mermaid: 'sequenceDiagram\n  participant NoteService\n  participant Kafka\n  participant AIService\n  participant OpenAI\n  participant PostgreSQL\n  participant ES\n  NoteService->>Kafka: note.created\n  Kafka->>AIService: consume\n  AIService->>OpenAI: embed\n  AIService->>PostgreSQL: INSERT note_chunks\n  Kafka->>ES: consume\n  ES->>ES: nori 형태소 인덱싱',
  },
];

export default function Architecture() {
  return (
    <div className="min-h-dvh bg-stone-50">
      <SiteHeader />
      <article className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        <header>
          <h1 className="display text-4xl">시스템 아키텍처</h1>
          <p className="text-stone-600 mt-2">
            4-서비스 통합 (ADR-001 / ADR-002)
          </p>
        </header>

        <section>
          <h2 className="display text-2xl mb-3">전체 구조</h2>
          <p className="text-stone-700 mb-3">
            10개 마이크로서비스 원안을 4개 굵은 서비스(platform / engagement / knowledge /
            learning)로 통합. 각 서비스는 Spring Modulith 모듈 분리. AI는 learning-svc 안의 별도
            컨테이너(FastAPI).
          </p>
          <MermaidDiagram source={SYSTEM_DIAGRAM} />
        </section>

        <section>
          <h2 className="display text-2xl mb-3">노트 작성 시퀀스 (단계 재생)</h2>
          <p className="text-stone-700 mb-3">
            노트 작성 → 위키링크 자동 추출 → 비동기 임베딩까지의 흐름을 단계별로 따라가 보세요.
          </p>
          <StepThroughDiagram steps={NOTE_FLOW_STEPS} />
        </section>

        <section>
          <h2 className="display text-2xl mb-3">데이터 레이어</h2>
          <ul className="space-y-2 text-stone-700">
            <li>
              • <strong>PostgreSQL 16</strong> + pgvector — 트랜잭션 + 임베딩 저장
            </li>
            <li>
              • <strong>Redis 7 Cluster</strong> — 세션, 레이트 리밋, 시맨틱 캐시
            </li>
            <li>
              • <strong>Elasticsearch 8</strong> + nori — 한국어 전문 검색 + BM25
            </li>
            <li>
              • <strong>Kafka 3.x</strong> — 이벤트 스트리밍, CloudEvents 스펙
            </li>
            <li>
              • <strong>S3</strong> — 첨부파일 / 데이터 내보내기
            </li>
          </ul>
        </section>
      </article>
    </div>
  );
}
