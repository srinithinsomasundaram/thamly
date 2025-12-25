import type { MetadataRoute } from "next"

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://thamly.in"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()
  const routes = [
    "",
    "/pricing",
    "/about",
    "/contact",
    "/docs",
    "/help",
    "/articles",
    "/drafts",
    "/editor",
    "/subscription/upgrade",
    "/auth/login",
    "/auth/sign-up",
    "/auth/forgot-password",
    "/auth/reset-password",
  ]

  return routes.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.6,
  }))
}
