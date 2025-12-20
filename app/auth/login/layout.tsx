import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Log in | Thamly — Tamil AI Writing Platform",
  description:
    "Log in to Thamly for Tamil-first AI writing, transliteration, grammar/spelling fixes, tone rewrites, and Pro at ₹399/mo or ₹3999/yr.",
  keywords: [
    "Thamly login",
    "Tamil AI login",
    "Tamil grammar checker login",
    "Tamil transliteration login",
  ],
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
