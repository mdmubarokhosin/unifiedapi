import { verifyAdminSession } from "@/lib/admin/auth"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { NextResponse } from "next/server"

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isSupabaseEnabled) {
    return NextResponse.json({
      totalUsers: 0,
      authenticatedUsers: 0,
      anonymousUsers: 0,
      premiumUsers: 0,
      totalMessages: 0,
      messagesToday: 0,
      dailyActiveUsers: 0,
      totalChats: 0,
      chatsToday: 0,
      topModels: [],
      recentUsers: [],
      supabaseEnabled: false,
    })
  }

  try {
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: "Failed to create Supabase client" },
        { status: 500 }
      )
    }

    const today = new Date().toISOString().split("T")[0]

    // Parallelize all count queries
    const [
      { count: totalUsers },
      { count: authenticatedUsers },
      { count: premiumUsers },
      { count: totalMessages },
      { count: messagesToday },
      { count: dailyActiveUsers },
      { count: totalChats },
      { count: chatsToday },
      { data: topModelsData },
      { data: recentUsers },
    ] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("users").select("*", { count: "exact", head: true }).eq("anonymous", false),
      supabase.from("users").select("*", { count: "exact", head: true }).eq("premium", true),
      supabase.from("messages").select("*", { count: "exact", head: true }),
      supabase.from("messages").select("*", { count: "exact", head: true }).gte("created_at", today),
      supabase.from("users").select("*", { count: "exact", head: true }).gte("last_active_at", today),
      supabase.from("chats").select("*", { count: "exact", head: true }),
      supabase.from("chats").select("*", { count: "exact", head: true }).gte("created_at", today),
      // Limit top models query to avoid full table scan
      supabase.from("messages").select("model").eq("role", "assistant").not("model", "is", null).limit(10000),
      supabase.from("users").select("id, email, anonymous, premium, message_count, daily_message_count, created_at, last_active_at").order("created_at", { ascending: false }).limit(10),
    ])

    const anonymousUsers = (totalUsers || 0) - (authenticatedUsers || 0)

    const modelCounts: Record<string, number> = {}
    topModelsData?.forEach((m) => {
      if (m.model) {
        modelCounts[m.model] = (modelCounts[m.model] || 0) + 1
      }
    })

    const topModels = Object.entries(modelCounts)
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      authenticatedUsers: authenticatedUsers || 0,
      anonymousUsers: anonymousUsers || 0,
      premiumUsers: premiumUsers || 0,
      totalMessages: totalMessages || 0,
      messagesToday: messagesToday || 0,
      dailyActiveUsers: dailyActiveUsers || 0,
      totalChats: totalChats || 0,
      chatsToday: chatsToday || 0,
      topModels,
      recentUsers: recentUsers || [],
      supabaseEnabled: true,
    })
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    )
  }
}