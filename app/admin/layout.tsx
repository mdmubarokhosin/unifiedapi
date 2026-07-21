"use client"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { fetchClient } from "@/lib/fetch"
import { Loader2 } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetchClient("/api/admin/auth")
        const data = await res.json()

        if (data.authenticated) {
          setIsAuthenticated(true)
          setChecking(false)
        } else {
          if (pathname !== "/admin") {
            router.push("/admin")
          } else {
            setChecking(false)
          }
        }
      } catch {
        if (pathname !== "/admin") {
          router.push("/admin")
        } else {
          setChecking(false)
        }
      }
    }

    checkAuth()
  }, [pathname, router])

  // Login page - no sidebar
  if (pathname === "/admin" && !isAuthenticated) {
    if (checking) {
      return (
        <div className="bg-background flex min-h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )
    }
    return <>{children}</>
  }

  if (checking) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Admin pages with responsive sidebar
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">{children}</main>
    </div>
  )
}