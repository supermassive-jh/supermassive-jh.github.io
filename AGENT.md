# supermassive-log

개인 기술 블로그. GitHub Pages(`supermassive-jh.github.io`, user page)에 정적 사이트로 배포된다.

## 스택

- Vite 8 + React 19 (React Compiler 적용) + TypeScript
- Tailwind CSS v4 + `@tailwindcss/typography` + shadcn/ui (`radix-ui` 기반 컴포넌트)
- `react-router-dom` (BrowserRouter)
- `react-markdown` + `remark-gfm` + `react-syntax-highlighter`(Prism)
- 폰트: Pretendard 자체 호스팅(`public/fonts`), `@font-face`로 등록

## 저장소 구조

실제 git 저장소는 `D:\github-pages\my-app` (하위 디렉토리). 브랜치 3개:

- `main` — 배포 버전 소스 루트
- `dev` — 개발 버전 소스 루트 (필요할 때 `main`을 fetch/merge)
- `gh-pages` — 빌드 산출물(`dist/`)만 들어가는 배포 전용 브랜치. `pnpm run deploy`(내부적으로 `gh-pages -d dist`)로 로컬에서 직접 push. GitHub Actions는 안 씀 — 로컬 git 인증을 그대로 활용

GitHub Pages 설정: Settings → Pages → Source: Deploy from a branch → `gh-pages` / `(root)`. Free 플랜이라 저장소는 public이어야 함.

## 디렉토리

```
my-app/
  docs/                 # 블로그 글 원문 (마크다운)
  public/
    fonts/              # Pretendard 등
    404.html            # GitHub Pages SPA 라우팅 트릭
    robots.txt
  src/
    App.tsx             # BrowserRouter + 라우트 정의
    Providers.tsx        # ThemeProvider/TooltipProvider/SidebarProvider
    data/posts.ts        # 글 메타데이터 (제목/슬러그/날짜/카테고리/태그)
    lib/content.ts        # docs/*.md를 빌드 타임에 로드 (import.meta.glob)
    lib/site.ts           # siteUrl/siteName 등 사이트 상수
    layout/RootLayout.tsx # 사이드바+헤더 shell, 카테고리/검색 상태 보관
    layout/AppSidebar.tsx # 카테고리 필터 사이드바
    pages/BoardPage.tsx    # 글 목록
    pages/PostPage.tsx     # 글 상세 (마크다운 렌더링 + SEO 메타)
    components/code-block.tsx   # 코드블록 syntax highlight + 복사 버튼
    components/theme-provider.tsx / mode-toggle.tsx  # 다크/라이트 모드
    hooks/use-document-meta.ts  # 페이지별 title/description/canonical
    hooks/use-system-dark.ts    # OS 다크모드 감지
  vite.config.ts          # sitemap.xml 빌드 플러그인 포함
```

## 주요 아키텍처 결정

- **라우팅은 `BrowserRouter`.** 원래 `HashRouter`(`/#/post/...`)였다가 SEO 때문에 교체했음. GitHub Pages는 서버 rewrite가 안 되므로, `public/404.html`이 없는 경로 요청을 받으면 원래 경로를 쿼리스트링으로 인코딩해 `index.html`로 리다이렉트하고, `index.html`의 스크립트가 그걸 복원해 React Router가 정상 처리하게 함 ([rafgraph/spa-github-pages](https://github.com/rafgraph/spa-github-pages) 방식).
- **글 콘텐츠는 `docs/*.md` + `posts.ts` 이원화.** 마크다운 원문은 `docs/`, 메타데이터(제목/날짜/카테고리/태그)는 `src/data/posts.ts`. 새 글을 추가하는 구체적인 규칙은 [CLAUDE.md](CLAUDE.md) 참고.
- **목록은 최신순 정렬.** `BoardPage.tsx`에서 `date` 내림차순 + 같은 날짜는 배열에서 더 뒤에 있는(=나중에 추가한) 글이 위로 오도록 인덱스 tiebreak.
- **SEO**: `useDocumentMeta` 훅이 라우트별로 title/description/OG/canonical을 갱신. `vite.config.ts`의 `sitemapPlugin`이 `posts.ts`를 읽어 빌드 시 `dist/sitemap.xml`을 자동 생성 (글 추가 시 수동 갱신 불필요). 단, 이 사이트는 SSR이 없어서 JS를 실행하지 않는 크롤러/링크 미리보기 봇에는 `index.html`의 정적 fallback 메타만 보인다는 한계가 있음.
- **다크/라이트 모드**: `ThemeProvider`가 `localStorage` + `useSystemDark`(OS 설정)로 `light`/`dark`/`system` 관리, `<html>`에 `.light`/`.dark` 클래스 토글.

## 명령어

```bash
pnpm dev            # 개발 서버
pnpm build          # 타입체크 + 빌드 (dist/, sitemap.xml 포함)
pnpm format         # prettier --write
pnpm format:check
pnpm lint           # oxlint
pnpm run deploy     # dist/ 를 gh-pages 브랜치로 push
```
