export interface Post {
  title: string
  excerpt: string
  date: string
  category: string
  tags: string[]
}

export const posts: Post[] = [
  {
    title: "GitHub Pages에 gh-pages 브랜치로 배포하기",
    excerpt:
      "GitHub Actions 없이, gh-pages 패키지 하나로 로컬에서 build → deploy를 끝내는 구성을 정리했다.",
    date: "2026.07.21",
    category: "배포",
    tags: ["배포", "GitHub"],
  },
  {
    title: "정적 사이트에서 시크릿 키 없이 API 연동하기",
    excerpt:
      "public 저장소라서 못 하는 게 아니라, 서버가 없어서 못 하는 것이었다 — anon key와 진짜 시크릿의 차이.",
    date: "2026.07.21",
    category: "아키텍처",
    tags: ["아키텍처"],
  },
  {
    title: "tsconfig baseUrl deprecation 대응기",
    excerpt:
      "경고를 끄는 옵션 대신, 왜 이제 baseUrl 없이도 paths가 동작하는지 확인하고 지웠다.",
    date: "2026.07.20",
    category: "TypeScript",
    tags: ["TypeScript"],
  },
  {
    title: "Vite + React 19 프로젝트 세팅 회고",
    excerpt:
      "React Compiler, Tailwind v4, shadcn까지 붙이고 나서 남긴 초기 세팅 메모.",
    date: "2026.07.18",
    category: "React",
    tags: ["React", "Vite"],
  },
  {
    title: "블로그 데이터, DB 없이 마크다운으로 관리하기",
    excerpt:
      "글 쓰는 사람이 나 하나뿐이라면, 결국 레포에 마크다운 파일 쌓는 게 제일 빠르다.",
    date: "2026.07.17",
    category: "아키텍처",
    tags: ["아키텍처", "블로그"],
  },
  {
    title: "Google Analytics만 붙이고 조회수는 포기한 이유",
    excerpt:
      "공개 카운터는 필요 없었다. 나만 보면 되는 숫자는 GA 하나로 충분하다.",
    date: "2026.07.16",
    category: "배포",
    tags: ["배포", "분석"],
  },
]
