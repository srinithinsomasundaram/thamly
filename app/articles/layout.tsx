import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Articles | Thamly — Tamil AI Writing Platform",
  description:
    "Read Tamil-first writing guides on online Tamil grammar checkers, Tamil spelling correction, transliteration tips, and tone rewrites. Thamly Pro offers unlimited AI checks (₹399/mo or ₹3999/yr).",
  keywords: [
    "Tamil writing guides",
    "Tamil AI articles",
    "Tamil transliteration tips",
    "Tamil tone rewrites",
    "Thamly blog",
    "Tamil grammar checker",
    "Online Tamil grammar checker",
    "Tamil grammar check",
    "Tamil spelling",
    "Spelling correction online",
  ],
}

export default function ArticlesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
