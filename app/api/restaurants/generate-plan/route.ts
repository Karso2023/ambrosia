import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/server"
import { hashPreferences } from "@/lib/gemini/restaurant-analysis"
import { generateDailyRecipes, type RecipeMeal } from "@/lib/gemini/recipe-generation"
import type { UserPreferences, MealPreference } from "@/lib/preferences"

interface MealDetail {
  type: "cook" | "restaurant"
  restaurant_id?: string
  restaurant_name?: string
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
  recipe_url?: string
  instructions?: string[]
  ingredients?: string[]
  cooking_time?: number
  difficulty?: string
}

interface DaySchedule {
  day: number
  breakfast: MealDetail
  lunch: MealDetail
  dinner: MealDetail
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

    // Get preferences from user metadata
    const preferences: UserPreferences = {
      postcode: user.user_metadata?.postcode ?? "",
      budget: user.user_metadata?.budget ?? "",
      religion: user.user_metadata?.religion ?? [],
      dietary_restrictions: user.user_metadata?.dietary_restrictions ?? [],
      meal_preference: (user.user_metadata?.meal_preference ?? "cook") as MealPreference,
    }

    // Get saved restaurants for eat_out and mix preferences
    const { data: savedRestaurants } = await supabase
      .from("user_saved_restaurants")
      .select(
        `
        *,
        restaurant:restaurants(*)
      `
      )
      .eq("user_id", user.id)
      .order("preference_rank", { ascending: true })

    // Fetch analyses for saved restaurants
    let analysisMap = new Map()
    if (savedRestaurants && savedRestaurants.length > 0) {
      const prefsHash = hashPreferences(preferences)
      const restaurantIds = savedRestaurants.map((sr) => sr.restaurant_id)

      const { data: analyses } = await supabase
        .from("restaurant_analyses")
        .select("*")
        .in("restaurant_id", restaurantIds)
        .eq("user_preferences_hash", prefsHash)

      analysisMap = new Map(analyses?.map((a) => [a.restaurant_id, a]) || [])
    }

    // Smart fallback logic: Check restaurant quality
    let effectivePreference = preferences.meal_preference
    let autoSwitchedToCook = false

    if (preferences.meal_preference === "eat_out" || preferences.meal_preference === "mix") {
      // Calculate average fit score of saved restaurants
      const fitScores = Array.from(analysisMap.values()).map(a => a.fit_score || 0)
      const avgFitScore = fitScores.length > 0
        ? fitScores.reduce((sum, score) => sum + score, 0) / fitScores.length
        : 0

      // Check if we have good quality restaurants
      const hasGoodMatches = fitScores.filter(score => score >= 70).length >= 2
      const hasSufficientRestaurants = (savedRestaurants?.length || 0) >= 4

      // Auto-switch to cooking if:
      // 1. No restaurants saved, OR
      // 2. Average fit score < 70%, OR
      // 3. Less than 2 restaurants with 70%+ fit
      if (!savedRestaurants || savedRestaurants.length === 0 || avgFitScore < 70 || !hasGoodMatches) {
        effectivePreference = "cook"
        autoSwitchedToCook = true

        console.log(`Auto-switched to cooking mode: avgFit=${avgFitScore.toFixed(1)}%, saved=${savedRestaurants?.length || 0}, goodMatches=${fitScores.filter(s => s >= 70).length}`)
      } else if (!hasSufficientRestaurants && preferences.meal_preference === "eat_out") {
        // If eat_out but not enough restaurants, switch to mix (some cooking, some eating out)
        effectivePreference = "mix"
        autoSwitchedToCook = true

        console.log(`Auto-switched to mix mode: insufficient restaurants (${savedRestaurants.length}/4)`)
      }
    }

    // Update preferences with effective choice
    const effectivePreferences = {
      ...preferences,
      meal_preference: effectivePreference as MealPreference
    }

    // Generate meal plan based on effective preference
    const plan = await generateMealPlan(
      effectivePreferences,
      savedRestaurants || [],
      analysisMap
    )

    // Get current month_year
    const now = new Date()
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

    // Store meal plan
    const { data: mealPlan, error: planError } = await supabase
      .from("user_meal_plans")
      .upsert(
        {
          user_id: user.id,
          month_year: monthYear,
          plan_data: plan,
        },
        { onConflict: "user_id,month_year" }
      )
      .select()
      .single()

    if (planError) throw planError

