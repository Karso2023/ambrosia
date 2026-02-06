import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { week_start, items, common_staples } = body

    const { data, error } = await supabase
      .from("shopping_lists")
      .update({
        items,
        common_staples,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id)
      .eq("week_start", week_start)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ shopping_list: data })
  } catch (error) {
    console.error("Shopping list update error:", error)
    return NextResponse.json(
      { error: "Failed to update shopping list" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const weekStart = req.nextUrl.searchParams.get("week_start")

    if (!weekStart) {
      // Get the most recent shopping list
      const { data, error } = await supabase
        .from("shopping_lists")
        .select("*")
        .eq("user_id", user.id)
        .order("week_start", { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return NextResponse.json({ shopping_list: data || null })
    }

    const { data, error } = await supabase
      .from("shopping_lists")
      .select("*")
      .eq("user_id", user.id)
      .eq("week_start", weekStart)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return NextResponse.json({ shopping_list: data || null })
  } catch (error) {
    console.error("Shopping list fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch shopping list" },
      { status: 500 }
    )
  }
}
