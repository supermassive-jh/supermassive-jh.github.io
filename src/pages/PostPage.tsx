import type { ComponentProps } from "react"
import { Link, useParams } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { posts } from "../data/posts"
import { getPostContent } from "../lib/content"
import { CodeBlock } from "../components/code-block"
import { useDocumentMeta } from "@/hooks/use-document-meta"
import { siteName } from "@/lib/site"

const markdownComponents = {
  pre: ({ children }: ComponentProps<"pre">) => <>{children}</>,
  code: ({ className, children }: ComponentProps<"code">) => {
    const match = /language-(\w+)/.exec(className || "")
    if (!match) {
      return <code className={className}>{children}</code>
    }
    return (
      <CodeBlock
        language={match[1]}
        code={String(children).replace(/\n$/, "")}
      />
    )
  },
  table: ({ children, ...props }: ComponentProps<"table">) => (
    <div className="overflow-x-auto">
      <table {...props}>{children}</table>
    </div>
  ),
  a: ({ href, children }: ComponentProps<"a">) => {
    if (href && href.startsWith("/")) {
      return <Link to={href}>{children}</Link>
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  },
}

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>()
  const post = posts.find((p) => p.slug === slug)
  const content = slug ? getPostContent(slug) : undefined

  useDocumentMeta({
    title: post
      ? `${post.title} — ${siteName}`
      : `글을 찾을 수 없습니다 — ${siteName}`,
    description: post?.excerpt ?? "요청한 글을 찾을 수 없습니다.",
  })

  if (!post || !content) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">글을 찾을 수 없습니다.</p>
        <Link
          to="/"
          className="mt-3 inline-block text-sm text-primary hover:underline"
        >
          ← 목록으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <article>
      <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
        ← 목록으로
      </Link>

      <header className="mt-4 mb-8 border-b pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-balance break-words">
          {post.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
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
      </header>

      <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:tracking-tight prose-headings:text-balance prose-a:text-primary prose-code:before:content-none prose-code:after:content-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {content}
        </ReactMarkdown>
      </div>
    </article>
  )
}
