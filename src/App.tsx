import { useMemo, useState } from "react";
import { AppSidebar } from "./layout/AppSidebar";
import { SidebarInset, SidebarTrigger } from "./components/ui/sidebar";
import { Input } from "./components/ui/input";
import { ModeToggle } from "./components/mode-toggle";
import { posts } from "./data/posts";

export default function App() {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory =
        activeCategory === "전체" || post.category === activeCategory;
      const matchesQuery = !q || post.title.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

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
          <div className="mb-8">
            <p className="mb-2 font-mono text-xs text-primary">BLOG</p>
            <h1 className="text-3xl font-bold tracking-tight text-balance">
              기록하고 배포하는 것들
            </h1>
            <p className="mt-2 max-w-prose text-muted-foreground">
              정적 사이트 하나를 굴리면서 부딪힌 문제와 결정들을 남깁니다.
              댓글은 없고, 방문 기록은 저만 봅니다.
            </p>
          </div>

          <div className="mb-2 flex items-center gap-3 border-b pb-5">
            <Input
              placeholder="글 제목으로 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
              {filtered.length}개 글
            </span>
          </div>

          <div>
            {filtered.map((post, index) => (
              <article key={post.title} className={index > 0 ? "border-t" : ""}>
                <div className="py-6">
                  <a
                    href="#"
                    className="text-lg font-semibold tracking-tight hover:text-primary"
                  >
                    {post.title}
                  </a>
                  <p className="mt-1.5 max-w-prose text-[14.5px] text-muted-foreground">
                    {post.excerpt}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      {post.date}
                    </span>
                    <span className="text-border">·</span>
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {filtered.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                일치하는 글이 없습니다.
              </p>
            )}
          </div>
        </main>
      </SidebarInset>
    </>
  );
}
