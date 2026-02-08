import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/server"
import {
  aggregateIngredients,
  estimateTotalCost,
  sortItemsByAisle,
  type ShoppingItem
} from "@/lib/shopping-list/generator"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the current week's start date (Monday)
    const today = new Date()
    const dayOfWeek = today.getDay()
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    const weekStart = new Date(today.setDate(diff))
    weekStart.setHours(0, 0, 0, 0)
    const weekStartStr = weekStart.toISOString().split('T')[0]

    // Get user's current meal plan
    const currentMonth = new Date().toISOString().slice(0, 7)
    const { data: mealPlanData } = await supabase
      .from("user_meal_plans")
      .select("plan_data")
      .eq("user_id", user.id)
      .eq("month_year", currentMonth)
      .single()

    if (!mealPlanData || !mealPlanData.plan_data) {
      return NextResponse.json(
        { error: "No meal plan found. Please generate a meal plan first." },
        { status: 404 }
      )
    }

    const mealPlan = mealPlanData.plan_data
    const schedule = mealPlan.schedule || []

    // Get next 7 days of meals (for current week)
    const currentDay = new Date().getDate()
    const weekMeals: Array<{ id: string; ingredients: string[]; cost: number }> = []

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const targetDay = currentDay + dayOffset
      const daySchedule = schedule.find((d: any) => d.day === targetDay)

      if (daySchedule) {
        // Process breakfast, lunch, dinner
        ;['breakfast', 'lunch', 'dinner'].forEach(mealType => {
          const meal = daySchedule[mealType]
          if (meal && meal.type === 'cook' && meal.ingredients) {
            weekMeals.push({
              id: `day${daySchedule.day}-${mealType}`,
              ingredients: meal.ingredients,
              cost: meal.cost
            })
          }
        })
      }
    }

    if (weekMeals.length === 0) {
      return NextResponse.json(
        { error: "No cook-at-home meals found for this week." },
        { status: 404 }
      )
    }

    // Aggregate ingredients
    let items = aggregateIngredients(weekMeals)

    // Load user's saved staples
    const { data: existingList } = await supabase
      .from("shopping_lists")
      .select("common_staples")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    const savedStaples = existingList?.common_staples || []

    // Mark saved staples
    items = items.map(item => ({
      ...item,
      is_staple: savedStaples.some((s: any) => s.name.toLowerCase() === item.name.toLowerCase())
    }))

    // Sort by aisle
    items = sortItemsByAisle(items)

    // Calculate total cost
    const totalCost = estimateTotalCost(items, weekMeals.map(m => m.cost))

    // Save to database
    const { data: shoppingList, error: saveError } = await supabase
      .from("shopping_lists")
      .upsert(
        {
          user_id: user.id,
          week_start: weekStartStr,
          items,
          common_staples: savedStaples,
          total_estimated_cost: totalCost
        },
        { onConflict: "user_id,week_start" }
      )
      .select()
      .single()

    if (saveError) throw saveError

    return NextResponse.json({
      shopping_list: shoppingList,
      items,
      total_estimated_cost: totalCost,
      week_start: weekStartStr
    })
  } catch (error) {
    console.error("Shopping list generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate shopping list" },
      { status: 500 }
    )
  }
}
