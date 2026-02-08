import { geminiModel } from "./client"
import type { UserPreferences } from "@/lib/preferences"
import type { PlaceDetails } from "@/lib/google/places"

export interface RestaurantAnalysis {
  fitScore: number
  summary: string
  matchesDietary: boolean
  matchesBudget: boolean
  nutritionEstimate: "high" | "medium" | "low"
}

export async function analyzeRestaurant(
  restaurant: PlaceDetails,
  preferences: UserPreferences
): Promise<RestaurantAnalysis> {
  const prompt = buildAnalysisPrompt(restaurant, preferences)

  try {
    const result = await geminiModel.generateContent(prompt)
    const response = result.response.text().trim()

    return parseAnalysisResponse(response)
  } catch (error) {
    console.error("Gemini analysis error:", error)
    // Fallback to basic analysis
    return {
      fitScore: 50,
      summary: "Unable to analyze restaurant at this time.",
      matchesDietary: true,
      matchesBudget: true,
      nutritionEstimate: "medium",
    }
  }
}

function buildAnalysisPrompt(restaurant: PlaceDetails, preferences: UserPreferences): string {
  const reviews = restaurant.reviews
    ?.slice(0, 3)
    .map((r) => `"${r.text.slice(0, 200)}" (${r.rating}/5)`)
    .join("\n") || "No reviews available"

  const cuisineTypes = restaurant.types?.join(", ") || "Unknown"
  const priceLevel = restaurant.price_level || 2
  const budgetNum = parseFloat(preferences.budget) || 400

  const hasHalal = preferences.religion.includes("Halal")
  const isVegetarian = preferences.dietary_restrictions.includes("Vegetarian")
  const isVegan = preferences.dietary_restrictions.includes("Vegan")

  return `You are analyzing whether a restaurant is a good fit for a user with STRICT dietary and religious requirements.

**Restaurant:**
- Name: ${restaurant.name}
- Cuisine: ${cuisineTypes}
- Price Level: ${priceLevel}/4 (1=cheap, 4=expensive)
- Rating: ${restaurant.rating || "N/A"}/5
- Reviews (top 3):
${reviews}

**User Requirements:**
- Monthly Budget: £${budgetNum}
- Meal Preference: ${preferences.meal_preference}
- Dietary Restrictions: ${preferences.dietary_restrictions.join(", ") || "None"}
- Religious Requirements: ${preferences.religion.join(", ") || "None"}

**CRITICAL RULES:**
${hasHalal ? "- User requires HALAL food. If this restaurant serves pork, alcohol, or non-halal meat, set fitScore to 0 and matchesDietary to false. NEVER recommend haram food." : ""}
${isVegan ? "- User is VEGAN. If restaurant doesn't clearly offer vegan options, set fitScore below 30." : ""}
${isVegetarian ? "- User is VEGETARIAN. If restaurant doesn't offer vegetarian options, set fitScore below 30." : ""}
- Only recommend restaurants that CLEARLY match the user's requirements
- Be strict about religious and dietary requirements

**TASK:**
1. Check if restaurant matches dietary/religious requirements (be VERY strict)
2. Estimate budget fit (price level ${priceLevel} for monthly budget £${budgetNum})
3. Estimate nutrition value (high/medium/low)
4. Give overall fit score (0-100, where 0 = completely unsuitable)

**RESPONSE FORMAT (JSON only, no other text):**
{
  "fitScore": <number 0-100>,
  "summary": "<1-2 sentence explanation>",
  "matchesDietary": <true/false>,
  "matchesBudget": <true/false>,
  "nutritionEstimate": "<high|medium|low>"
}

Return ONLY valid JSON. No markdown, no code blocks, no extra text.`
}

function parseAnalysisResponse(response: string): RestaurantAnalysis {
  try {
    // Remove markdown code blocks if present
    const cleaned = response
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim()

    const parsed = JSON.parse(cleaned)

    return {
      fitScore: Math.max(0, Math.min(100, parseInt(parsed.fitScore) || 50)),
      summary: parsed.summary || "Analysis unavailable",
      matchesDietary: parsed.matchesDietary === true,
      matchesBudget: parsed.matchesBudget === true,
      nutritionEstimate: ["high", "medium", "low"].includes(parsed.nutritionEstimate)
        ? parsed.nutritionEstimate
        : "medium",
    }
  } catch (error) {
    console.error("Failed to parse Gemini response:", error)
    return {
      fitScore: 50,
      summary: "Analysis format error",
      matchesDietary: true,
      matchesBudget: true,
      nutritionEstimate: "medium",
    }
  }
}

export function hashPreferences(prefs: UserPreferences): string {
  const str = JSON.stringify({
    budget: prefs.budget,
    religion: prefs.religion.sort(),
    dietary: prefs.dietary_restrictions.sort(),
    meal: prefs.meal_preference,
  })

  // Simple hash function (for caching purposes)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return hash.toString(36)
}
