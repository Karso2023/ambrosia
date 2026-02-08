import { geminiModel } from "./client"
import type { UserPreferences } from "../preferences"

export interface RecipeMeal {
  meal_name: string
  description: string
  ingredients: string[]
  cooking_time: number // minutes
  difficulty: "easy" | "medium" | "hard"
  difficulty_score: number // 1-5 scale (1=easiest)
  cost: number // estimated in GBP
  nutrition: {
    calories: number
    protein: number // grams
    carbs: number // grams
    fat: number // grams
    fiber: number // grams
    level: "high" | "medium" | "low"
  }
  tags: string[] // ["5-ingredient", "one-pan", "no-oven", "quick", "budget"]
  steps_with_timings: Array<{
    step: string
    timing: string // "5 minutes"
    is_active: boolean // true = active cooking, false = waiting/resting
  }>
  recipe_url?: string
  instructions?: string[]
}

export interface DailyRecipes {
  breakfast: RecipeMeal
  lunch: RecipeMeal
  dinner: RecipeMeal
}

function buildRecipePrompt(
  preferences: UserPreferences,
  mealType: "breakfast" | "lunch" | "dinner",
  daysToGenerate: number
): string {
  const dietaryInfo = [
    ...preferences.dietary_restrictions,
    ...preferences.religion,
  ].join(", ")

  const budgetGuideline = getBudgetGuideline(preferences.budget)

  return `You are a nutrition and meal planning expert. Generate ${daysToGenerate} DIFFERENT ${mealType} meal suggestions for home cooking.

USER REQUIREMENTS:
- Dietary restrictions/religion: ${dietaryInfo || "None"}
- Budget: ${preferences.budget} (${budgetGuideline})
- Must be easy to cook at home
- Must be nutritious and healthy

CRITICAL RULES:
1. ${preferences.religion.includes("Halal") ? "ONLY Halal ingredients. NO pork, NO alcohol, NO non-halal meat." : ""}
2. ${preferences.dietary_restrictions.includes("Vegan") ? "ONLY vegan ingredients. NO animal products." : ""}
3. ${preferences.dietary_restrictions.includes("Vegetarian") ? "ONLY vegetarian ingredients. NO meat or fish." : ""}
4. Every meal must be DIFFERENT - no repetition
5. Prioritize high-nutrition, low-cost meals
6. Include realistic UK grocery prices
7. Cooking time should be 15-45 minutes

For each meal, provide:
- meal_name: Clear, appetizing name
- description: Brief 1-sentence description
- ingredients: Array of ingredients with quantities (try to keep under 8 ingredients)
- cooking_time: Total minutes to prepare and cook
- difficulty: "easy", "medium", or "hard"
- difficulty_score: 1-5 scale (1=very easy, 5=complex)
- cost: Estimated cost in GBP (groceries only)
- nutrition: {
    calories: number (aim 300-500 breakfast, 400-600 lunch, 500-700 dinner)
    protein: grams
    carbs: grams
    fat: grams
    fiber: grams
    level: "high" (vegetables, lean protein, whole grains), "medium" (balanced), or "low" (processed, high sugar/fat)
  }
- tags: Array of applicable tags from ["5-ingredient", "one-pan", "no-oven", "quick", "budget", "make-ahead", "freezer-friendly"]
  * "5-ingredient" if 5 or fewer main ingredients (excluding basics like salt, oil)
  * "one-pan" if uses only one pot/pan
  * "no-oven" if stovetop or microwave only
  * "quick" if under 20 minutes total
  * "budget" if under £3 per portion
  * "make-ahead" if can be prepped in advance
  * "freezer-friendly" if freezes well
- steps_with_timings: Array of steps with individual timings like:
  [
    {step: "Chop onions and garlic", timing: "3 minutes", is_active: true},
    {step: "Sauté onions until soft", timing: "5 minutes", is_active: true},
    {step: "Let simmer", timing: "10 minutes", is_active: false}
  ]
- instructions: Array of step-by-step cooking instructions (for reference)

Return ONLY valid JSON array of ${daysToGenerate} meals, no other text:
[
  {
    "meal_name": "...",
    "description": "...",
    "ingredients": ["...", "..."],
    "cooking_time": 30,
    "difficulty": "easy",
    "difficulty_score": 2,
    "cost": 4.50,
    "nutrition": {
      "calories": 450,
      "protein": 25,
      "carbs": 55,
      "fat": 12,
      "fiber": 8,
      "level": "high"
    },
    "tags": ["one-pan", "budget"],
    "steps_with_timings": [
      {"step": "...", "timing": "5 minutes", "is_active": true}
    ],
    "instructions": ["...", "..."]
  }
]`
}

function getBudgetGuideline(budget: string): string {
  const budgetNum = parseInt(budget.replace(/[^0-9]/g, ""))

  if (budgetNum < 150) {
    return "Very tight - use cheap staples like rice, pasta, eggs, frozen vegetables"
  } else if (budgetNum < 250) {
    return "Moderate - balance affordability with nutrition, use seasonal produce"
  } else {
    return "Comfortable - can include premium ingredients occasionally"
  }
}

export async function generateRecipes(
  preferences: UserPreferences,
  mealType: "breakfast" | "lunch" | "dinner",
  count: number
): Promise<RecipeMeal[]> {
  try {
    const prompt = buildRecipePrompt(preferences, mealType, count)

    const result = await geminiModel.generateContent(prompt)
    const responseText = result.response.text()

    // Extract JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error("Failed to parse recipe JSON from Gemini response")
    }

    const recipes: RecipeMeal[] = JSON.parse(jsonMatch[0])

    // Validate each recipe
    return recipes.map((recipe) => ({
      ...recipe,
      // Ensure nutrition level is set correctly based on values
      nutrition: {
        ...recipe.nutrition,
        level: determineNutritionLevel(recipe.nutrition),
      },
    }))
  } catch (error) {
    console.error("Recipe generation error:", error)
    throw new Error("Failed to generate recipes")
  }
}

function determineNutritionLevel(nutrition: {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}): "high" | "medium" | "low" {
  // High nutrition: high protein, high fiber, balanced macros
  const proteinRatio = nutrition.protein / (nutrition.calories / 4)
  const fiberScore = nutrition.fiber >= 5 ? 1 : 0
  const fatRatio = nutrition.fat / (nutrition.calories / 9)

  if (proteinRatio > 0.15 && fiberScore === 1 && fatRatio < 0.3) {
    return "high"
  } else if (proteinRatio > 0.1 && fatRatio < 0.35) {
    return "medium"
  } else {
    return "low"
  }
}

export async function generateDailyRecipes(
  preferences: UserPreferences,
  days: number
): Promise<DailyRecipes[]> {
  try {
    // Generate recipes for all meal types in parallel
    const [breakfasts, lunches, dinners] = await Promise.all([
      generateRecipes(preferences, "breakfast", days),
      generateRecipes(preferences, "lunch", days),
      generateRecipes(preferences, "dinner", days),
    ])

    // Combine into daily meal plans
    return Array.from({ length: days }, (_, i) => ({
      breakfast: breakfasts[i],
      lunch: lunches[i],
      dinner: dinners[i],
    }))
  } catch (error) {
    console.error("Daily recipe generation error:", error)
    throw new Error("Failed to generate daily recipes")
  }
}
