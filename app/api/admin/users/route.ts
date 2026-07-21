import { verifyAdminSession } from "@/lib/admin/auth"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isSupabaseEnabled) {
    return NextResponse.json({ users: [], total: 0 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const filter = searchParams.get("filter") || "all"

    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: "Failed to create Supabase client" },
        { status: 500 }
      )
    }

    let query = supabase
      .from("users")
      .select(
        "id, email, anonymous, premium, display_name, profile_image, message_count, daily_message_count, daily_pro_message_count, favorite_models, system_prompt, created_at, last_active_at, daily_reset, daily_pro_reset",
        { count: "exact" }
      )

    // Apply filters
    if (filter === "authenticated") {
      query = query.eq("anonymous", false)
    } else if (filter === "anonymous") {
      query = query.eq("anonymous", true)
    } else if (filter === "premium") {
      query = query.eq("premium", true)
    }

    // Apply search
    if (search) {
      query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`)
    }

    // Order and paginate
    const from = (page - 1) * limit
    const { data: users, count } = await query
      .order("created_at", { ascending: false })
      .range(from, from + limit - 1)

    return NextResponse.json({
      users: users || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error("Admin users list error:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}
