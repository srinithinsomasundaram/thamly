import type React from "react"
import type { Metadata } from "next"
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
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Thamly",
    url: metadata.metadataBase?.toString() || "https://thamly.com",
    logo: "https://thamly.com/logo2.png",
    sameAs: [
      "https://www.linkedin.com/company/thamly",
      "https://x.com/thamly",
    ],
    description:
      "Thamly is a Tamil-first AI writing assistant for transliteration, grammar/spelling fixes, tone rewrites (news, academic, email), and unlimited checks on Pro.",
  }

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Thamly",
    applicationCategory: "Productivity",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "399",
      priceCurrency: "INR",
      description: "Tamil-first AI writing assistant with unlimited checks on Pro.",
    },
    url: metadata.metadataBase?.toString() || "https://thamly.com",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "120",
    },
  }

  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify([orgJsonLd, productJsonLd]) }}
        />
        <SocketProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </SocketProvider>
      </body>
    </html>
  )
}
