"use client"

import type { ReactNode } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { DashboardNavbar } from "@/components/layout/dashboard-navbar"
import { useUserProfile } from "@/components/providers/user-provider"
import { MobileNav } from "@/components/layout/mobile-nav"

export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode
}) {
  const { user, profile } = useUserProfile()

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col">
        <DashboardNavbar user={user} profile={profile} />
        <main className="flex-1 bg-white px-4 pb-24 pt-6 sm:px-6 sm:pt-8 md:pb-8">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
