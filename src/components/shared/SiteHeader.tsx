import { Link } from 'react-router';

export function SiteHeader() {
  return (
    <header className="border-b border-stone-200 bg-stone-50/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="display text-xl text-stone-900">
          Synapse
        </Link>
        <nav className="hidden sm:flex items-center gap-4 text-sm">
          <Link to="/app" className="text-stone-700 hover:text-[#D97706]">
            데모
          </Link>
          <Link to="/about" className="text-stone-700 hover:text-[#D97706]">
            프로젝트
          </Link>
          <Link to="/architecture" className="text-stone-700 hover:text-[#D97706]">
            아키텍처
          </Link>
          <Link to="/tech" className="text-stone-700 hover:text-[#D97706]">
            기술 스택
          </Link>
          <Link to="/docs" className="text-stone-700 hover:text-[#D97706]">
            문서
          </Link>
          <a
            href="https://github.com/team-project-final/synapse-prototype"
            target="_blank"
            rel="noreferrer"
            className="text-stone-700 hover:text-[#D97706]"
          >
            GitHub
          </a>
        </nav>
        <Link
          to="/app"
          className="sm:hidden rounded-md bg-[#D97706] px-3 py-1.5 text-xs font-medium text-white"
        >
          데모 →
        </Link>
      </div>
    </header>
  );
}
