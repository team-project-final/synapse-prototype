import { Link } from 'react-router';
import { SiteHeader } from '@/components/shared/SiteHeader';
import { Card } from '@/components/ds';

export default function About() {
  return (
    <div className="min-h-dvh bg-stone-50">
      <SiteHeader />
      <article className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <header>
          <h1 className="display text-4xl text-stone-900">프로젝트 소개</h1>
          <p className="text-stone-600 mt-2">Synapse — 통합 학습-지식 그래프 SaaS</p>
        </header>

        <section>
          <h2 className="display text-2xl mb-3">배경 및 문제 정의</h2>
          <p className="text-stone-700 leading-relaxed mb-3">
            기존의 PKM 도구(Obsidian, Notion)는 자유로운 노트 작성에 강하지만 복습 메커니즘이
            부재합니다. 반대로 SRS 도구(Anki, Quizlet)는 과학적 반복 학습 알고리즘을 갖추었지만
            카드는 맥락이 없는 단편입니다. Synapse는 이 둘을 하나의 워크플로우로 통합하고, AI로
            카드 생성 부담을 없앱니다.
          </p>
        </section>

        <section>
          <h2 className="display text-2xl mb-3">핵심 목표</h2>
          <Card>
            <table className="w-full text-sm">
              <thead className="text-left text-stone-500">
                <tr>
                  <th className="pb-2">목표</th>
                  <th className="pb-2">측정</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                <tr>
                  <td className="py-2">PKM-SRS 통합</td>
                  <td>노트→카드 전환율 60%+</td>
                </tr>
                <tr>
                  <td className="py-2">AI 카드 자동 생성</td>
                  <td>카드 생성 시간 90% 단축</td>
                </tr>
                <tr>
                  <td className="py-2">지식 그래프</td>
                  <td>그래프 탐색 DAU 30%+</td>
                </tr>
                <tr>
                  <td className="py-2">시맨틱 검색</td>
                  <td>MRR@10 0.7+</td>
                </tr>
                <tr>
                  <td className="py-2">크로스 플랫폼</td>
                  <td>Web/iOS/Android 동시 출시</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </section>

        <section>
          <h2 className="display text-2xl mb-3">대상 사용자 (페르소나)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                name: '개발자 김시냅스 (28세)',
                role: '주니어 개발자',
                need: '기술 블로그 정리 + 핵심 개념 반복 학습',
              },
              {
                name: '대학원생 이연구 (26세)',
                role: 'NLP 석사과정',
                need: '논문 핵심 개념 암기 + 연구 아이디어 연결',
              },
              {
                name: '자격증 준비자 박합격 (32세)',
                role: 'SI 인프라 엔지니어',
                need: 'AWS SAA 개념 정리 + 출퇴근 모바일 복습',
              },
              {
                name: '스터디 그룹 멤버',
                role: '학습 커뮤니티 참여자',
                need: '학습 자료 공유 + 그룹 동기 부여',
              },
            ].map((p) => (
              <Card key={p.name}>
                <h3 className="display text-lg">{p.name}</h3>
                <p className="text-xs text-stone-500">{p.role}</p>
                <p className="text-sm text-stone-700 mt-2">{p.need}</p>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="display text-2xl mb-3">비즈니스 모델 — Freemium</h2>
          <Card>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-stone-500">
                  <th className="pb-2">플랜</th>
                  <th className="pb-2">가격</th>
                  <th className="pb-2">노트</th>
                  <th className="pb-2">AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                <tr>
                  <td className="py-2">Free</td>
                  <td>$0</td>
                  <td>100</td>
                  <td>50회/월</td>
                </tr>
                <tr>
                  <td className="py-2">Pro</td>
                  <td>$9.99/월</td>
                  <td>무제한</td>
                  <td>500회/월</td>
                </tr>
                <tr>
                  <td className="py-2">Team</td>
                  <td>$19.99/seat/월</td>
                  <td>무제한</td>
                  <td>1000회/월</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </section>

        <section className="text-center pt-4">
          <Link to="/architecture" className="text-[#D97706] hover:underline">
            → 시스템 아키텍처 보기
          </Link>
        </section>
      </article>
    </div>
  );
}
