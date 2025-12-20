"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { FileText, Zap, Trash2, LogOut, Headset, UserRound } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useUserProfile } from "@/components/providers/user-provider"

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useUserProfile()

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Logout error:", error)
      }
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout failed:", error)
      router.push("/auth/login")
    }
  }

  const isActive = (path: string) => pathname?.startsWith(path)

  const menuItems = [
    { icon: FileText, label: "Drafts", path: "/drafts", key: "drafts" },
    { icon: Trash2, label: "Trash", path: "/trash", key: "trash" },
    { icon: Zap, label: "Subscription", path: "/subscription", key: "subscription" },
    { icon: UserRound, label: "Account", path: "/account", key: "account" },
  ]

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 bg-white text-black border-r border-gray-200 md:flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        {loading ? (
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg bg-gray-200/80" />
            <Skeleton className="h-5 w-20 bg-gray-200/80" />
          </div>
        ) : (
          <Link href="/drafts" className="flex items-center gap-2 transition-fast text-black">
            <Image src="/logo1.png" alt="Thamly Logo" width={40} height={40} />
            <span className="font-bold text-lg lowercase text-black">thamly</span>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {loading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-10 w-full rounded-lg bg-gray-200/80" />
            ))
          : menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <Link
                  key={item.key}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all-smooth text-sm font-medium ${
                    active ? "bg-primary/10 text-primary" : "text-black hover:bg-accent/10 hover:text-accent"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-gray-200 p-4 space-y-2">
        {loading ? (
          <>
            <Skeleton className="h-10 w-full rounded-lg bg-gray-200/80" />
            <Skeleton className="h-10 w-full rounded-lg bg-gray-200/80" />
            <Skeleton className="h-4 w-32 bg-gray-200/80" />
          </>
        ) : (
          <>
            <Link
              href="/support"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-black hover:bg-accent/10 hover:text-accent transition-all-smooth text-sm font-medium"
            >
              <Headset className="w-5 h-5" />
              Support
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-black hover:bg-red-500/10 hover:text-red-500 transition-all-smooth text-sm font-medium"
            >
              <LogOut className="w-5 h-5" />
              Sign out
            </button>
            {user && <div className="px-4 py-2 text-xs text-muted-foreground break-all">{user.email}</div>}
          </>
        )}
      </div>
    </aside>
  )
}
