import { NextRequest, NextResponse } from "next/server"

const GOOGLE_PLACES_URL =
  "https://maps.googleapis.com/maps/api/place/autocomplete/json"

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get("input")

  if (!input || input.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  const apiKey = process.env.GOOGLE_MAP_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Maps API key not configured" },
      { status: 500 }
    )
  }

  try {
    const params = new URLSearchParams({
      input,
      types: "postal_code",
      components: "country:gb",
      key: apiKey,
    })

    const res = await fetch(`${GOOGLE_PLACES_URL}?${params}`)
    const data = await res.json()

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Places API error:", data.status, data.error_message)
      return NextResponse.json(
        { error: "Failed to fetch suggestions" },
        { status: 502 }
      )
    }

    const suggestions = (data.predictions ?? []).map(
      (p: { description: string; place_id: string }) => ({
        description: p.description,
        placeId: p.place_id,
      })
    )

    return NextResponse.json({ suggestions })
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    )
  }
}
