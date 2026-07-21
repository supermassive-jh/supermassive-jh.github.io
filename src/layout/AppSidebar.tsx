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
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 py-1.5 font-mono text-sm">
          supermassive<span className="text-primary">.</span>log
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Filter</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {categories.map((category) => (
                <SidebarMenuItem key={category}>
                  <SidebarMenuButton
                    isActive={activeCategory === category}
                    onClick={() => onCategoryChange(category)}
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
