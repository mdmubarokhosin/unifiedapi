"use client"

import { fetchClient } from "@/lib/fetch"
import {
  ChartBarIcon,
  ChatCircleIcon,
  ClockIcon,
  CrownIcon,
  EnvelopeIcon,
  EyeIcon,
  LightningIcon,
  UserCircleIcon,
  UsersIcon,
} from "@phosphor-icons/react"
import { useEffect, useState } from "react"

type Stats = {
  totalUsers: number
  authenticatedUsers: number
  anonymousUsers: number
  premiumUsers: number
  totalMessages: number
  messagesToday: number
  dailyActiveUsers: number
  totalChats: number
  chatsToday: number
  topModels: { model: string; count: number }[]
  recentUsers: {
    id: string
    email: string
    anonymous: boolean
    premium: boolean
    message_count: number
    daily_message_count: number
    created_at: string
    last_active_at: string
  }[]
  supabaseEnabled: boolean
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-primary",
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  sub?: string
  color?: string
}) {
  return (
    <div className="border-border bg-card rounded-xl border p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {sub && (
            <p className="text-muted-foreground text-xs">{sub}</p>
          )}
        </div>
        <div className={`rounded-lg bg-accent p-2.5 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M"
  if (n >= 1000) return (n / 1000).toFixed(1) + "K"
  return n.toString()
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString()
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetchClient("/api/admin/stats")
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load")
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm text-red-500">{error}</p>
        <p className="text-muted-foreground text-xs">
          {error.includes("Supabase")
            ? "Supabase is not configured. Connect Supabase to see stats."
            : "Make sure you have admin access."}
        </p>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Overview of your Zola instance
        </p>
      </div>

      {!stats.supabaseEnabled && (
        <div className="border-yellow-500/30 bg-yellow-500/5 rounded-lg border p-4">
          <p className="text-sm font-medium text-yellow-600">
            Supabase is not configured
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Connect Supabase to see real user data. Currently showing placeholder values.
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-3 grid-cols-2 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={UsersIcon}
          label="Total Users"
          value={formatNumber(stats.totalUsers)}
          sub={`${stats.authenticatedUsers} reg, ${stats.anonymousUsers} guests`}
        />
        <StatCard
          icon={CrownIcon}
          label="Premium"
          value={stats.premiumUsers}
          color="text-yellow-500"
        />
        <StatCard
          icon={ChatCircleIcon}
          label="Messages"
          value={formatNumber(stats.totalMessages)}
          sub={`${stats.messagesToday} today`}
          color="text-green-600"
        />
        <StatCard
          icon={LightningIcon}
          label="Daily Active"
          value={stats.dailyActiveUsers}
          sub={`${stats.chatsToday} chats today`}
          color="text-emerald-500"
        />
      </div>

      <div className="grid gap-4 lg:gap-6 lg:grid-cols-2">
        {/* Top Models */}
        <div className="border-border bg-card rounded-xl border p-4 sm:p-5">
          <div className="mb-3 sm:mb-4 flex items-center gap-2">
            <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm sm:text-base">Top Models</h3>
          </div>
          {stats.topModels.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No model usage data yet
            </p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {stats.topModels.map((item, i) => {
                const maxCount = stats.topModels[0]?.count || 1
                const pct = Math.round((item.count / maxCount) * 100)
                return (
                  <div key={item.model} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="text-muted-foreground w-5 text-right text-xs">
                          {i + 1}
                        </span>
                        <span className="font-mono text-xs">{item.model}</span>
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatNumber(item.count)}
                      </span>
                    </div>
                    <div className="bg-accent h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="border-border bg-card rounded-xl border p-4 sm:p-5">
          <div className="mb-3 sm:mb-4 flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm sm:text-base">Recent Users</h3>
          </div>
          {stats.recentUsers.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No users yet
            </p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {stats.recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg p-2 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent">
                      {user.anonymous ? (
                        <EyeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <UserCircleIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {user.anonymous ? "Guest" : user.email}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {user.message_count} messages
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {user.premium && (
                      <span className="text-yellow-600 mr-2 text-xs font-medium">
                        PRO
                      </span>
                    )}
                    <span className="text-muted-foreground text-xs">
                      {formatDate(user.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Bottom */}
      <div className="grid gap-3 grid-cols-3 sm:gap-4">
        <div className="border-border bg-card rounded-xl border p-3 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <EnvelopeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <span className="text-muted-foreground text-xs font-medium">
              Registered
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-bold">{stats.authenticatedUsers}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-3 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <EyeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <span className="text-muted-foreground text-xs font-medium">
              Guests
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-bold">{stats.anonymousUsers}</p>
        </div>
        <div className="border-border bg-card rounded-xl border p-3 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <ChatCircleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <span className="text-muted-foreground text-xs font-medium">
              Total Chats
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-bold">{formatNumber(stats.totalChats)}</p>
        </div>
      </div>
    </div>
  )
}
