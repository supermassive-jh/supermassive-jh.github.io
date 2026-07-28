[지난 글](/post/spring-session-auth-basics)에서 엔티티/레포지토리/서비스/`UserDetailsService`까지 만들었다. 이번엔 이걸 실제로 로그인 폼과 연결하고, 접근 제어와 로그아웃까지 붙여서 흐름을 완성한다.

## SecurityConfig

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.httpBasic(basic -> basic.disable())
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/", "/join", "/login").permitAll()
                    .requestMatchers("/admin").hasRole("ADMIN")
                    .anyRequest().authenticated())
            .formLogin(form -> form
                    .loginPage("/login")
                    .loginProcessingUrl("/login")
                    .usernameParameter("name")
                    .passwordParameter("password")
                    .defaultSuccessUrl("/member", true)
                    .permitAll());
    return http.build();
}

@Bean
public BCryptPasswordEncoder bCryptPasswordEncoder() {
    return new BCryptPasswordEncoder();
}
```

하나씩 뜯어보면:

- `csrf().disable()` — 폼에 CSRF 토큰 필드가 없어서 꺼뒀다. Thymeleaf의 `th:action` 폼은 자동으로 토큰 필드를 넣어주니, 켜고 싶으면 폼 수정 없이 그냥 켜도 된다. 연습 단계라 꺼둔 채로 뒀지만, 실서비스라면 반드시 켜야 하는 항목이다.
- `httpBasic().disable()` — 세션 기반 `formLogin`만 쓰니 불필요한 인증 방식이라 꺼뒀다. `httpBasic`은 매 요청 헤더로 인증하는 stateless 방식이라 애초에 목적이 다르다.
- `usernameParameter("name")` / `passwordParameter("password")` — 폼 필드명이 Security 기본값(`username`)과 달라서 명시적으로 맞췄다.
- `formLogin(...).permitAll()` — 로그인 페이지와 처리 URL 자체는 인증 없이 접근 가능해야 한다. 안 그러면 "로그인 페이지로 가라 → 로그인 페이지도 인증이 필요하다"는 무한 루프가 생긴다.

## 컨트롤러

```java
@GetMapping("/join")
public String join() { return "join"; }

@PostMapping("/join")
public String doJoin(Member member) {
    boolean success = memberService.join(member);
    if (!success) return "redirect:/join?error";
    return "redirect:/";
}

@GetMapping("/login")
public String login() { return "login"; }
```

POST 처리 뒤에 뷰를 직접 리턴하지 않고 `redirect:...`로 리다이렉트하는 건 PRG(Post-Redirect-Get) 패턴이다. 새로고침 시 폼이 중복 제출되는 걸 막아준다.

`/login`의 POST는 Security의 `loginProcessingUrl`이 필터 단계에서 먼저 가로채기 때문에, 컨트롤러에 별도 POST 핸들러를 두면 안 된다. 두면 죽은 코드가 되거나 혼란만 생긴다.

로그인 여부 판단은 이렇게 했다.

```java
@GetMapping("/")
public String main(Authentication authentication, Model model) {
    boolean isLoggedIn = authentication != null
            && authentication.isAuthenticated()
            && !"anonymousUser".equals(authentication.getName());
    model.addAttribute("isLoggedIn", isLoggedIn);
    if (isLoggedIn) model.addAttribute("name", authentication.getName());
    return "index";
}
```

인증 안 된 사용자에게도 Security는 `AnonymousAuthenticationToken`을 채워준다. 이때 `getName()`이 `"anonymousUser"`로 나오는 걸 이용해서 로그인 여부를 판별했다. `/member`, `/admin`은 이미 `SecurityConfig`에서 인증/권한을 걸러주니, 컨트롤러가 호출되는 시점엔 `authentication`이 항상 유효한 로그인 사용자다.

## 로그아웃

`SecurityConfig`에 `.logout(...)`을 명시적으로 설정하지 않아도 Spring Security가 기본적으로 `/logout` 경로를 제공해준다. `member.html`/`admin.html`에 이 폼 하나만 추가하면 됐다.

```html
<form th:action="@{/logout}" method="post">
  <button type="submit">로그아웃</button>
</form>
```

## 정리: 세션 기반 인증이 실제로 하는 일

`formLogin` 인증에 성공하면 `Authentication`이 `SecurityContextHolder`에 저장되고, 기본적으로 `HttpSession`에도 함께 저장된다(`HttpSessionSecurityContextRepository`가 기본값). 브라우저는 `JSESSIONID` 쿠키로 세션을 식별하고, 이후 요청마다 자동으로 이 쿠키를 실어 보내 로그인 상태를 유지한다.

`httpBasic`(매 요청 헤더 인증, 세션 없음)이나 JWT(무상태 토큰 방식)와는 목적과 동작 방식이 다르다. 여기서 만든 건 전형적인 "서버가 세션으로 로그인 상태를 기억하는" 브라우저 기반 웹앱이다.

> 회원가입 → 로그인(커스텀 `UserDetailsService`) → 역할별 접근 제어(`/member`는 인증만 필요, `/admin`은 `ROLE_ADMIN`) → 로그아웃 → 홈 화면 로그인 상태 분기까지, 여기까지가 전부 정상 동작하는 걸 확인했다.

이 프로젝트는 이후 화면 렌더링을 Next.js가 맡고 Spring은 순수 JSON API 서버로만 동작하는 구조로 옮겨갔다. 다음 글부터는 그 마이그레이션 과정을 정리한다.