    // Return with info about auto-switching if it happened
    return NextResponse.json({
      meal_plan: mealPlan,
      auto_switched: autoSwitchedToCook,
      original_preference: preferences.meal_preference,
      effective_preference: effectivePreference,
      message: autoSwitchedToCook
        ? preferences.meal_preference === "eat_out"
          ? "We couldn't find enough suitable restaurants (70%+ match), so we've created a cook-at-home plan instead. This will save you more money and better match your dietary needs!"
          : "Restaurant matches were below 70% quality, so we've prioritized home cooking for better nutrition and budget."
        : undefined
    })
  } catch (error) {
    console.error("Generate meal plan error:", error)
    return NextResponse.json(
      { error: "Failed to generate meal plan" },
      { status: 500 }
    )
  }
}

async function generateMealPlan(
  preferences: UserPreferences,
  savedRestaurants: any[],
  analysisMap: Map<string, any>
) {
  const schedule: DaySchedule[] = []

  if (preferences.meal_preference === "cook") {
    // Generate 30 days of home-cooked meals
    const dailyRecipes = await generateDailyRecipes(preferences, 30)

    for (let day = 1; day <= 30; day++) {
      const dayRecipes = dailyRecipes[day - 1]
      schedule.push({
        day,
        breakfast: convertRecipeToMeal(dayRecipes.breakfast),
        lunch: convertRecipeToMeal(dayRecipes.lunch),
        dinner: convertRecipeToMeal(dayRecipes.dinner),
      })
    }

    return {
      month_year: new Date().toISOString().slice(0, 7),
      total_meals: 90,
      restaurants_used: 0,
      schedule,
      generated_at: new Date().toISOString(),
    }
  } else if (preferences.meal_preference === "eat_out") {
    // All 3 meals from restaurants for 30 days
    for (let day = 1; day <= 30; day++) {
      const breakfast = selectRestaurantMeal(savedRestaurants, analysisMap, "breakfast")
      const lunch = selectRestaurantMeal(savedRestaurants, analysisMap, "lunch")
      const dinner = selectRestaurantMeal(savedRestaurants, analysisMap, "dinner")

      schedule.push({ day, breakfast, lunch, dinner })
    }

    return {
      month_year: new Date().toISOString().slice(0, 7),
      total_meals: 90,
      restaurants_used: savedRestaurants.length,
      schedule,
      generated_at: new Date().toISOString(),
    }
  } else {
    // Mix: prioritize cooking (2 home-cooked, 1 restaurant per day)
    const dailyRecipes = await generateDailyRecipes(preferences, 30)

    for (let day = 1; day <= 30; day++) {
      const dayRecipes = dailyRecipes[day - 1]

      // Cook breakfast and lunch, eat out for dinner (more budget-friendly)
      schedule.push({
        day,
        breakfast: convertRecipeToMeal(dayRecipes.breakfast),
        lunch: convertRecipeToMeal(dayRecipes.lunch),
        dinner: selectRestaurantMeal(savedRestaurants, analysisMap, "dinner"),
      })
    }

    return {
      month_year: new Date().toISOString().slice(0, 7),
      total_meals: 90,
      restaurants_used: savedRestaurants.length,
      schedule,
      generated_at: new Date().toISOString(),
    }
  }
}

function convertRecipeToMeal(recipe: RecipeMeal): MealDetail {
  return {
    type: "cook",
    meal_name: recipe.meal_name,
    cost: recipe.cost,
    nutrition: recipe.nutrition,
    recipe_url: recipe.recipe_url,
    instructions: recipe.instructions,
    ingredients: recipe.ingredients,
    cooking_time: recipe.cooking_time,
    difficulty: recipe.difficulty,
  }
}

