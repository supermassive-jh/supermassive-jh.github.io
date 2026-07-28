import { BrowserRouter, Routes, Route } from "react-router-dom"
import RootLayout from "./layout/RootLayout"
import BoardPage from "./pages/BoardPage"
import PostPage from "./pages/PostPage"
import { ScrollToTop } from "./components/scroll-to-top"

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<BoardPage />} />
          <Route path="post/:slug" element={<PostPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
