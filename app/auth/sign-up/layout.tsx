import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign up | Thamly — Tamil AI Writing Platform",
  description:
    "Create your Thamly account to start Tamil-first AI writing with transliteration, grammar/spelling fixes, tone rewrites, and Pro at ₹399/mo or ₹3999/yr.",
  keywords: [
    "Thamly sign up",
    "Create Thamly account",
    "Tamil AI sign up",
    "Tamil grammar checker account",
    "Tamil transliteration sign up",
  ],
}

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
