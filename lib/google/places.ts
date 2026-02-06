import type { LatLng } from "./geocoding"

export interface PlaceSearchResult {
  place_id: string
  name: string
  vicinity: string
  rating?: number
  price_level?: number
  types?: string[]
  photos?: { photo_reference: string }[]
}

export interface PlaceDetails {
  place_id: string
  name: string
  formatted_address: string
  formatted_phone_number?: string
  rating?: number
  price_level?: number
  types?: string[]
  user_ratings_total?: number
  reviews?: {
    author_name: string
    rating: number
    text: string
    time: number
  }[]
  photos?: { photo_reference: string }[]
}

export async function searchNearbyRestaurants(
  location: LatLng,
  radius: number = 5000,
  keyword?: string
): Promise<PlaceSearchResult[]> {
  const apiKey = process.env.GOOGLE_MAP_API_KEY
  if (!apiKey) {
    throw new Error("GOOGLE_MAP_API_KEY not configured")
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json")
  url.searchParams.set("location", `${location.lat},${location.lng}`)
  url.searchParams.set("radius", radius.toString())
  url.searchParams.set("type", "restaurant")
  if (keyword) url.searchParams.set("keyword", keyword)
  url.searchParams.set("key", apiKey)

  const res = await fetch(url.toString())
  const data = await res.json()

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Places API error: ${data.status} - ${data.error_message}`)
  }

  return data.results || []
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const apiKey = process.env.GOOGLE_MAP_API_KEY
  if (!apiKey) {
    throw new Error("GOOGLE_MAP_API_KEY not configured")
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json")
  url.searchParams.set("place_id", placeId)
  url.searchParams.set(
    "fields",
    "place_id,name,formatted_address,formatted_phone_number,rating,price_level,types,user_ratings_total,reviews,photos"
  )
  url.searchParams.set("key", apiKey)

  const res = await fetch(url.toString())
  const data = await res.json()

  if (data.status !== "OK") {
    console.error("Place Details error:", data.status, data.error_message)
    return null
  }

  return data.result
}

export function getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
  const apiKey = process.env.GOOGLE_MAP_API_KEY
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`
}
