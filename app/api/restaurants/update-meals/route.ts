import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/server"

interface MealUpdate {
  day: number
  mealType: "breakfast" | "lunch" | "dinner"
  newMeal: {
    meal_name: string
    cost: number
    nutrition: {
      calories: number
      protein: number
      carbs: number
      fat: number
      fiber: number
      level: "high" | "medium" | "low"
    }
    ingredients?: string[]
    instructions?: string[]
    cooking_time?: number
    difficulty?: string
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { updates } = (await req.json()) as { updates: MealUpdate[] }

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 })
    }

    // Get current month's plan
    const now = new Date()
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

    const { data: planRecord, error: fetchError } = await supabase
      .from("user_meal_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("month_year", monthYear)
      .single()

    if (fetchError || !planRecord) {
      return NextResponse.json(
        { error: "No meal plan found for current month" },
        { status: 404 }
      )
    }

    const planData = planRecord.plan_data

    // Apply updates to schedule
    for (const update of updates) {
      const dayIndex = planData.schedule.findIndex(
        (d: any) => d.day === update.day
      )

      if (dayIndex === -1) continue

      planData.schedule[dayIndex][update.mealType] = {
        type: "cook",
        meal_name: update.newMeal.meal_name,
        cost: update.newMeal.cost,
        nutrition: update.newMeal.nutrition,
        ingredients: update.newMeal.ingredients || [],
        instructions: update.newMeal.instructions || [],
        cooking_time: update.newMeal.cooking_time || 15,
        difficulty: update.newMeal.difficulty || "easy",
      }
    }

    // Save updated plan
    const { error: updateError } = await supabase
      .from("user_meal_plans")
      .update({ plan_data: planData })
      .eq("user_id", user.id)
      .eq("month_year", monthYear)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      updated_meals: updates.length,
      plan_data: planData,
    })
  } catch (error) {
    console.error("Update meals error:", error)
    return NextResponse.json(
      { error: "Failed to update meals" },
      { status: 500 }
    )
  }
}
