import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date().toISOString().split('T')[0]

    // Get all today's meal activities (completed and missed)
    const { data: activities } = await supabase
      .from("user_activity")
      .select("activity_type, metadata")
      .eq("user_id", user.id)
      .eq("activity_date", today)
      .in("activity_type", ["meal_completed", "meal_missed"])

    const completedMeals: Record<string, boolean | "missed"> = {
      breakfast: false,
      lunch: false,
      dinner: false
    }

    activities?.forEach(a => {
      const mealType = a.metadata?.meal_type
      if (mealType && mealType in completedMeals) {
        if (a.activity_type === "meal_completed") {
          completedMeals[mealType] = true
        } else if (a.activity_type === "meal_missed") {
          completedMeals[mealType] = "missed"
        }
      }
    })

    // Also get today's mood
    const { data: moodActivity } = await supabase
      .from("user_activity")
      .select("metadata")
      .eq("user_id", user.id)
      .eq("activity_date", today)
      .eq("activity_type", "mood_logged")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      completedMeals,
      todayMood: moodActivity?.metadata?.mood || null
    })
  } catch (error) {
    console.error("Error fetching today's meals:", error)
    return NextResponse.json({
      completedMeals: { breakfast: false, lunch: false, dinner: false },
      todayMood: null
    })
  }
}