function selectRestaurantMeal(
  savedRestaurants: any[],
  analysisMap: Map<string, any>,
  mealType: "breakfast" | "lunch" | "dinner"
): MealDetail {
  // Select random restaurant weighted by fit score
  const sorted = savedRestaurants.sort((a, b) => {
    const scoreA = analysisMap.get(a.restaurant_id)?.fit_score || 50
    const scoreB = analysisMap.get(b.restaurant_id)?.fit_score || 50
    return scoreB - scoreA
  })

  // Weighted random selection
  const weights = sorted.map((sr) => {
    const analysis = analysisMap.get(sr.restaurant_id)
    return (analysis?.fit_score || 50) / 100
  })

  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  let random = Math.random() * totalWeight

  let selectedIndex = 0
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i]
    if (random <= 0) {
      selectedIndex = i
      break
    }
  }

  const selected = sorted[selectedIndex]
  const restaurant = selected.restaurant
  const analysis = analysisMap.get(selected.restaurant_id)

  // Generate meal suggestion based on meal type and cuisine
  const mealSuggestion = generateMealSuggestion(
    restaurant.cuisine_types?.[0] || "Restaurant",
    mealType,
    restaurant.price_level || 2
  )

  return {
    type: "restaurant",
    restaurant_id: selected.restaurant_id,
    restaurant_name: restaurant.name,
    meal_name: mealSuggestion.name,
    cost: mealSuggestion.cost,
    nutrition: {
      calories: mealSuggestion.calories,
      protein: mealSuggestion.protein,
      carbs: mealSuggestion.carbs,
      fat: mealSuggestion.fat,
      fiber: mealSuggestion.fiber,
      level: analysis?.nutrition_estimate || "medium",
    },
  }
}

function generateMealSuggestion(
  cuisineType: string,
  mealType: "breakfast" | "lunch" | "dinner",
  priceLevel: number
) {
  // Price calculations based on meal type and restaurant price level
  const basePrices = {
    breakfast: { 1: 5, 2: 8, 3: 12, 4: 18 },
    lunch: { 1: 8, 2: 12, 3: 18, 4: 28 },
    dinner: { 1: 12, 2: 18, 3: 28, 4: 45 },
  }

  const cost = basePrices[mealType][priceLevel as 1 | 2 | 3 | 4] || basePrices[mealType][2]

  // Meal suggestions by cuisine and meal type
  const mealDatabase: Record<
    string,
    Record<string, { name: string; calories: number; protein: number; carbs: number; fat: number; fiber: number }>
  > = {
    breakfast: {
      British: { name: "Full English Breakfast", calories: 650, protein: 30, carbs: 50, fat: 35, fiber: 6 },
      Indian: { name: "Masala Dosa", calories: 450, protein: 12, carbs: 65, fat: 15, fiber: 8 },
      Chinese: { name: "Congee with sides", calories: 350, protein: 15, carbs: 55, fat: 8, fiber: 4 },
      Italian: { name: "Cappuccino & Croissant", calories: 400, protein: 10, carbs: 50, fat: 18, fiber: 3 },
      default: { name: "Breakfast Special", calories: 450, protein: 20, carbs: 50, fat: 18, fiber: 5 },
    },
    lunch: {
      British: { name: "Fish & Chips", calories: 850, protein: 35, carbs: 80, fat: 40, fiber: 6 },
      Indian: { name: "Chicken Tikka with Rice", calories: 650, protein: 40, carbs: 70, fat: 18, fiber: 8 },
      Chinese: { name: "Sweet & Sour Chicken", calories: 700, protein: 35, carbs: 85, fat: 22, fiber: 5 },
      Italian: { name: "Pasta Carbonara", calories: 750, protein: 28, carbs: 90, fat: 28, fiber: 4 },
      Mediterranean: { name: "Falafel Wrap", calories: 550, protein: 20, carbs: 65, fat: 22, fiber: 12 },
      default: { name: "Lunch Special", calories: 650, protein: 30, carbs: 70, fat: 22, fiber: 6 },
    },
    dinner: {
      British: { name: "Steak & Ale Pie", calories: 900, protein: 40, carbs: 75, fat: 42, fiber: 6 },
      Indian: { name: "Lamb Curry with Naan", calories: 850, protein: 45, carbs: 80, fat: 35, fiber: 10 },
      Chinese: { name: "Kung Pao Chicken", calories: 750, protein: 38, carbs: 70, fat: 28, fiber: 6 },
      Italian: { name: "Lasagna", calories: 850, protein: 38, carbs: 75, fat: 38, fiber: 5 },
      Japanese: { name: "Teriyaki Salmon Bowl", calories: 650, protein: 42, carbs: 70, fat: 18, fiber: 8 },
      Mediterranean: { name: "Grilled Sea Bass", calories: 550, protein: 45, carbs: 40, fat: 18, fiber: 8 },
      default: { name: "Dinner Special", calories: 750, protein: 35, carbs: 70, fat: 30, fiber: 6 },
    },
  }

  const meals = mealDatabase[mealType]
  const meal = meals[cuisineType] || meals["default"]

  return {
    name: meal.name,
    cost,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    fiber: meal.fiber,
  }
}
