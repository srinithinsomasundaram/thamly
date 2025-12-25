import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Help & FAQ | Thamly Tamil Grammar Checker",
  description:
    "Get answers about Thamly’s Tamil grammar checker, Tamil spelling correction, and spelling correction online. Learn how to run an online Tamil grammar check and fix spelling quickly.",
  keywords: [
    "Tamil grammar checker",
    "Online Tamil grammar checker",
    "Tamil grammar check",
    "Tamil spelling",
    "Spelling correction online",
    "Tamil spelling correction online",
    "Tamil FAQ",
  ],
}

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
