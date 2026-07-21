import { useState } from "react";
import "./App.css";
import { Button } from "./components/ui/button";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <div>hello world</div>
      <Button onClick={() => setCount((count) => count + 1)}>
        Count is {count}
      </Button>
    </div>
  );
}

export default App;
