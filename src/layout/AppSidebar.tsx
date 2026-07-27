import { Link, useNavigate } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { posts } from "@/data/posts"

const categoryCounts = posts.reduce<Record<string, number>>((acc, post) => {
  acc[post.category] = (acc[post.category] ?? 0) + 1
  return acc
}, {})

const categories = ["전체", ...Object.keys(categoryCounts)]

interface AppSidebarProps {
  activeCategory: string
  onCategoryChange: (category: string) => void
}

export function AppSidebar({
  activeCategory,
  onCategoryChange,
}: AppSidebarProps) {
  const { isMobile, setOpenMobile } = useSidebar()
  const navigate = useNavigate()

  const handleCategoryClick = (category: string) => {
    onCategoryChange(category)
    navigate("/")
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const handleTitleClick = () => {
    onCategoryChange("전체")
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <Link
          to="/"
          onClick={handleTitleClick}
          className="block px-2 py-1.5 font-mono text-sm hover:text-primary"
        >
          supermassive<span className="text-primary">.</span>log
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>주제</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {categories.map((category) => (
                <SidebarMenuItem key={category}>
                  <SidebarMenuButton
                    className="cursor-pointer"
                    isActive={activeCategory === category}
                    onClick={() => handleCategoryClick(category)}
                  >
                    <span>{category}</span>
                    <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
                      {category === "전체"
                        ? posts.length
                        : categoryCounts[category]}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 py-1 font-mono text-[11px] text-muted-foreground">
          {posts.length} posts
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
