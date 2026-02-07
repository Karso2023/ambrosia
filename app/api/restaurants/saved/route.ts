import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("user_saved_restaurants")
      .select(
        `
        *,
        restaurant:restaurants(*)
      `
      )
      .eq("user_id", user.id)
      .order("preference_rank", { ascending: true })

    if (error) throw error

    return NextResponse.json({ saved_restaurants: data || [] })
  } catch (error) {
    console.error("Get saved restaurants error:", error)
    return NextResponse.json(
      { error: "Failed to fetch saved restaurants" },
      { status: 500 }
    )
  }
}
