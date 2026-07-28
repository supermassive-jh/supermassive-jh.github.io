export interface Post {
  slug: string
  title: string
  excerpt: string
  date: string
  category: string
  tags: string[]
}

export const posts: Post[] = [
  {
    slug: "closure-and-memory-leaks",
    title: "상태관리 원리 파헤치기 (1). 클로저와 메모리 누수, 그리고 GC",
    excerpt:
      "useEffect cleanup을 깜빡했다가 파고든 클로저/GC 원리 — 문제는 항상 추가는 있는데 제거가 없는 패턴이었다.",
    date: "2026.07.24",
    category: "JS",
    tags: ["JS", "메모리"],
  },
  {
    slug: "class-alternatives-in-js",
    title:
      "상태관리 원리 파헤치기 (2). class 없이도 되는 이유 — 모듈 스코프와 팩토리 함수",
    excerpt:
      "class가 하던 두 가지 역할(캡슐화, 인스턴스 제어)을 모듈 스코프 싱글톤과 팩토리 함수가 어떻게 나눠 가졌는지.",
    date: "2026.07.25",
    category: "JS",
    tags: ["JS", "디자인패턴"],
  },
  {
    slug: "observer-pattern-and-react-rerender",
    title:
      "상태관리 원리 파헤치기 (3). 옵저버 패턴으로 보는 React 리렌더링 원리",
    excerpt:
      "순수 JS store를 만들어 React에 수동으로 연결해보며 확인한, useState가 특별한 진짜 이유.",
    date: "2026.07.26",
    category: "React",
    tags: ["React", "상태관리"],
  },
  {
    slug: "state-management-library-comparison",
    title:
      "상태관리 원리 파헤치기 (4). Redux/Zustand/Recoil/Jotai, 결국 같은 문제를 푸는가",
    excerpt:
      "네 라이브러리 모두 같은 공식을 풀고 있다는 걸 확인하고, 최신 다운로드/스타 수치까지 다시 찾아봤다.",
    date: "2026.07.27",
    category: "아키텍처",
    tags: ["아키텍처", "상태관리"],
  },
  {
    slug: "spring-session-auth-basics",
    title:
      "세션 인증에서 Next.js BFF까지 (1). Spring Security로 세션 기반 로그인 만들기",
    excerpt:
      "엔티티, 레포지토리, 서비스, UserDetailsService까지 — Thymeleaf 회원가입/로그인의 데이터 계층을 손으로 짜며 걸린 것들.",
    date: "2026.07.28",
    category: "Spring",
    tags: ["Spring", "Security"],
  },
  {
    slug: "spring-security-config-and-login",
    title:
      "세션 인증에서 Next.js BFF까지 (2). Spring Security 설정과 로그인/로그아웃 붙이기",
    excerpt:
      "SecurityConfig 인가 규칙부터 PRG 패턴, 템플릿 버그 두 가지까지 — 로그인 폼을 실제로 동작시키기까지.",
    date: "2026.07.28",
    category: "Spring",
    tags: ["Spring", "Security"],
  },
  {
    slug: "spring-nextjs-bff-backend",
    title:
      "세션 인증에서 Next.js BFF까지 (3). 세션 로그인을 Next.js BFF로 옮기기 — 왜 JWT가 아니었나",
    excerpt:
      "화면은 Next.js, 인증은 그대로 세션. Spring을 순수 JSON API 서버로 바꾸며 정리한 이유와 코드.",
    date: "2026.07.28",
    category: "Spring",
    tags: ["Spring", "Next.js"],
  },
  {
    slug: "nextjs-bff-frontend",
    title:
      "세션 인증에서 Next.js BFF까지 (4). Next.js Server Action으로 세션 쿠키 중계하기",
    excerpt:
      "axios로 Set-Cookie를 직접 파싱해 JSESSIONID를 재발급하고, 매 요청마다 Cookie 헤더로 실어 보내는 BFF 패턴.",
    date: "2026.07.28",
    category: "Next.js",
    tags: ["Next.js", "BFF"],
  },
  {
    slug: "bff-troubleshooting-and-todo",
    title:
      "세션 인증에서 Next.js BFF까지 (5). BFF 구조 트러블슈팅 — curl로 검증하고 놓쳤던 버그들",
    excerpt:
      "화면만 보고 로그아웃 성공이라 믿으면 안 되는 이유. curl/브라우저 검증 순서와 남은 TODO 정리.",
    date: "2026.07.28",
    category: "Next.js",
    tags: ["BFF", "트러블슈팅"],
  },
]
