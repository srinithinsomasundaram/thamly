import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { SocketProvider } from "@/components/providers/socket-provider"
import { UserProvider } from "@/components/providers/user-provider"

export const metadata: Metadata = {
  title: {
    default: "Thamly — Tamil AI Writing Platform",
    template: "%s | Thamly",
  },
  description:
    "Thamly is a Tamil-first AI writing assistant for transliteration, grammar/spelling fixes, tone rewrites (news, academic, email), and unlimited checks on Pro (₹399/mo or ₹3999/yr).",
  keywords: [
    "Tamil AI writing",
    "Tamil grammar checker",
    "Tanglish to Tamil transliteration",
    "Tamil tone rewriting",
    "Tamil spell check",
    "Tamil content rewriting",
    "Tamil news style rewrite",
    "Academic Tamil writing",
    "Tamil email drafts",
    "Unlimited Tamil AI checks",
    "Tamil writing assistant",
    "Tamil copy editing",
    "Tamil sentence correction",
    "Tamil spelling and grammar",
    "Tamil transliteration tool",
    "Thamly",
  ],
  applicationName: "Thamly",
  authors: [{ name: "Thamly" }],
  creator: "Thamly",
  publisher: "Thamly",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Thamly — Tamil AI Writing Platform",
    description:
      "Tamil-first AI for transliteration, grammar/spelling fixes, tone rewrites (news, academic, email), and unlimited checks on Pro (₹399/mo or ₹3999/yr).",
    url: "https://thamly.com",
    siteName: "Thamly",
    images: [{ url: "/logo2.png", width: 800, height: 800, alt: "Thamly logo" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Thamly — Tamil AI Writing Platform",
    description:
      "Tamil-first AI for transliteration, grammar/spelling fixes, tone rewrites (news, academic, email), and unlimited checks on Pro (₹399/mo or ₹3999/yr).",
    images: ["/logo2.png"],
  },
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : new URL("https://thamly.com"),
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/logo2.png",
        type: "image/png",
      },
    ],
    apple: "/logo2.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <SocketProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </SocketProvider>
        <Analytics />
      </body>
    </html>
  )
}
