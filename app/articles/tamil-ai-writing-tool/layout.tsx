import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tamil AI Writing Tool & Grammar Checker | Thamly",
  description:
    "Use Thamly as your Tamil AI writing tool, online Tamil grammar checker, and spelling correction online—one place for Tamil spelling and grammar fixes with transliteration.",
  keywords: [
    "Tamil AI writing tool",
    "Tamil grammar checker",
    "Online Tamil grammar checker",
    "Tamil grammar check",
    "Tamil spelling",
    "Tamil spelling correction online",
    "Spelling correction online",
    "Tamil transliteration and grammar",
  ],
}

export default function ArticleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
