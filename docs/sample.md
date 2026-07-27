# GitHub Pages에 gh-pages 브랜치로 배포하기

GitHub Actions 없이, `gh-pages` 패키지 하나로 로컬에서 build → deploy를 끝내는 구성을 정리한다.

## 왜 GitHub Actions를 안 썼나

자동 배포를 하려면 결국 `.github/workflows/*.yml` 파일이 있어야 한다. 그런데 인증까지 신경 쓰려면(`GITHUB_TOKEN`을 remote URL에 심는 절차) 오히려 로컬에 이미 되어 있는 브라우저 기반 git 인증을 그대로 쓰는 쪽이 더 간단했다.

## 설치

```bash
pnpm add -D gh-pages
```

## package.json에 스크립트 추가

```json
{
  "scripts": {
    "deploy": "gh-pages -d dist"
  }
}
```

`-b` 옵션을 생략하면 기본 대상 브랜치는 `gh-pages`다.

## 배포

```bash
pnpm run build
pnpm run deploy
```

- `pnpm run build` — `dist/`에 정적 파일 생성
- `pnpm run deploy` — 로컬 git 인증을 그대로 사용해 `dist/` 내용을 `gh-pages` 브랜치로 push. 브랜치가 없으면 최초 실행 시 자동 생성된다

## 마지막으로 GitHub 저장소 설정

Settings → Pages에서 Source를 **Deploy from a branch**, Branch를 **gh-pages** / **(root)**로 지정하면 끝이다.

> 참고로 이 프로젝트는 GitHub Free 플랜이라 저장소가 public이어야 Pages를 쓸 수 있다. Pro 플랜부터는 private 저장소에서도 가능하지만, 게시된 사이트 자체는 어차피 공개된다.
