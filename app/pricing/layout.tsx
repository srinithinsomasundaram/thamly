import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing | Thamly — Tamil AI Writing Platform",
  description:
    "Choose between Free and Pro. Pro is ₹399/mo or ₹3999/yr and includes unlimited Tamil AI checks, transliteration, grammar/spelling fixes, tone rewrites, and priority support.",
  keywords: [
    "Thamly pricing",
    "Tamil AI pricing",
    "Unlimited Tamil AI checks",
    "Tamil transliteration plan",
    "Tamil grammar checker plan",
    "Tamil tone rewrite pricing",
  ],
  openGraph: {
    title: "Pricing | Thamly — Tamil AI Writing Platform",
    description:
      "Free plan plus Pro at ₹399/mo or ₹3999/yr with unlimited Tamil AI checks, transliteration, grammar/spelling fixes, tone rewrites, and priority support.",
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
