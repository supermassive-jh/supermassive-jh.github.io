[지난 글](/post/spring-nextjs-bff-backend)에서 Spring을 순수 JSON API 서버로 바꿨다. 이제 이 API들을 Next.js가 어떻게 호출하고, `JSESSIONID`를 어떻게 브라우저와 Spring 사이에서 중계하는지를 정리한다.

## API 클라이언트

```ts
// src/lib/server.ts
import axios from "axios"

export const serverApi = axios.create({
  baseURL: process.env.API_SERVER_URL,
})
```

`.env.local`에 `API_SERVER_URL=http://localhost:8080`을 설정했다. `NEXT_PUBLIC_` 접두사가 없어서 서버에서만 읽히고 브라우저 번들에는 노출되지 않는다.

`fetch` 대신 axios를 쓴 이유가 있다. Node.js 런타임의 axios는 응답의 raw `Set-Cookie` 헤더 배열을 그대로 노출해준다. 브라우저의 `fetch`는 보안상 이게 막혀 있다. Spring이 발급한 `JSESSIONID`를 추출하려면 axios가 필요했다.

## 로그인 — Server Action

```tsx
// src/app/login/page.tsx
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { serverApi } from "@/lib/server"

async function login(formData: FormData) {
  "use server"

  const name = formData.get("name")
  const password = formData.get("password")

  const response = await serverApi.post(
    "/api/auth/login",
    { name, password },
    { validateStatus: () => true },
  )

  if (response.status !== 200) {
    redirect("/login?error=1")
  }

  const setCookieHeader = response.headers["set-cookie"]
  const raw = setCookieHeader?.[0] ?? ""
  const match = raw.match(/JSESSIONID=([^;]+)/)
  const sessionId = match?.[1]

  if (sessionId) {
    const cookieStore = await cookies()
    cookieStore.set("JSESSIONID", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    })
  }

  redirect("/member")
}

export default function LoginPage() {
  return (
    <form action={login}>
      <input type="text" name="name" placeholder="이름" />
      <input type="password" name="password" placeholder="비밀번호" />
      <button type="submit">로그인</button>
    </form>
  )
}
```

`<form action={login}>`처럼 함수를 그대로 넘기면 Server Action이 된다. 브라우저에서 별도 fetch 코드를 짜지 않아도 폼 제출만으로 서버 함수가 실행된다.

`validateStatus: () => true`는 axios 기본 동작을 오버라이드하는 옵션이다. axios 기본값은 비2xx 응답을 예외로 던지는데, 401 같은 응답도 "정상적으로 처리해야 할 결과"로 다루고 싶어서 전부 성공으로 간주하도록 바꿨다. 이 옵션이 없으면 `try/catch` + `error.response.status`로 처리해야 해서 코드가 번거로워진다.

그다음 `Set-Cookie` 원본 헤더에서 정규식으로 `JSESSIONID` 값만 뽑아, Next.js 자체 쿠키로 재발급한다. `httpOnly: true`로 브라우저 JS(`document.cookie`)가 이 쿠키를 못 읽게 막아서 XSS로부터 세션을 보호했다.

`redirect()`는 내부적으로 예외를 던지는 방식으로 동작해서, 호출 이후 코드는 실행되지 않는다. 그리고 `await cookies()` — Next.js 15부터 `cookies()`가 비동기 API로 바뀌어서 `await`가 필수다(Next 16인 이 프로젝트도 동일).

## 로그인 유지 — 보호된 페이지

```tsx
// src/app/member/page.tsx
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { serverApi } from "@/lib/server"

export const dynamic = "force-dynamic"

async function logout() {
  "use server"

  const cookieStore = await cookies()
  const sessionId = cookieStore.get("JSESSIONID")?.value

  if (sessionId) {
    await serverApi.post(
      "/api/auth/logout",
      {},
      {
        headers: { Cookie: `JSESSIONID=${sessionId}` },
        validateStatus: () => true,
      },
    )
  }

  cookieStore.delete("JSESSIONID")
  redirect("/login")
}

export default async function MemberPage() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("JSESSIONID")?.value

  if (!sessionId) {
    redirect("/login")
  }

  const response = await serverApi.get("/api/auth/me", {
    headers: { Cookie: `JSESSIONID=${sessionId}` },
    validateStatus: () => true,
  })

  if (response.status !== 200) {
    redirect("/login")
  }

  return (
    <div>
      <p>환영합니다, {response.data.name}님!</p>
      <form action={logout}>
        <button type="submit">로그아웃</button>
      </form>
    </div>
  )
}
```

