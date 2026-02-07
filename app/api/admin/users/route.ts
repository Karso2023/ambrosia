import { NextResponse } from "next/server"
import { createClient } from "@/lib/server"

export async function GET() {
  try {
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

    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, name, email, role, banned, created_at, illegal_prompt_logs(count)")
      .neq("role", "admin")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    const formatted = (users ?? []).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      banned: u.banned,
      created_at: u.created_at,
      violation_count: (u.illegal_prompt_logs as { count: number }[])?.[0]?.count ?? 0,
    }))

    return NextResponse.json({ users: formatted })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
