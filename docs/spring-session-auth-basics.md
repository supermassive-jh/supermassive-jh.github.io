Spring Boot + Thymeleaf로 회원가입/로그인을 직접 만들어봤다. 화면은 서버가 그대로 그려주는(SSR) 옛날 방식이고, 인증은 세션(`JSESSIONID`) 기반이다. 요즘 기준으론 기본기에 가깝지만, 막상 손으로 짜보니 곳곳에서 걸렸다. 그 기록을 남긴다.

## 구조

- Spring Boot 애플리케이션 하나가 Thymeleaf로 HTML을 직접 렌더링한다.
- Spring Security가 세션 기반 인증을 처리한다.
- MySQL + Spring Data JPA(Hibernate)로 회원 정보를 저장한다.

DB 스키마는 이렇게 잡았다.

```sql
create table member(
  id int not null auto_increment,
  password varchar(50) not null,
  name varchar(10) not null,
  role varchar(10) not null,
  date datetime,
  constraint member_pk primary key(id)
)
```

## 엔티티

```java
@Entity
@Getter
@Setter
public class Member {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    @Column(length = 50, nullable = false)
    private String password;
    @Column(length = 10, nullable = false)
    private String name;
    @Column(length = 10, nullable = false)
    private String role;
    private LocalDateTime date;
}
```

처음엔 `date` 필드를 `java.util.Date`로 잡았었다. 그런데 `@Temporal` 어노테이션 없이는 JPA가 이걸 DATE/TIME/TIMESTAMP 중 뭐로 매핑할지 스펙상 애매해서 오류 소지가 있었다. `LocalDateTime`으로 바꾸니 `@Temporal` 없이도 `datetime` 컬럼과 자연스럽게 매칭됐다.

나머지는 DDL과 자바 코드를 최대한 일치시키는 작업이었다. `@GeneratedValue(strategy = GenerationType.IDENTITY)`로 DDL의 `auto_increment`를 명시적으로 맞추고, `@Column(length=..., nullable=false)`로 `varchar` 길이와 `not null` 제약을 자바 쪽에도 반영했다. 이걸 안 하면 자바에서는 아무 검증 없이 통과했다가 DB 에러로만 걸러진다.

## Repository

```java
public interface MemberRepository extends JpaRepository<Member, Integer> {
    boolean existsByName(String name);
    Optional<Member> findByName(String name);
    List<Member> findAllByRole(String role);
}
```

처음엔 `getMembersByRole`이라고 이름 붙였는데, Spring Data JPA에서 `get`/`find`/`read`/`query` 접두사는 기능적으로 동일하지만 관용적으로 다건 조회는 `findAllBy...`가 표준적이라 바꿨다. 중복 체크용으로도 처음엔 `List<Member> findAllByName`을 썼다가, 존재 여부만 필요하면 리스트 전체를 안 가져와도 되는 `existsByName`이 더 맞다는 걸 알았다.

## Service

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class MemberService {
    private final MemberRepository memberRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;

    public boolean join(Member member) {
        if (memberRepository.existsByName(member.getName())) {
            log.info("member exist");
            return false;
        }
        member.setPassword(bCryptPasswordEncoder.encode(member.getPassword()));
        member.setDate(LocalDateTime.now());
        memberRepository.save(member);
        return true;
    }
}
```

여기서 겪은 것들:

- `MemberService` 인터페이스 + `MemberServiceImpl` 구현체를 나누는 건 EJB 시절 관습이다. 구현체가 하나뿐이면 그냥 클래스 하나로 충분하다.
- 필드에 `@Autowired`를 붙이는 것보다 `@RequiredArgsConstructor` + `final` 필드(생성자 주입)가 테스트하기 쉬워서 권장된다.
- 비밀번호 암호화는 **회원가입(저장) 시점에 직접 인코딩**해야 한다. Spring Security가 자동으로 해주는 건 로그인 시점의 비교(`matches`)뿐이다.
- 처음엔 중복 체크 뒤에 `return`이 없어서, 중복된 이름이어도 그냥 저장돼버리는 버그가 있었다. `return false`를 추가해서 고쳤다.
- 예외를 던지는 대신 `boolean`으로 성공/실패를 표현해서, 컨트롤러 쪽 분기를 단순하게 유지했다.

`existsByName`과 `save`는 각각 별도 트랜잭션이라 지금 규모에선 `@Transactional` 없이도 문제는 없다. 다만 동시에 같은 이름으로 가입 요청이 들어오는 레이스 컨디션은 `@Transactional`이 아니라 DB `unique` 제약으로 막아야 하는 문제다 — 이건 아직 적용 안 한 채로 TODO로 남아있다.

## UserDetailsService

```java
@Service
@RequiredArgsConstructor
public class MemberDetailsService implements UserDetailsService {
    private final MemberRepository memberRepository;

    @Override
    public UserDetails loadUserByUsername(String name) throws UsernameNotFoundException {
        Member member = memberRepository.findByName(name)
                .orElseThrow(() -> new UsernameNotFoundException("존재하지 않는 사용자: " + name));

        return User.withUsername(member.getName())
                .password(member.getPassword())
                .authorities("ROLE_" + member.getRole().toUpperCase())
                .build();
    }
}
```

이 클래스는 `Member` 엔티티를 Spring Security가 이해하는 `UserDetails`로 "번역"하는 역할만 한다. Security의 인증 파이프라인(`AuthenticationManager` → `DaoAuthenticationProvider`)이 이 빈을 자동으로 찾아 `PasswordEncoder`와 함께 쓰기 때문에, 비밀번호 비교(`matches`) 로직은 직접 짤 필요가 없다.

주의할 점 두 가지가 있었다.

1. `role` 값 앞에 `"ROLE_"`을 붙이고 대문자로 바꿔야 한다. `hasRole("ADMIN")`은 내부적으로 `"ROLE_ADMIN"` 문자열을 찾기 때문이다.
2. 사용자를 못 찾았을 때 `null`을 리턴하면 안 된다. Security의 실패 처리 계약은 `UsernameNotFoundException`을 던지는 것이고, `null`을 리턴하면 그냥 NPE가 난다.

`findByName`이 `Optional<Member>`를 리턴하니 `orElseThrow`로 풀어주는 것도 잊지 말아야 할 부분.

다음 글에서는 `SecurityConfig`로 인증/인가 규칙을 걸고, 로그인 폼과 로그아웃까지 붙여서 전체 흐름을 완성한다.
