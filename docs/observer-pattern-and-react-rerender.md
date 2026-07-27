이어지는 얘기. 클로저로 상태를 가둘 수 있다는 건 [지난 글](/#/post/class-alternatives-in-js)에서 정리했다. 그럼 그 상태가 바뀌었을 때 "구독자에게 알리는" 옵저버 패턴까지 직접 만들면, React 리렌더링은 저절로 따라올까? 순수 JS로 store를 만들고 React에 수동으로 연결해보면서 확인해봤다.

## 순수 JS store 만들기

```javascript
// 순수 JS store (옵저버 패턴)
function createStore(initialState) {
  let state = initialState
  const listeners = new Set()

  return {
    getState: () => state,
    setState: (partial) => {
      state = { ...state, ...partial }
      listeners.forEach((listener) => listener()) // 구독자에게 알림
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener) // unsubscribe
    },
  }
}
```

여기까지는 별거 없다. `subscribe`로 리스너를 등록해두면 `setState`가 호출될 때마다 그 리스너들을 순서대로 실행해주는, 흔히 말하는 옵저버 패턴 그대로다.

## 문제: React는 이 사실을 모른다

`store.setState()`를 호출하면 내부 `state`는 정확히 바뀐다. 그런데 **React는 그 사실을 모른다.** React 입장에선 "누가 `setState(newValue)`를 호출했다"는 신호, 즉 React 내장 스케줄러에 등록된 신호를 받은 적이 없기 때문에 리렌더링할 이유가 없는 것이다.

`useState`가 특별한 이유가 여기 있다. `setCount(newValue)`를 호출하면 **React 스케줄러에 직접 "이 컴포넌트 다시 그려줘"라고 등록하는 매커니즘**이 내장되어 있다. 방금 만든 순수 JS store는 React와 완전히 무관한 세계에 있어서, 이 연결고리가 처음부터 없다.

억지로 연결하면 이렇게 된다.

```jsx
import { useState, useEffect } from "react"
import { store } from "./store"

function Counter() {
  const [, forceRender] = useState({}) // 강제 리렌더링 트릭

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      forceRender({}) // store가 바뀌면 수동으로 리렌더링 트리거
    })
    return unsubscribe
  }, [])

  const { count } = store.getState()

  return (
    <button onClick={() => store.setState({ count: count + 1 })}>
      {count}
    </button>
  )
}
```

`useState` + `useEffect` + `subscribe`/`unsubscribe` 조합을 손으로 짜야 겨우 리렌더링이 붙는다.

## 이게 바로 Zustand가 대신 해주는 일

```jsx
// Zustand 버전 — 위 코드 전체가 이거 한 줄
const count = useStore((state) => state.count)
```

방금 짠 코드 전체가 이 한 줄로 줄어든다. Zustand가 추가로 얹어주는 것들을 정리하면:

| 기능                         | 순수 JS로 직접 구현 시                     | Zustand                                  |
| ---------------------------- | ------------------------------------------ | ---------------------------------------- |
| React 리렌더링 연결          | `useState`+`useEffect`+구독 로직 직접 작성 | `useStore()` 한 줄                       |
| 필요한 값만 구독 (selector)  | 비교 로직 직접 작성                        | `useStore(s => s.a)` — 자동 처리         |
| 동시성 모드 안전성           | `useSyncExternalStore` 직접 다뤄야 함      | 내장                                     |
| 미들웨어 (persist, devtools) | 전부 직접 구현                             | `persist()`, `devtools()` 조합만 하면 됨 |
| SSR / hydration              | 직접 처리                                  | 대응 로직 내장                           |

> 한 줄로 요약하면: 상태 저장 로직(팩토리 패턴)은 순수 JS와 동일하고, Zustand의 가치는 그 상태와 **React의 리렌더링 시스템을 자동으로 이어주는 배선**에 있다. 그것도 필요한 값만 선택적으로 구독하는, 최적화된 배선이다.

다음 글에서는 Redux, Recoil, Jotai도 결국 같은 문제를 푸는 건지, 뭐가 다른 건지를 정리한다.
