import path from "path"
import fs from "fs"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, type Plugin } from "vite"
import react, { reactCompilerPreset } from "@vitejs/plugin-react"
import babel from "@rolldown/plugin-babel"
import { posts } from "./src/data/posts.js"
import { siteUrl } from "./src/lib/site.js"

function sitemapPlugin(): Plugin {
  return {
    name: "generate-sitemap",
    apply: "build",
    closeBundle() {
      const urls = [
        siteUrl + "/",
        ...posts.map(
          (post: { slug: string }) => `${siteUrl}/post/${post.slug}`,
        ),
      ]
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
        .map((url) => `  <url>\n    <loc>${url}</loc>\n  </url>`)
        .join("\n")}\n</urlset>\n`
      fs.writeFileSync(path.resolve(__dirname, "dist/sitemap.xml"), xml)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    sitemapPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
