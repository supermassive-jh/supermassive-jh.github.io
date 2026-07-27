import { useState } from "react"
import { Outlet } from "react-router-dom"
import { AppSidebar } from "./AppSidebar"
import { SidebarInset, SidebarTrigger } from "../components/ui/sidebar"
import { ModeToggle } from "../components/mode-toggle"

export interface BoardContext {
  activeCategory: string
  onCategoryChange: (category: string) => void
  query: string
  onQueryChange: (query: string) => void
}

export default function RootLayout() {
  const [activeCategory, setActiveCategory] = useState("전체")
  const [query, setQuery] = useState("")

  const context: BoardContext = {
    activeCategory,
    onCategoryChange: setActiveCategory,
    query,
    onQueryChange: setQuery,
  }

  return (
    <>
      <AppSidebar
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      <SidebarInset>
        <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <SidebarTrigger />
          <ModeToggle />
        </header>

        <main className="mx-auto w-full max-w-3xl px-6 py-10 md:px-10">
          <Outlet context={context} />
        </main>
      </SidebarInset>
    </>
  )
}
