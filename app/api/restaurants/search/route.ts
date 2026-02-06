import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/server"
import { geocodePostcode } from "@/lib/google/geocoding"
import { searchNearbyRestaurants, getPlaceDetails } from "@/lib/google/places"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { radius } = await req.json().catch(() => ({ radius: 5000 }))

    // Get preferences from user metadata
    const postcode = user.user_metadata?.postcode
    const dietaryRestrictions = user.user_metadata?.dietary_restrictions || []
    const religion = user.user_metadata?.religion || []

    if (!postcode) {
      return NextResponse.json(
        { error: "Postcode not set. Please update your preferences." },
        { status: 400 }
      )
    }

    // Step 1: Geocode postcode
    const location = await geocodePostcode(postcode)
    if (!location) {
      return NextResponse.json(
        { error: "Failed to geocode postcode. Please check your postcode." },
        { status: 400 }
      )
    }

    // Step 2: Build search keyword from dietary restrictions
    const keywords = [...dietaryRestrictions, ...religion].join(" ")

    // Step 3: Search nearby restaurants
    const searchResults = await searchNearbyRestaurants(
      location,
      radius,
      keywords || undefined
    )

    // Step 4: Fetch details and store in database
    const restaurants = []
    for (const place of searchResults.slice(0, 20)) {
      // Limit to top 20
      const details = await getPlaceDetails(place.place_id)
      if (!details) continue

      // Upsert restaurant into database
      const { data: restaurant, error } = await supabase
        .from("restaurants")
        .upsert(
          {
            place_id: details.place_id,
            name: details.name,
            address: details.formatted_address,
            phone: details.formatted_phone_number || null,
            rating: details.rating || null,
            price_level: details.price_level || null,
            cuisine_types: details.types || [],
            photo_reference: details.photos?.[0]?.photo_reference || null,
          },
          { onConflict: "place_id" }
        )
        .select()
        .single()

      if (error) {
        console.error("Failed to insert restaurant:", error)
        continue
      }

      restaurants.push(restaurant)
    }

    return NextResponse.json({ restaurants })
  } catch (error) {
    console.error("Restaurant search error:", error)
    return NextResponse.json(
      { error: "Failed to search restaurants. Please try again." },
      { status: 500 }
    )
  }
}
