"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, X } from "lucide-react"

export function LandingNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string>("")
  const [fullName, setFullName] = useState<string>("")
  const router = useRouter()
  const pathname = usePathname()
  const defaultRedirect = pathname?.startsWith("/pricing") ? "/subscription/upgrade" : "/drafts"

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

       if (user?.id) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", user.id)
            .maybeSingle()

          const identity = user.identities?.find((identity: any) => identity.provider === "google")
          const identityData = (identity?.identity_data || {}) as any
          const derivedAvatar = (profile as any)?.avatar_url || identityData?.picture || identityData?.avatar_url || (user.user_metadata as any)?.avatar_url || (user.user_metadata as any)?.picture
          const derivedName = (profile as any)?.full_name || identityData?.name || (user.user_metadata as any)?.full_name || user.email || ""
          if (derivedAvatar) setAvatarUrl(derivedAvatar)
          if (derivedName) setFullName(derivedName)
        } catch (error) {
          console.error("Navbar profile load failed", error)
        }
       }
    }
    checkUser()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-[#dfe9dd] bg-white/90 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo1.png" alt="Thamly" width={40} height={40} className="rounded-xl" />
          <span className="text-xl font-semibold text-[#0f2c21]">Thamly</span>
        </Link>

        <div className="hidden items-center gap-6 text-sm font-semibold text-[#0f2c21] md:flex">
          <Link href="/contact" className="transition-colors hover:text-black">
            Contact
          </Link>
          <Link href="/articles" className="transition-colors hover:text-black">
            Articles
          </Link>
          <Link href="/pricing" className="transition-colors hover:text-black">
            Pricing
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#0f2c21] hover:bg-[#eef6f0]"
                  onClick={() => router.push("/drafts")}
                >
                  Dashboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-[#d3e9d7] bg-white text-[#0f2c21] hover:border-[#b8d8c7]"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={avatarUrl} alt={fullName || user?.email || "User avatar"} />
                  <AvatarFallback>
                    {(fullName || user?.email || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#0f2c21] hover:bg-[#eef6f0]"
                  onClick={() => router.push(`/auth/login?redirectTo=${encodeURIComponent(defaultRedirect)}`)}
                >
                  Log in
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="rounded-full bg-[#0f7a5c] px-4 text-white shadow-md shadow-[#0f7a5c]/30 hover:bg-[#0c6148]"
                >
                  <Link href={`/auth/sign-up?redirectTo=${encodeURIComponent(defaultRedirect)}`}>Start now</Link>
                </Button>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="sm:hidden text-[#0f2c21] hover:bg-[#eef6f0]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

        {isMenuOpen && (
          <div className="border-t border-[#dfe9dd] bg-white/95 py-4 md:hidden">
            <div className="space-y-1 px-4">
              <Link
                href="/contact"
                className="block rounded-md px-3 py-2 text-[#0f2c21] hover:bg-[#eef6f0] hover:text-black"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <Link
                href="/articles"
                className="block rounded-md px-3 py-2 text-[#0f2c21] hover:bg-[#eef6f0] hover:text-black"
                onClick={() => setIsMenuOpen(false)}
              >
                Articles
              </Link>
              <Link
                href="/pricing"
                className="block rounded-md px-3 py-2 text-[#0f2c21] hover:bg-[#eef6f0] hover:text-black"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </Link>

              {user ? (
                <>
                  <div className="flex items-center gap-3 px-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={avatarUrl} alt={fullName || user?.email || "User avatar"} />
                      <AvatarFallback>
                        {(fullName || user?.email || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-semibold text-[#0f2c21]">{fullName || user?.email}</div>
                      <div className="text-xs text-slate-600">Welcome back</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-[#0f2c21] hover:bg-[#eef6f0]"
                    onClick={() => {
                      router.push("/drafts")
                      setIsMenuOpen(false)
                    }}
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-[#0f2c21] hover:bg-[#eef6f0]"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-[#0f2c21] hover:bg-[#eef6f0]"
                  onClick={() => {
                    router.push(`/auth/login?redirectTo=${encodeURIComponent(defaultRedirect)}`)
                    setIsMenuOpen(false)
                  }}
                >
                  Login
                </Button>
                <Button
                  className="w-full rounded-full bg-[#0f7a5c] text-white hover:bg-[#0c6148]"
                  asChild
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Link href={`/auth/sign-up?redirectTo=${encodeURIComponent(defaultRedirect)}`}>Start now</Link>
                </Button>
              </>
            )}
            </div>
          </div>
        )}
      </nav>
      <div className="h-16" />
    </>
  )
}
