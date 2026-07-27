[지난 글](/#/post/observer-pattern-and-react-rerender)에서 순수 JS store를 직접 만들어보고, Zustand가 그걸 React 리렌더링과 이어주는 배선이라는 걸 확인했다. 그럼 Redux, Recoil, Jotai는 뭐가 다른 걸까. 공통점부터 보면 답이 꽤 명확해진다.

## 공통점: 전부 같은 문제를 푼다

```
클로저/모듈로 상태 저장 (지난 글들에서 다룬 개념)
        +
React가 그 변화를 감지해서 리렌더링하게 만드는 배선
        =
Redux / Recoil / Zustand / Jotai... 전부 이 공식
```

이 배선을 **누가, 어떤 단위로, 어떻게** 하느냐가 라이브러리마다 다를 뿐이다.

- **Redux** — 단일 스토어 + 구독 + "변경은 반드시 `dispatch(action)` → reducer를 통해서만". 상태 변경 이력을 추적/디버깅하기 쉽게 만드는 데 초점이 있다. 손으로 짠 `createStore` 예제와 구조적으로 거의 동일하다(원본 Redux 코드는 100줄이 채 안 된다).
- **Zustand** — "최소한의 보일러플레이트로 문제를 풀자"는 쪽. 지난 글에서 손으로 짠 클로저 store에 가장 가깝다.
- **Recoil / Jotai** — 상태를 원자(atom) 단위로 잘게 쪼개고, 파생 상태 계산을 선언적으로 자동화한다. 구조 자체가 다르다.

## Recoil의 차별점: selector로 파생 상태 자동 계산

```jsx
const celsiusAtom = atom({ key: "celsius", default: 0 })

const fahrenheitSelector = selector({
  key: "fahrenheit",
  get: ({ get }) => {
    const celsius = get(celsiusAtom)
    return (celsius * 9) / 5 + 32
  },
})

function TempDisplay() {
  const fahrenheit = useRecoilValue(fahrenheitSelector)
  // celsiusAtom이 바뀌면 fahrenheitSelector도 자동 재계산되고,
  // 이를 구독하는 컴포넌트만 정확히 리렌더링됨
}
```

스프레드시트의 수식 셀과 비슷하다. `A1`이 바뀌면 `=A1*2`인 `B1`도 자동 갱신되듯, atom 간 의존관계를 선언해두면 라이브러리가 재계산 그래프를 대신 추적해준다. Zustand나 Redux는 이걸 `useMemo`나 selector 함수로 직접 계산해야 한다.

## 리렌더링 최적화 방식 비교

Redux/Zustand는 하나의 큰 store를 두고 selector 함수로 "이 컴포넌트는 이 조각만 봐"라고 직접 지정하는, 말하자면 수동 최적화 방식이다. Recoil/Jotai는 상태 자체가 처음부터 atom 단위로 잘게 쪼개져 있어서, 구독한 컴포넌트만 자동으로 정확히 리렌더링된다.

전자는 "큰 그릇에서 필요한 것만 걸러 마시는" 쪽이고, 후자는 "처음부터 각자 자기 잔에 따로 담아두는" 쪽에 가깝다.

## 총정리

| 구분                          | 상태 저장 단위                           | 변경 방식                           | React 연결 방식                            |
| ----------------------------- | ---------------------------------------- | ----------------------------------- | ------------------------------------------ |
| `useState`                    | 컴포넌트 로컬                            | `setState` 직접 호출                | React 내장                                 |
| 모듈 스코프 클로저(직접 구현) | 파일 하나                                | 자유                                | 직접 배선 필요 (`useSyncExternalStore` 등) |
| Zustand                       | 스토어 하나(보통 싱글톤, 여러 개도 가능) | `set()` 직접 호출                   | 내장 (`useStore` + selector)               |
| Redux                         | 앱 전체 단일 스토어                      | 반드시 `dispatch(action)` → reducer | 내장 (`useSelector`, `react-redux`)        |
| Recoil / Jotai                | atom 단위로 잘게 쪼갠 여러 조각          | atom별 setter                       | 내장 (의존성 그래프 자동 추적)             |

## 그래서 지금 생태계는 어떤가

이 글을 쓰는 시점(2026년 7월 넷째 주) npm 주간 다운로드와 GitHub 스타를 다시 찾아봤다.

- **Zustand** — 주간 다운로드 약 4,729만, 스타 약 5.8만. 압도적인 1위 자리를 유지하고 있다.
- **Jotai** — 주간 다운로드 약 552만, 스타 약 2.1만.
- **Recoil** — 주간 다운로드 약 47만, 스타 약 1.9만. Meta가 2025년 1월 1일에 저장소를 아카이브 처리해서 사실상 유지보수가 끝났다. 코드는 그대로 남아있어 보거나 fork할 수는 있지만, 신규 PR을 받지 않는 상태다. 신규 프로젝트에는 비권장이고, 기존 사용처는 Jotai나 Zustand로 마이그레이션하는 걸 권장하는 분위기다.

> 결국 큰 틀에서는 전부 같은 문제 — 클로저 기반 상태 캡슐화 + React 리렌더링 배선 — 를 풀고 있다. 나머지는 "그 배선을 얼마나 편하게, 어떤 철학으로 제공하느냐"의 디테일 차이였다.

여기까지가 클로저 → class 대체 패턴 → 옵저버 패턴 → 상태관리 라이브러리 비교로 이어진 네 편짜리 정리다.
