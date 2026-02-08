export interface LatLng {
  lat: number
  lng: number
}

export async function geocodePostcode(postcode: string): Promise<LatLng | null> {
  const apiKey = process.env.GOOGLE_MAP_API_KEY
  if (!apiKey) {
    throw new Error("GOOGLE_MAP_API_KEY not configured")
  }

  // Add UK region bias to ensure UK results
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    postcode + ", UK"
  )}&components=country:GB&region=GB&key=${apiKey}`

  try {
    const res = await fetch(url)
    const data = await res.json()

    if (data.status !== "OK" || !data.results?.[0]) {
      console.error("Geocoding error:", data.status, data.error_message)
      return null
    }

    const location = data.results[0].geometry.location
    return {
      lat: location.lat,
      lng: location.lng,
    }
  } catch (error) {
    console.error("Geocoding fetch error:", error)
    return null
  }
}
