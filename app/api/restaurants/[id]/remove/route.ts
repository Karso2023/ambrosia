import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/server"

export async function DELETE(
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

    const { error } = await supabase
      .from("user_saved_restaurants")
      .delete()
      .eq("user_id", user.id)
      .eq("restaurant_id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Remove restaurant error:", error)
    return NextResponse.json(
      { error: "Failed to remove restaurant" },
      { status: 500 }
    )
  }
}
