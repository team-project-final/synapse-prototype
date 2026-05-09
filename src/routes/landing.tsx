import { Link } from 'react-router';
import { Button } from '@/components/ds';
import { SiteHeader } from '@/components/shared/SiteHeader';

export default function Landing() {
  return (
    <div className="min-h-dvh bg-stone-50">
      <SiteHeader />

      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <p className="text-sm text-[#D97706] font-medium uppercase tracking-wider mb-4">
          Synapse — 통합 학습-지식 그래프 SaaS
        </p>
        <h1 className="display text-5xl sm:text-6xl text-stone-900 leading-tight mb-6">
          노트를 쓰면 AI가 카드를 만들어주고,
          <br />
          <span className="text-[#D97706]">복습하면 노트가 다시 살아난다.</span>
        </h1>
        <p className="text-lg text-stone-600 max-w-2xl mx-auto mb-8">
          Obsidian의 PKM, Anki의 SRS, 그리고 LLM RAG를 한 워크플로우로. 기록한 모든 것이 살아있는
          지식 그래프가 됩니다.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/app">
            <Button size="lg">데모 시작하기 →</Button>
          </Link>
          <Link to="/architecture">
            <Button size="lg" variant="secondary">
              기술 문서
            </Button>
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <Feature
          title="PKM-SRS-AI 통합"
          desc="노트 작성과 카드 복습을 하나의 플랫폼에서. AI가 노트에서 자동으로 카드를 만들어줍니다."
          icon="📝"
        />
        <Feature
          title="지식 그래프"
          desc="위키링크 기반 양방향 링크로 개념 간 관계를 시각화. PageRank로 중요한 노트 자동 발견."
          icon="🕸️"
        />
        <Feature
          title="시맨틱 검색"
          desc="pgvector + Elasticsearch 하이브리드. 키워드를 넘어 의미로 검색하고 RAG로 답변까지."
          icon="🔍"
        />
      </section>

      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-500">
        <p>Synapse 팀 프로젝트 · 2026 · MIT License</p>
        <p className="mt-1">
          <a
            href="https://github.com/team-project-final/synapse-prototype"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#D97706]"
          >
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

function Feature({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <div className="space-y-2">
      <div className="text-4xl" aria-hidden="true">
        {icon}
      </div>
      <h3 className="display text-xl">{title}</h3>
      <p className="text-stone-600 text-sm">{desc}</p>
    </div>
  );
}
