import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/server"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { preference_rank } = await req.json().catch(() => ({ preference_rank: 1 }))

    // Check if already saved
    const { data: existing } = await supabase
      .from("user_saved_restaurants")
      .select("*")
      .eq("user_id", user.id)
      .eq("restaurant_id", id)
      .single()

    if (existing) {
      // Update preference rank
      const { error } = await supabase
        .from("user_saved_restaurants")
        .update({ preference_rank })
        .eq("id", existing.id)

      if (error) throw error

      return NextResponse.json({ success: true, updated: true })
    }

    // Check limit (max 12 saved restaurants)
    const { count } = await supabase
      .from("user_saved_restaurants")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    if (count && count >= 12) {
      return NextResponse.json(
        { error: "Maximum 12 saved restaurants reached. Remove one to add more." },
        { status: 400 }
      )
    }

    // Insert new saved restaurant
    const { error } = await supabase.from("user_saved_restaurants").insert({
      user_id: user.id,
      restaurant_id: id,
      preference_rank,
    })

    if (error) throw error

    return NextResponse.json({ success: true, updated: false })
  } catch (error) {
    console.error("Save restaurant error:", error)
    return NextResponse.json(
      { error: "Failed to save restaurant" },
      { status: 500 }
    )
  }
}