`export const dynamic = "force-dynamic"`부터 짚어야 한다. 이 페이지는 요청마다(쿠키 값에 따라) 다른 결과가 나와야 하는데, Next.js는 기본적으로 페이지를 정적으로 캐싱하려 든다. 이걸 명시적으로 꺼두지 않으면 특정 사용자에게 캐싱된 결과가 다른 사용자에게도 노출될 위험이 있다.

쿠키 자체가 없으면 API 호출도 없이 바로 `/login`으로 보낸다. Next.js 서버가 Spring을 호출할 때는 브라우저 쿠키가 자동으로 실리지 않으니, `Cookie` 헤더에 수동으로 담아 보내야 한다는 것도 여기서 반복되는 패턴이다.

**실제로 겪었던 버그**: `logout()`에서 쿠키 이름을 `"sessionId"`처럼 오타 낸 적이 있었다(정확히는 `"JSESSIONID"`가 아니었다). 그러면 `sessionId` 변수가 항상 `undefined`가 되어서 `if (sessionId)` 블록, 즉 `/api/auth/logout` 호출 자체가 스킵된다. 브라우저 쿠키만 지워지고 **Spring 서버 세션은 안 죽는** 상태로 남는 버그였다. 화면상으로는 로그인 페이지로 튕기니 정상처럼 보이지만, 그 `JSESSIONID` 값이 어딘가 유출되면 세션 만료 전까지는 여전히 유효한 상태라 위험하다. 로그아웃 전/후로 curl에서 `/api/auth/me` 응답(200 → 403)을 비교해서 서버 세션이 실제로 죽었는지 검증하는 습관이 필요하다는 걸 이때 배웠다.

## 관리자 페이지

```tsx
// src/app/admin/page.tsx
export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("JSESSIONID")?.value

  if (!sessionId) {
    redirect("/login")
  }

  const response = await serverApi.get("/api/admin", {
    headers: { Cookie: `JSESSIONID=${sessionId}` },
    validateStatus: () => true,
  })

  if (response.status !== 200) {
    redirect("/member")
  }

  const members = response.data as { id: number; name: string; role: string }[]

  return (
    <div>
      <h1>회원 목록</h1>
      <ul>
        {members.map((m) => (
          <li key={m.id}>
            {m.name} ({m.role})
          </li>
        ))}
      </ul>
    </div>
  )
}
```

여기서 하나 애매했던 부분이 있다. Spring은 "완전 비로그인"과 "로그인은 했지만 권한 부족"을 둘 다 403으로 응답한다(커스텀 진입점이 없어서 401/403이 구분되지 않는다). 그래서 Next.js 쪽에서 쿠키 자체가 없으면 `/login`으로, 쿠키는 있는데 호출이 실패하면 일단 `/member`로 보내는 식으로 나눠서 처리했다. `/member`에서 세션이 진짜 만료된 거라면 그쪽에서 또 한 번 걸러서 `/login`으로 보내는, 이중 안전장치 구조가 됐다.

## 회원가입

```tsx
// src/app/join/page.tsx
async function join(formData: FormData) {
  "use server"

  const name = formData.get("name")
  const password = formData.get("password")
  const role = formData.get("role")

  const response = await serverApi.post(
    "/api/join",
    { name, password, role },
    { validateStatus: () => true },
  )

  if (response.status !== 201) {
    redirect("/join?error=1")
  }

  redirect("/login")
}

export default function JoinPage() {
  return (
    <form action={join}>
      <select name="role" defaultValue="user">
        <option value="user">user</option>
        <option value="admin">admin</option>
      </select>
      <input type="text" name="name" placeholder="이름" />
      <input type="password" name="password" placeholder="비밀번호" />
      <button type="submit">회원가입</button>
    </form>
  )
}
```

회원가입은 세션을 만들지 않으므로(로그인이 아니니까) 쿠키 처리 코드가 없다. `/api/join`은 성공해도 `Set-Cookie`를 내려주지 않는다. 성공(201) 시에는 `/member`가 아니라 `/login`으로 보내서, 사용자가 직접 로그인하도록 유도했다.

다음 글에서는 이 구조를 curl과 브라우저로 검증하면서 나온 트러블슈팅과, 아직 남은 TODO들을 정리한다.
