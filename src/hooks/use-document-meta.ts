import { useEffect } from "react"
import { siteUrl } from "@/lib/site"
import { trackPageView } from "@/lib/gtag"

interface DocumentMeta {
  title: string
  description: string
}

function setMetaByName(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute("name", name)
    document.head.appendChild(el)
  }
  el.setAttribute("content", content)
}

function setMetaByProperty(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(
    `meta[property="${property}"]`,
  )
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute("property", property)
    document.head.appendChild(el)
  }
  el.setAttribute("content", content)
}

export function useDocumentMeta({ title, description }: DocumentMeta) {
  useEffect(() => {
    document.title = title

    setMetaByName("description", description)
    setMetaByProperty("og:title", title)
    setMetaByProperty("og:description", description)
    setMetaByProperty("og:url", siteUrl + window.location.pathname)

    let canonical = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    )
    if (!canonical) {
      canonical = document.createElement("link")
      canonical.setAttribute("rel", "canonical")
      document.head.appendChild(canonical)
    }
    canonical.setAttribute("href", siteUrl + window.location.pathname)

    trackPageView(title)
  }, [title, description])
}
