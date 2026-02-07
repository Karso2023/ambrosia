import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/server"
import { chatWithNudgeAI, type ChatContext } from "@/lib/gemini/nudge-chat"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, context: clientContext } = await req.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Build server-side context with real data
    const today = new Date().toISOString().split("T")[0]

    // Get today's activities
    const { data: todayActivities } = await supabase
      .from("user_activity")
      .select("*")
      .eq("user_id", user.id)
      .eq("activity_date", today)

    // Get recent stats
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentActivities } = await supabase
      .from("user_activity")
      .select("*")
      .eq("user_id", user.id)
      .gte("activity_date", sevenDaysAgo.toISOString().split("T")[0])
      .eq("activity_type", "meal_completed")

    const totalMealsCooked = recentActivities?.length || 0

    // Get today's meal plan
    const now = new Date()
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    const { data: planData } = await supabase
      .from("user_meal_plans")
      .select("plan_data")
      .eq("user_id", user.id)
      .eq("month_year", monthYear)
      .single()

    const todayDay = now.getDate()
    const todaySchedule = planData?.plan_data?.schedule?.find(
      (d: any) => d.day === todayDay
    )

    const todayPlanSummary = todaySchedule
      ? `Today's plan: Breakfast: ${todaySchedule.breakfast.meal_name} (£${todaySchedule.breakfast.cost}), Lunch: ${todaySchedule.lunch.meal_name} (£${todaySchedule.lunch.cost}), Dinner: ${todaySchedule.dinner.meal_name} (£${todaySchedule.dinner.cost})`
      : ""

    // Build completed meals map
    const completedMeals = {
      breakfast: false as boolean | "missed",
      lunch: false as boolean | "missed",
      dinner: false as boolean | "missed",
    }

    todayActivities?.forEach((a) => {
      if (a.activity_type === "meal_completed") {
        const mt = a.metadata?.meal_type as keyof typeof completedMeals
        if (mt && mt in completedMeals) completedMeals[mt] = true
      }
      if (a.activity_type === "meal_missed") {
        const mt = a.metadata?.meal_type as keyof typeof completedMeals
        if (mt && mt in completedMeals) completedMeals[mt] = "missed"
      }
    })

    // Get mood
    const moodActivity = todayActivities?.find(
      (a) => a.activity_type === "mood_logged"
    )

    const chatContext: ChatContext = {
      mood: clientContext?.mood || moodActivity?.metadata?.mood,
      stats: {
        total_meals_cooked: totalMealsCooked,
        current_streak: clientContext?.stats?.current_streak || 0,
        total_saved: totalMealsCooked * 8,
        adherence_rate: clientContext?.stats?.adherence_rate || 0,
      },
      todayMeals: completedMeals,
      missedMeal: clientContext?.missedMeal,
      todayPlanSummary,
      conversationHistory: clientContext?.conversationHistory || [],
      userPreferences: {
        budget: user.user_metadata?.budget || "",
        dietary_restrictions: user.user_metadata?.dietary_restrictions || [],
        religion: user.user_metadata?.religion || [],
      },
    }

    const response = await chatWithNudgeAI(chatContext, message)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Nudge chat error:", error)
    return NextResponse.json(
      { error: "Failed to process chat" },
      { status: 500 }
    )
  }
}
