import { useMemo } from "react"
import { Link, useOutletContext } from "react-router-dom"
import { Input } from "../components/ui/input"
import { posts } from "../data/posts"
import type { BoardContext } from "../layout/RootLayout"
import { useDocumentMeta } from "@/hooks/use-document-meta"
import { siteDescription, siteName } from "@/lib/site"

const postsByNewest = posts
  .map((post, index) => ({ post, index }))
  .sort((a, b) => b.post.date.localeCompare(a.post.date) || b.index - a.index)
  .map(({ post }) => post)

export default function BoardPage() {
  const { activeCategory, query, onQueryChange } =
    useOutletContext<BoardContext>()

  useDocumentMeta({
    title: `${siteName} — 기록하고 배포하는 것들`,
    description: siteDescription,
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return postsByNewest.filter((post) => {
      const matchesCategory =
        activeCategory === "전체" || post.category === activeCategory
      const matchesQuery = !q || post.title.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
  }, [activeCategory, query])

  return (
    <>
      <div className="mb-8">
        <p className="mb-2 font-mono text-xs text-primary">BLOG</p>
        <h1 className="text-3xl font-bold tracking-tight text-balance">
          기록하고 배포하는 것들
        </h1>
        <p className="mt-2 max-w-prose text-muted-foreground">
          정적 사이트 하나를 굴리면서 부딪힌 문제와 결정들을 남깁니다. 댓글은
          없고, 방문 기록은 저만 봅니다.
        </p>
      </div>

      <div className="mb-2 flex items-center gap-3 border-b pb-5">
        <Input
          placeholder="글 제목으로 검색"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
          {filtered.length}개 글
        </span>
      </div>

      <div>
        {filtered.map((post, index) => (
          <article key={post.slug} className={index > 0 ? "border-t" : ""}>
            <div className="py-6">
              <Link
                to={`/post/${post.slug}`}
                className="break-words text-lg font-semibold tracking-tight hover:text-primary"
              >
                {post.title}
              </Link>
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
    </>
  )
}
