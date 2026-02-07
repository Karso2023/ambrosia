import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/server"

export async function GET(
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

    const { data: restaurant, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", id)
      .single()

    if (error) throw error

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
    }

    return NextResponse.json({ restaurant })
  } catch (error) {
    console.error("Get restaurant error:", error)
    return NextResponse.json(
      { error: "Failed to fetch restaurant details" },
      { status: 500 }
    )
  }
}
