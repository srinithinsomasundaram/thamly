import Link from "next/link"

export function Footer() {
  const links = [
    { href: "/about", label: "About" },
    { href: "/pricing", label: "Pricing" },
    { href: "/articles", label: "Articles" },
    { href: "/contact", label: "Contact" },
    { href: "/terms", label: "Terms" },
    { href: "/privacy", label: "Privacy" },
  ]

  return (
    <footer className="border-t border-[#dfe9dd] bg-[#f7faf7] px-6 py-10 text-[#0f2c21]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-2xl font-semibold">Thamly</p>
          <p className="text-sm text-[#42584a]">© {new Date().getFullYear()} Thamly — Tamil AI Writing Platform</p>
          <p className="text-sm text-[#42584a]">hello@thamly.in</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-[#42584a]">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-[#0f7a5c]">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
