"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, Trash2, Zap, UserRound } from "lucide-react"

const navItems = [
  { href: "/drafts", label: "Drafts", Icon: FileText },
  { href: "/subscription", label: "Plans", Icon: Zap },
  { href: "/trash", label: "Trash", Icon: Trash2 },
  { href: "/account", label: "Account", Icon: UserRound },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 text-xs font-semibold text-[#42584a]">
        {navItems.map(({ href, label, Icon }) => {
          const active = pathname?.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-md px-2 py-1 ${active ? "text-[#0f7a5c]" : "hover:text-black"}`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-[#0f7a5c]" : "text-[#42584a]"}`} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
