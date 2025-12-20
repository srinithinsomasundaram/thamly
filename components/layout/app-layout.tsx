"use client"

import type React from "react"

import { Sidebar } from "./sidebar"
import { DashboardLayoutWrapper } from "./dashboard-layout-wrapper"
import { usePathname } from "next/navigation"
import Link from "next/link"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Don't show sidebar on auth pages, editor pages, landing page, pricing page, and billing page
  const showSidebar =
    !pathname?.startsWith("/auth") &&
    !pathname?.startsWith("/editor") &&
    !pathname?.startsWith("/pricing") &&
    !pathname?.startsWith("/billing") &&
    !pathname?.startsWith("/articles") &&
    !pathname?.startsWith("/contact") &&
    !pathname?.startsWith("/support") &&
    !pathname?.startsWith("/help") &&
    pathname !== "/"

  // Use dashboard navbar for workspace routes (not editor pages and billing page)
  const useDashboardNavbar = pathname?.startsWith("/drafts") || pathname?.startsWith("/subscription") || pathname?.startsWith("/settings") || pathname?.startsWith("/trash") || pathname?.startsWith("/account")

  // Editor pages keep their own navbar
  const isEditorPage = pathname?.startsWith("/editor")

  return (
    <div className="flex h-screen">
      {showSidebar && <Sidebar />}
      <main className={`flex-1 overflow-auto ${showSidebar ? "md:ml-64" : ""}`}>
        {useDashboardNavbar ? (
          <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>
        ) : (
          children
        )}
        {/* Hide footer on editor pages */}
        {!isEditorPage && (
          <footer className="border-t border-gray-200 bg-white/80 backdrop-blur px-4 sm:px-6 lg:px-8 py-4 mt-6">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
              <p>© {new Date().getFullYear()} Thamly. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <Link href="/privacy" className="hover:text-teal-700">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-teal-700">Terms & Conditions</Link>
              </div>
            </div>
          </footer>
        )}
      </main>
    </div>
  )
}
