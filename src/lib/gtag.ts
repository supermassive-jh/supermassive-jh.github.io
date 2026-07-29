declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function trackPageView(title: string) {
  if (typeof window.gtag !== "function") return

  window.gtag("event", "page_view", {
    page_title: title,
    page_location: window.location.href,
    page_path: window.location.pathname,
  })
}
