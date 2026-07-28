import { useState } from "react"
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter"
import java from "react-syntax-highlighter/dist/esm/languages/prism/java"
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript"
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx"
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup"
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql"
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript"
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx"
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism"
import { Check, Copy } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

SyntaxHighlighter.registerLanguage("java", java)
SyntaxHighlighter.registerLanguage("javascript", javascript)
SyntaxHighlighter.registerLanguage("jsx", jsx)
SyntaxHighlighter.registerLanguage("html", markup)
SyntaxHighlighter.registerLanguage("sql", sql)
SyntaxHighlighter.registerLanguage("ts", typescript)
SyntaxHighlighter.registerLanguage("tsx", tsx)

const supportedLanguages = new Set([
  "java",
  "javascript",
  "jsx",
  "html",
  "sql",
  "ts",
  "tsx",
])

interface CodeBlockProps {
  language: string
  code: string
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  const { resolvedTheme } = useTheme()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard access unavailable in this context; nothing more we can do
    }
  }

  return (
    <div className="not-prose relative overflow-hidden rounded-lg border">
      <button
        type="button"
        onClick={handleCopy}
        aria-label="코드 복사"
        className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-md border bg-background/80 px-2 py-1 font-mono text-xs text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
      >
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
        {copied ? "복사됨" : "복사"}
      </button>
      <div className="overflow-x-auto">
        {supportedLanguages.has(language) ? (
          <SyntaxHighlighter
            language={language}
            style={resolvedTheme === "dark" ? oneDark : oneLight}
            customStyle={{
              margin: 0,
              padding: "1rem",
              fontSize: "13px",
            }}
            codeTagProps={{ style: { background: "none" } }}
          >
            {code}
          </SyntaxHighlighter>
        ) : (
          <pre className="bg-transparent p-4 text-[13px]">
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  )
}
