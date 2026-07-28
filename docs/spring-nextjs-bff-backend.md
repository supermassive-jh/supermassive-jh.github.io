[지난 글](/post/spring-security-config-and-login)까지 만든 Spring Boot + Thymeleaf 세션 로그인을, 화면 렌더링은 Next.js가 맡고 Spring은 순수 JSON API 서버로만 동작하는 BFF(Backend-for-Frontend) 구조로 옮겼다. 이 글에서는 왜 이렇게 옮겼는지, 그리고 Spring 쪽이 뭐가 바뀌었는지를 정리한다.

## 바뀐 구조

```text
[브라우저] ──(모든 요청)──▶ [Next.js 서버 (BFF), :3000]
                                │
                                │ 서버 코드에서 JSESSIONID 값을 Cookie 헤더로 수동 전달
                                ▼
                          [Spring Boot 서버, :8080]
                          Spring Security 세션 인증
```

브라우저는 Spring 서버 주소를 전혀 모른다. 항상 Next.js에만 요청을 보내고, Next.js의 Server Component/Server Action이 axios로 백엔드를 호출하면서 `JSESSIONID` 쿠키 값을 `Cookie` 헤더로 실어 보낸다. 인증 방식 자체는 JWT로 바꾸지 않고 **기존 세션 방식을 그대로 유지**했다.

## 왜 JWT로 안 바꿨는가

바꿀 이유가 딱히 없었다.

- 서버가 단일 인스턴스인 상태에서는 JWT의 핵심 장점인 무상태 스케일아웃이 발휘되지 않는다.
- 로그아웃/즉시 revoke는 세션 방식(`session.invalidate()`)이 훨씬 단순하다. JWT는 결국 revoke용 블랙리스트 저장소가 따로 필요해지는데, 그럴 거면 처음부터 세션을 쓰는 것과 큰 차이가 없어진다.
- 브라우저는 Spring 도메인 쿠키를 가진 적이 없다(Next.js가 중계하니까). 그래서 CORS 설정이 아예 필요 없고, 외부 사이트가 브라우저를 이용해 Spring에 직접 요청을 실어 보내는 전형적인 CSRF도 성립하기 어려운 구조가 됐다.
- 나중에 서버가 여러 대로 늘어나면 Spring Session + Redis로 세션 저장소만 외부화하면 된다. 코드 변경 없이 확장 가능하다. 멀티 리전이나 서로 다른 여러 서비스가 독립적으로 인증을 검증해야 하는 진짜 분산 규모가 되어야 JWT가 구조적으로 유리해진다.

## Spring 백엔드 변경 사항

### SecurityConfig

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.csrf(csrf -> csrf.disable())
            .httpBasic(basic -> basic.disable())
            .formLogin(form -> form.disable())
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/api/auth/login", "/api/join").permitAll()
                    .requestMatchers("/api/admin").hasRole("ADMIN")
                    .anyRequest().authenticated());
    return http.build();
}

@Bean
public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
    return config.getAuthenticationManager();
}
```

`formLogin`을 제거했다. 로그인 진입점이 HTML 폼이 아니라 JSON API(`AuthController`)로 바뀌었기 때문에 더 필요 없다. 대신 `AuthenticationManager`를 빈으로 노출시켰는데, 컨트롤러에서 직접 `authenticate()`를 호출하려면 이게 필요하다 — `formLogin`이 있을 땐 필터가 내부적으로 알아서 썼던 걸 이제 직접 꺼내 써야 한다. 인가 규칙도 `/api/**` 경로 기준으로 재설계했다. CSRF는 계속 비활성으로 뒀는데, 브라우저가 아니라 신뢰된 Next.js 서버만 이 API를 직접 호출하는 구조라 위험이 구조적으로 낮다고 판단했다.

### AuthController — `/api/auth/*`

```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationManager authenticationManager;

    record LoginRequest(String name, String password) {}

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.name(), request.password())
            );

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);

            HttpSession session = httpRequest.getSession(true);
            session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);

            return ResponseEntity.ok().build();
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "invalid credentials"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        return ResponseEntity.ok(Map.of("name", authentication.getName()));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) session.invalidate();
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }
}
```

`authenticationManager.authenticate(...)`가 내부적으로 예전에 만든 `MemberDetailsService.loadUserByUsername()`과 비밀번호 비교까지 다 처리해준다. DB 조회 로직은 Thymeleaf 시절 것을 그대로 재사용했다.

여기서 가장 빠뜨리기 쉬웠던 부분: **`SecurityContextHolder.setContext(context)`만으로는 세션에 저장되지 않는다.** Spring Security 6부터, 필터 체인 밖에서 세팅한 컨텍스트는 자동 저장되지 않는다. `session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context)`를 반드시 명시적으로 호출해야 다음 요청에서 세션이 복원된다. 이걸 모르고 며칠 헤맸다.

`getSession(true)`(로그인 — 세션 없으면 새로 만듦)와 `getSession(false)`(로그아웃 — 없으면 만들지 않고 `null`)도 상황에 맞게 구분해서 썼다. 실패 시엔 `null`을 리턴하지 않고 401과 JSON 에러 메시지로 응답했다.

### MainRestController — `/api/member`, `/api/admin`, `/api/join`

```java
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MainRestController {
    private final MemberRepository memberRepository;
    private final MemberService memberService;

    record JoinRequest(String name, String password, String role) {}

    @GetMapping("/member")
    public ResponseEntity<?> member(Authentication authentication) {
        return ResponseEntity.ok(Map.of("name", authentication.getName()));
    }

    @GetMapping("/admin")
    public ResponseEntity<?> admin() {
        List<Member> members = memberRepository.findAll();
        List<Map<String, Object>> result = members.stream()
                .map(m -> Map.<String, Object>of("id", m.getId(), "name", m.getName(), "role", m.getRole()))
                .toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/join")
    public ResponseEntity<?> join(@RequestBody JoinRequest request) {
        Member member = new Member();
        member.setName(request.name());
        member.setPassword(request.password());
        member.setRole(request.role());

        boolean success = memberService.join(member);
        if (!success) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "이미 존재하는 이름입니다"));
        }
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
```

`/admin`은 이미 `SecurityConfig`에서 `hasRole("ADMIN")`으로 걸러지니 컨트롤러에서 별도 권한 체크가 필요 없다. 그냥 `/me`와 똑같은 응답을 주는 대신, admin다운 실제 데이터(전체 회원 목록)를 내려줘서 의미 있는 리소스로 만들었다. 비밀번호 필드는 절대 응답에 포함하지 않고 `Map.of(...)`로 필요한 필드만 골라 직렬화했다.

`Member`, `MemberService`, `MemberRepository`는 Thymeleaf 시절 만든 것을 그대로 재사용했다. 바뀐 건 딱 하나, "화면을 그리느냐 vs JSON을 주느냐"뿐이다. `201 CREATED`(생성 성공), `409 CONFLICT`(중복 이름 충돌)처럼 의미에 맞는 HTTP 상태 코드를 쓰는 것도 신경 썼다.

다음 글에서는 이 API들을 Next.js가 어떻게 호출하고, `JSESSIONID`를 어떻게 중계하는지를 다룬다.
