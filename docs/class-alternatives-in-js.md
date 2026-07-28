지난 글([클로저와 메모리 누수, 그리고 GC](/post/closure-and-memory-leaks))에서 이어지는 얘기다. 클로저로 상태를 가둘 수 있다는 건 알겠는데, 그럼 class는 왜 필요 없어지는 걸까. class가 하던 일을 뜯어보면 사실 두 가지뿐이다 — **① 상태를 캡슐화하는 것**, **② 인스턴스 개수를 제어하는 것**. JS/React 생태계는 이 두 역할을 각각 다른 패턴으로 자연스럽게 나눠 가졌다.

## 1개만 필요하면 → 모듈 스코프 클로저 (싱글톤)

```javascript
// cache.js
const store = new Map() // 모듈 스코프 = 이 파일을 import하는 모든 곳이 공유

export function set(key, value) {
  store.set(key, value)
}
export function get(key) {
  return store.get(key)
}
export function clear() {
  store.clear()
}
```

```javascript
// fileA.js
import { set } from "./cache"
set("user", { name: "John" })
```

```javascript
// fileB.js
import { get } from "./cache"
get("user") // { name: 'John' } — fileA와 같은 store를 공유
```

class로 싱글톤을 만들면 이렇게 된다.

```javascript
class Cache {
  constructor() {
    this.store = new Map()
  }
  set(key, value) {
    this.store.set(key, value)
  }
  get(key) {
    return this.store.get(key)
  }
}
export default new Cache() // 실수로 new Cache()를 또 만들 위험 존재
```

모듈 스코프 버전은 애초에 `new`할 방법이 없다. 그래서 실수로 인스턴스가 여러 개 생길 위험 자체가 없다. JS/React 생태계가 전역 공유 상태에서 class보다 모듈 스코프 클로저를 선호하는 이유가 여기 있다.

## N개가 독립적으로 필요하면 → 팩토리 함수

```javascript
// createLogger.js
export function createLogger(prefix) {
  const logs = [] // 호출할 때마다 새로 생기는 독립된 클로저 상태

  return {
    log(message) {
      const entry = `[${prefix}] ${message}`
      logs.push(entry)
      console.log(entry)
    },
    getHistory() {
      return logs
    },
  }
}
```

```javascript
const apiLogger = createLogger("API")
const dbLogger = createLogger("DB")

apiLogger.log("요청 시작")
dbLogger.log("쿼리 실행")

apiLogger.getHistory() // ['[API] 요청 시작'] — 서로 섞이지 않음
dbLogger.getHistory() // ['[DB] 쿼리 실행']
```

class로 치면 `new Logger('API')`, `new Logger('DB')`와 같은 효과를, `new` 없이 함수 호출만으로 만든 셈이다.

## 정리하면

| 필요한 것               | 패턴                       | 예시                              |
| ----------------------- | -------------------------- | --------------------------------- |
| 상태 없음, 계산만       | 순수 함수                  | `formatCurrency()`, `slugify()`   |
| 앱 전체 상태 하나 공유  | 모듈 스코프 클로저(싱글톤) | 캐시, 전역 설정, 이벤트 버스      |
| 호출마다 독립 상태 필요 | 팩토리 함수(`createX()`)   | 로거, 커스텀 훅, 여러 개의 카운터 |

"몇 개의 인스턴스가 필요한가?"라는 질문에 class는 `new` 호출 횟수로 답했다면, 함수형은 "모듈을 그냥 쓰느냐(1개) vs 팩토리 함수를 호출하느냐(N개)"로 답하는 셈이다.

> React의 `useState`, `useContext` 같은 훅들도 사실 이 팩토리 함수 패턴의 연장선이다. 컴포넌트마다(=`useState()` 호출마다) 독립된 상태를 클로저로 만들어준다.

다음 글에서는 이 클로저 기반 상태를 순수 JS로 직접 만들어보고, 그걸 React 리렌더링과 연결하려다 부딪히는 문제를 다룬다.
