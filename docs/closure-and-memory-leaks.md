TDD로 todo 리스트 앱을 만들다가, `useEffect`에 이벤트 리스너를 하나 걸어놓고 cleanup을 깜빡한 적이 있다. 당장 눈에 보이는 버그는 없었지만 찜찜해서 "정확히 무슨 일이 벌어지고 있던 건가"를 파고들다 보니 결국 클로저와 가비지 컬렉션(GC) 얘기까지 내려가게 됐다. 정리해둔다.

## 핵심 원리: 참조되지 않으면 청소된다

JS의 GC는 생각보다 단순한 규칙으로 움직인다. **참조되지 않는 메모리는 자동으로 청소된다.**

```javascript
function createTempStore() {
  let data = new Array(1000000).fill("hello")
  return { get: () => data }
}

let temp = createTempStore() // temp가 클로저를 참조 중 → 메모리 유지됨
temp = null // 참조가 끊김 → GC가 회수
```

`temp`가 클로저를 붙잡고 있는 동안은 `data` 배열도 같이 살아있다. `temp = null`로 참조를 끊는 순간 GC가 수거해간다. 여기까지는 교과서적인 얘기.

## 진짜 문제는 따로 있다

메모리 누수는 "store를 클로저로 만들어서" 생기는 게 아니다. **추가(add/push/set)는 있는데 제거(remove/delete/clear)가 없는 패턴** 전부가 후보다.

- 이벤트 리스너를 걸어놓고 떼는 걸 잊는 경우 — `addEventListener`/`removeEventListener`는 항상 짝으로 다녀야 하는데, 특히 `useEffect`의 cleanup 함수를 빼먹기 쉽다.
- 타이머를 안 지우는 경우 — `setInterval`을 걸어놓고 `clearInterval`을 안 하면, 그 타이머가 참조하는 클로저 전체가 계속 살아있는다.
- 배열이나 Map에 상한 없이 계속 쌓는 경우 — 로그나 캐시에 cap을 안 걸어두면 이게 그대로 누수가 된다.
- subscribe 해놓고 unsubscribe를 안 하는 경우 — WebSocket 핸들러나 상태관리 라이브러리의 `subscribe` 콜백이 대표적이다.

내가 걸렸던 것도 정확히 첫 번째 케이스였다. React에서 정석은 이렇게 생겼다.

```jsx
useEffect(() => {
  const handleScroll = () => console.log(window.scrollY)
  window.addEventListener("scroll", handleScroll)
  return () => window.removeEventListener("scroll", handleScroll) // cleanup
}, [])
```

`return`으로 넘기는 함수가 바로 "짝을 맞추는" 역할을 한다. 컴포넌트가 언마운트되거나 effect가 재실행되기 직전에 React가 이 함수를 호출해준다.

> 원칙은 하나로 요약된다. **"만들었으면(추가했으면) 반드시 치운다(제거한다)."**

다음 글에서는 이 클로저를 이용해서 class 없이 상태를 캡슐화하는 두 가지 패턴(싱글톤과 팩토리 함수)을 정리한다.
