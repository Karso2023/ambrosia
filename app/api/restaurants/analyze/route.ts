import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/server"
import { getPlaceDetails } from "@/lib/google/places"
import { analyzeRestaurant, hashPreferences } from "@/lib/gemini/restaurant-analysis"
import type { UserPreferences } from "@/lib/preferences"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { restaurant_id } = await req.json()

    if (!restaurant_id) {
      return NextResponse.json({ error: "restaurant_id required" }, { status: 400 })
    }

    // Get restaurant from database
    const { data: restaurant, error: restaurantError } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", restaurant_id)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
    }

    // Get preferences from user metadata
    const preferences: UserPreferences = {
      postcode: user.user_metadata?.postcode ?? "",
      budget: user.user_metadata?.budget ?? "",
      religion: user.user_metadata?.religion ?? [],
      dietary_restrictions: user.user_metadata?.dietary_restrictions ?? [],
      meal_preference: user.user_metadata?.meal_preference ?? "cook",
    }

    const prefsHash = hashPreferences(preferences)

    // Check cache
    const { data: cached } = await supabase
      .from("restaurant_analyses")
      .select("*")
      .eq("restaurant_id", restaurant_id)
      .eq("user_preferences_hash", prefsHash)
      .single()

    if (cached) {
      return NextResponse.json({ analysis: cached })
    }

    // Fetch fresh place details for analysis
    const placeDetails = await getPlaceDetails(restaurant.place_id)

    if (!placeDetails) {
      return NextResponse.json(
        { error: "Failed to fetch restaurant details" },
        { status: 500 }
      )
    }

    // Analyze with Gemini
    const analysis = await analyzeRestaurant(placeDetails, preferences)

    // Store in cache
    const { data: stored, error: storeError } = await supabase
      .from("restaurant_analyses")
      .insert({
        restaurant_id,
        user_preferences_hash: prefsHash,
        fit_score: analysis.fitScore,
        analysis_summary: analysis.summary,
        matches_dietary: analysis.matchesDietary,
        matches_budget: analysis.matchesBudget,
        nutrition_estimate: analysis.nutritionEstimate,
      })
      .select()
      .single()

    if (storeError) {
      console.error("Failed to cache analysis:", storeError)
    }

    return NextResponse.json({ analysis: stored || analysis })
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json(
      { error: "Failed to analyze restaurant" },
      { status: 500 }
    )
  }
}
