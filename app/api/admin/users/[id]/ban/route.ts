import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/server"

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check that user has > 5 violations before allowing ban
    const { count } = await supabase
      .from("illegal_prompt_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", targetUserId)

    if ((count ?? 0) <= 5) {
      return NextResponse.json(
        { error: "User must have more than 5 violations to be banned" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("profiles")
      .update({ banned: true })
      .eq("id", targetUserId)

    if (error) {
      console.error("Error banning user:", error)
      return NextResponse.json({ error: "Failed to ban user" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
