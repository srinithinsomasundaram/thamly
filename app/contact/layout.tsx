import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact | Thamly — Tamil AI Writing Platform",
  description:
    "Contact Thamly for Tamil-first AI writing support, billing, or product questions. Priority support for Pro users (₹399/mo or ₹3999/yr).",
  keywords: [
    "Contact Thamly",
    "Tamil AI support",
    "Tamil writing assistant help",
    "Thamly billing",
    "Tamil grammar support",
  ],
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
