"use client"

import { ZolaIcon } from "@/components/icons/zola"
import { Button } from "@/components/ui/button"
import { fetchClient } from "@/lib/fetch"
import {
  ChartBarIcon,
  GearSixIcon,
  SignOutIcon,
  UsersIcon,
  CubeIcon,
  ArrowsLeftRightIcon,
  ListIcon,
  XIcon,
} from "@phosphor-icons/react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: ChartBarIcon,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: UsersIcon,
  },
  {
    label: "Models",
    href: "/admin/models",
    icon: CubeIcon,
  },
  {
    label: "System Config",
    href: "/admin/config",
    icon: GearSixIcon,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await fetchClient("/api/admin/auth", { method: "DELETE" })
      router.push("/admin")
    } catch {
      router.push("/admin")
    }
  }

  const handleNavClick = () => {
    setMobileOpen(false)
  }

  const navContent = (
    <>
      {/* Logo */}
      <div className="border-border flex items-center gap-3 border-b px-4 py-4 sm:px-5">
        <ZolaIcon className="h-7 w-7 text-primary" />
        <div>
          <h2 className="text-sm font-semibold">Zola Admin</h2>
          <p className="text-muted-foreground text-xs">Management Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin/dashboard" &&
              pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link key={item.href} href={item.href} onClick={handleNavClick}>
              <div
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-border border-t px-3 py-4 space-y-2">
        <Link href="/" className="block" onClick={handleNavClick}>
          <div className="text-muted-foreground hover:text-foreground flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors">
            <ArrowsLeftRightIcon className="h-5 w-5" />
            Back to App
          </div>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 text-sm text-red-500 hover:bg-red-500/10 hover:text-red-500"
          onClick={handleLogout}
        >
          <SignOutIcon className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile header bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-2">
          <ZolaIcon className="h-6 w-6 text-primary" />
          <span className="font-semibold text-sm">Admin</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 hover:bg-accent transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <XIcon className="h-5 w-5" />
          ) : (
            <ListIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`md:hidden fixed top-14 left-0 bottom-0 z-40 w-72 border-r border-border bg-card flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-screen w-64 shrink-0 flex-col border-r border-border bg-card">
        {navContent}
      </aside>
    </>
  )
}