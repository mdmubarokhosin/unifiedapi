import { verifyAdminSession } from "@/lib/admin/auth"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isSupabaseEnabled) {
    return NextResponse.json({ error: "Supabase not enabled" }, { status: 400 })
  }

  try {
    const { userId } = await params
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to connect" }, { status: 500 })
    }

    // Get user details
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user's chat count
    const { count: chatCount } = await supabase
      .from("chats")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    // Get user's message count by model
    const { data: modelUsage } = await supabase
      .from("messages")
      .select("model")
      .eq("user_id", userId)
      .eq("role", "assistant")

    const modelCounts: Record<string, number> = {}
    modelUsage?.forEach((m) => {
      if (m.model) {
        modelCounts[m.model] = (modelCounts[m.model] || 0) + 1
      }
    })

    // Get recent messages
    const { data: recentMessages } = await supabase
      .from("messages")
      .select("id, role, content, model, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)

    return NextResponse.json({
      user,
      chatCount: chatCount || 0,
      modelUsage: Object.entries(modelCounts)
        .map(([model, count]) => ({ model, count }))
        .sort((a, b) => b.count - a.count),
      recentMessages: recentMessages || [],
    })
  } catch (error) {
    console.error("Admin user detail error:", error)
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isSupabaseEnabled) {
    return NextResponse.json({ error: "Supabase not enabled" }, { status: 400 })
  }

  try {
    const { userId } = await params
    const body = await req.json()
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to connect" }, { status: 500 })
    }

    const updates: Record<string, unknown> = {}

    if (body.premium !== undefined) updates.premium = body.premium
    if (body.daily_message_count !== undefined)
      updates.daily_message_count = body.daily_message_count
    if (body.daily_pro_message_count !== undefined)
      updates.daily_pro_message_count = body.daily_pro_message_count
    if (body.message_count !== undefined)
      updates.message_count = body.message_count
    if (body.display_name !== undefined)
      updates.display_name = body.display_name
    if (body.system_prompt !== undefined)
      updates.system_prompt = body.system_prompt
    if (body.favorite_models !== undefined)
      updates.favorite_models = body.favorite_models

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, user: data })
  } catch (error) {
    console.error("Admin user update error:", error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isSupabaseEnabled) {
    return NextResponse.json({ error: "Supabase not enabled" }, { status: 400 })
  }

  try {
    const { userId } = await params
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: "Failed to connect" }, { status: 500 })
    }

    // Delete user messages first
    await supabase.from("messages").delete().eq("user_id", userId)

    // Delete user chats
    await supabase.from("chats").delete().eq("user_id", userId)

    // Delete user keys
    await supabase.from("user_keys").delete().eq("user_id", userId)

    // Delete user preferences
    await supabase.from("user_preferences").delete().eq("user_id", userId)

    // Delete user (this will cascade in Supabase)
    const { error } = await supabase.from("users").delete().eq("id", userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin user delete error:", error)
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    )
  }
}