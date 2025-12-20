"use client"

import type { ReactNode } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { DashboardNavbar } from "@/components/layout/dashboard-navbar"
import { useUserProfile } from "@/components/providers/user-provider"
import { MobileNav } from "@/components/layout/mobile-nav"

interface AppShellProps {
  children: ReactNode
  user?: any
  profile?: any
}

export function AppShell({ children, user, profile }: AppShellProps) {
  const { user: ctxUser, profile: ctxProfile } = useUserProfile()
  const resolvedUser = ctxUser || user
  const resolvedProfile = ctxProfile || profile

  return (
    <div className="relative flex min-h-screen bg-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(15,44,33,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,44,33,0.1) 1px, transparent 1px)",
          backgroundSize: "140px 140px",
        }}
      />
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col">
        <DashboardNavbar user={resolvedUser} profile={resolvedProfile} />
        <main className="relative flex-1 bg-white px-4 pb-24 pt-6 sm:px-6 sm:pt-8 md:pb-8">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
