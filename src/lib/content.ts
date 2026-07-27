const modules = import.meta.glob("../../docs/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>

const contentBySlug: Record<string, string> = Object.fromEntries(
  Object.entries(modules).map(([path, raw]) => {
    const slug = path.split("/").pop()!.replace(/\.md$/, "")
    return [slug, raw]
  }),
)

export function getPostContent(slug: string): string | undefined {
  return contentBySlug[slug]
}
