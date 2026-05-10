import { Link } from 'react-router';

export function TechHero({ techCount }: { techCount: number }) {
  return (
    <header className="space-y-2">
      <h1 className="display text-4xl text-stone-900">기술 스택</h1>
      <p className="text-stone-600">
        Synapse를 구성하는 {techCount}개 기술 — 레이어별 구성과 선정 기준.{' '}
        <Link
          to="/docs/18_기술_스택_정의서"
          className="text-[#D97706] hover:text-[#B45309] underline"
        >
          출처: 위키 18. 기술 스택 정의서 →
        </Link>
      </p>
    </header>
  );
}
