import { HashRouter, Routes, Route } from "react-router-dom"
import RootLayout from "./layout/RootLayout"
import BoardPage from "./pages/BoardPage"
import PostPage from "./pages/PostPage"

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<BoardPage />} />
          <Route path="post/:slug" element={<PostPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
