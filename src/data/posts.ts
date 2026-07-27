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
    title: "클로저와 메모리 누수, 그리고 GC",
    excerpt:
      "useEffect cleanup을 깜빡했다가 파고든 클로저/GC 원리 — 문제는 항상 추가는 있는데 제거가 없는 패턴이었다.",
    date: "2026.07.24",
    category: "JS",
    tags: ["JS", "메모리"],
  },
  {
    slug: "class-alternatives-in-js",
    title: "class 없이도 되는 이유 — 모듈 스코프와 팩토리 함수",
    excerpt:
      "class가 하던 두 가지 역할(캡슐화, 인스턴스 제어)을 모듈 스코프 싱글톤과 팩토리 함수가 어떻게 나눠 가졌는지.",
    date: "2026.07.25",
    category: "JS",
    tags: ["JS", "디자인패턴"],
  },
  {
    slug: "observer-pattern-and-react-rerender",
    title: "옵저버 패턴으로 보는 React 리렌더링 원리",
    excerpt:
      "순수 JS store를 만들어 React에 수동으로 연결해보며 확인한, useState가 특별한 진짜 이유.",
    date: "2026.07.26",
    category: "React",
    tags: ["React", "상태관리"],
  },
  {
    slug: "state-management-library-comparison",
    title: "Redux/Zustand/Recoil/Jotai, 결국 같은 문제를 푸는가",
    excerpt:
      "네 라이브러리 모두 같은 공식을 풀고 있다는 걸 확인하고, 최신 다운로드/스타 수치까지 다시 찾아봤다.",
    date: "2026.07.27",
    category: "아키텍처",
    tags: ["아키텍처", "상태관리"],
  },
]
