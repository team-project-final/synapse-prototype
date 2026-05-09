export interface DocMeta {
  slug: string;
  title: string;
  group: string;
  order: number;
}

export const DOCS: DocMeta[] = [
  { slug: '01_프로젝트_계획서', title: '01 프로젝트 계획서', group: '기획/설계', order: 1 },
  { slug: '02_ERD_문서', title: '02 ERD 문서', group: '기획/설계', order: 2 },
  { slug: '03_프로젝트_아키텍처_정의서', title: '03 프로젝트 아키텍처 정의서', group: '기획/설계', order: 3 },
  { slug: '04_API_명세서', title: '04 API 명세서', group: '기획/설계', order: 4 },
  { slug: '05_화면_흐름_시퀀스_다이어그램', title: '05 화면 흐름 시퀀스 다이어그램', group: '기획/설계', order: 5 },
  { slug: '06_화면_기능_정의서', title: '06 화면 기능 정의서', group: '기획/설계', order: 6 },
  { slug: '07_요구사항_정의서', title: '07 요구사항 정의서', group: '기획/설계', order: 7 },
  { slug: '08_스토리_보드', title: '08 스토리 보드', group: '기획/설계', order: 8 },
  { slug: '09_Git_규칙_정의서', title: '09 Git 규칙 정의서', group: '개발 규칙', order: 9 },
  { slug: '10_환경_설정_템플릿', title: '10 환경 설정 템플릿', group: '개발 규칙', order: 10 },
  { slug: '11_테스트_전략서', title: '11 테스트 전략서', group: '개발 규칙', order: 11 },
  { slug: '12_코드_리뷰_규칙', title: '12 코드 리뷰 규칙', group: '개발 규칙', order: 12 },
  { slug: '13_테스트_보고서', title: '13 테스트 보고서', group: '운영/배포', order: 13 },
  { slug: '14_배포_가이드', title: '14 배포 가이드', group: '운영/배포', order: 14 },
  { slug: '15_사용자_메뉴얼', title: '15 사용자 메뉴얼', group: '운영/배포', order: 15 },
  { slug: '16_운영_메뉴얼', title: '16 운영 메뉴얼', group: '운영/배포', order: 16 },
  { slug: '17_스케줄', title: '17 스케줄', group: '운영/배포', order: 17 },
  { slug: '18_기술_스택_정의서', title: '18 기술 스택 정의서', group: '운영/배포', order: 18 },
];

export function groupedDocs(): Array<{ group: string; docs: DocMeta[] }> {
  const map = new Map<string, DocMeta[]>();
  for (const d of DOCS) {
    if (!map.has(d.group)) map.set(d.group, []);
    map.get(d.group)!.push(d);
  }
  return Array.from(map.entries()).map(([group, docs]) => ({
    group,
    docs: docs.sort((a, b) => a.order - b.order),
  }));
}
