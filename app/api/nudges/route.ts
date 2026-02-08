import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/server"
import { getNudgeMessage, getMotivationalTip, type NudgeContext } from "@/lib/nudges/messages"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user activity for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: activities } = await supabase
      .from("user_activity")
      .select("*")
      .eq("user_id", user.id)
      .gte("activity_date", thirtyDaysAgo.toISOString().split('T')[0])
      .order("activity_date", { ascending: false })

    // Calculate metrics
    const mealCompletedActivities = (activities || []).filter(
      a => a.activity_type === 'meal_completed'
    )

    const totalMealsCompleted = mealCompletedActivities.length

    // Calculate adherence rate (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentMeals = mealCompletedActivities.filter(
      a => new Date(a.activity_date) >= sevenDaysAgo
    )
    const adherenceRate = recentMeals.length / 21 // max 3 meals/day * 7 days

    // Calculate missed days
    const lastActivity = mealCompletedActivities[0]
    const lastActiveDate = lastActivity ? new Date(lastActivity.activity_date) : null
    const now = new Date()
    const missedDays = lastActiveDate
      ? Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999

    // Calculate current streak
    let currentStreak = 0
    const uniqueDates = [...new Set(mealCompletedActivities.map(a => a.activity_date))].sort().reverse()
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
      for (const date of uniqueDates) {
        const checkDate = new Date()
        checkDate.setDate(checkDate.getDate() - currentStreak)
        if (date === checkDate.toISOString().split('T')[0]) {
          currentStreak++
        } else {
          break
        }
      }
    }

    const totalSaved = totalMealsCompleted * 8 // avg £8 saved per meal

    // Get today's mood and meals
    const todayStr = new Date().toISOString().split('T')[0]
    const todayActivities = (activities || []).filter(a => a.activity_date === todayStr)
    const todayMealsCompleted = todayActivities.filter(a => a.activity_type === 'meal_completed').length
    const todayMoodActivity = todayActivities.find(a => a.activity_type === 'mood_logged')
    const currentMood = todayMoodActivity?.metadata?.mood

    const context: NudgeContext = {
      missedDays,
      lastActive: lastActiveDate,
      adherenceRate,
      totalMealsCompleted,
      currentStreak,
      totalSaved,
      todayMealsCompleted,
      currentMood
    }

    const nudge = getNudgeMessage(context)
    const tip = getMotivationalTip()

    return NextResponse.json({
      nudge,
      tip,
      stats: {
        total_meals_cooked: totalMealsCompleted,
        current_streak: currentStreak,
        total_saved: totalSaved,
        adherence_rate: Math.round(adherenceRate * 100),
        missed_days: missedDays
      }
    })
  } catch (error) {
    console.error("Nudge fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch nudges" },
      { status: 500 }
    )
  }
}

// Track meal completion
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { activity_type, metadata } = await req.json()

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from("user_activity")
      .insert({
        user_id: user.id,
        activity_type,
        activity_date: today,
        metadata: metadata || {}
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ activity: data })
  } catch (error) {
    console.error("Activity tracking error:", error)
    return NextResponse.json(
      { error: "Failed to track activity" },
      { status: 500 }
    )
  }
}
