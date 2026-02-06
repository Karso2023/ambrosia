"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Search, Star, Plus, Check, AlertCircle, MapPin as MapPinIcon, ExternalLink } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Restaurant {
  id: string
  name: string
  address: string
  cuisine_types: string[]
  rating: number | null
  price_level: number | null
  place_id: string
}

interface Analysis {
  fit_score: number
  analysis_summary: string
  matches_dietary: boolean
  matches_budget: boolean
  nutrition_estimate: string
}

export function GroceryShop() {
  const [searching, setSearching] = useState(false)
  const [analyzing, setAnalyzing] = useState<Set<string>>(new Set())
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [analyses, setAnalyses] = useState<Map<string, Analysis>>(new Map())
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSavedRestaurants()
  }, [])

  const loadSavedRestaurants = async () => {
    try {
      const res = await fetch("/api/restaurants/saved")
      const data = await res.json()
      if (res.ok) {
        const savedIds = new Set<string>(
          data.saved_restaurants?.map((sr: any) => sr.restaurant_id) || []
        )
        setSaved(savedIds)
      }
    } catch (error) {
      console.error("Failed to load saved restaurants:", error)
    }
  }

  const handleSearch = async () => {
    setSearching(true)
    setError(null)
    try {
      const res = await fetch("/api/restaurants/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ radius: 5000 }),
      })

      const data = await res.json()
      if (res.ok) {
        setRestaurants(data.restaurants || [])
        // Auto-analyze top 10 restaurants
        const top10 = (data.restaurants || []).slice(0, 10)
        top10.forEach((r: Restaurant) => analyzeRestaurant(r.id))
      } else {
        setError(data.error || "Failed to search restaurants")
      }
    } catch (error) {
      setError("Something went wrong. Please try again.")
    } finally {
      setSearching(false)
    }
  }

  const analyzeRestaurant = async (restaurantId: string) => {
    if (analyses.has(restaurantId)) return

    setAnalyzing((prev) => new Set(prev).add(restaurantId))

    try {
      const res = await fetch("/api/restaurants/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant_id: restaurantId }),
      })

      const data = await res.json()
      if (res.ok) {
        setAnalyses((prev) => new Map(prev).set(restaurantId, data.analysis))
      }
    } catch (error) {
      console.error("Failed to analyze restaurant:", error)
    } finally {
      setAnalyzing((prev) => {
        const newSet = new Set(prev)
        newSet.delete(restaurantId)
        return newSet
      })
    }
  }

  const saveRestaurant = async (restaurantId: string) => {
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preference_rank: 1 }),
      })

      const data = await res.json()
      if (res.ok) {
        setSaved((prev) => new Set(prev).add(restaurantId))
      } else {
        alert(data.error || "Failed to save restaurant")
      }
    } catch (error) {
      alert("Failed to save restaurant")
    }
  }

  const removeRestaurant = async (restaurantId: string) => {
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/remove`, {
        method: "DELETE",
      })

      if (res.ok) {
        setSaved((prev) => {
          const newSet = new Set(prev)
          newSet.delete(restaurantId)
          return newSet
        })
      }
    } catch (error) {
      alert("Failed to remove restaurant")
    }
  }

  const getFitScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400"
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getFitScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/20"
    if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/20"
    return "bg-red-100 dark:bg-red-900/20"
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Search className="size-5" />
              Find Restaurants
            </CardTitle>
            <CardDescription className="mt-1">
              {saved.size > 0
                ? `You have ${saved.size}/12 saved restaurants`
                : "Search for nearby restaurants and build your rotation"}
            </CardDescription>
          </div>
          {saved.size > 0 && (
            <div className="flex flex-col items-end gap-1">
              <div className="text-3xl font-bold text-primary">{saved.size}</div>
              <div className="text-xs text-muted-foreground">of 12 saved</div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleSearch}
          disabled={searching}
          className="w-full h-11 text-base font-medium shadow-sm"
        >
          {searching ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Searching nearby...
            </>
          ) : (
            <>
              <Search className="size-4 mr-2" />
              Search New Restaurants
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive" className="border-destructive/50">
            <AlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {restaurants.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                Found {restaurants.length} restaurants
              </p>
              <p className="text-xs text-muted-foreground">
                Auto-analyzing top 10
              </p>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
              {restaurants.map((restaurant) => {
                const analysis = analyses.get(restaurant.id)
                const isAnalyzing = analyzing.has(restaurant.id)
                const isSaved = saved.has(restaurant.id)

                return (
                  <div
                    key={restaurant.id}
                    className={`relative border-2 rounded-xl p-4 space-y-3 transition-all hover:shadow-md ${
                      isSaved
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base mb-1 truncate">
                          {restaurant.name}
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          {restaurant.cuisine_types?.[0] && (
                            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {restaurant.cuisine_types[0]}
                            </span>
                          )}
                          {restaurant.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">{restaurant.rating}</span>
                              <span className="text-xs text-muted-foreground">/5</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {analysis && (
                        <div
                          className={`px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm ${getFitScoreBg(
                            analysis.fit_score
                          )} ${getFitScoreColor(analysis.fit_score)}`}
                        >
                          {analysis.fit_score}%
                        </div>
                      )}
                    </div>

                    {/* Address */}
                    {restaurant.address && (
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <MapPinIcon className="size-3.5 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{restaurant.address}</span>
                      </div>
                    )}

                    {/* Analysis */}
                    {analysis && (
                      <div className="space-y-2 bg-muted/30 p-3 rounded-lg">
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {analysis.analysis_summary}
                        </p>
                        <div className="flex items-center gap-3 text-xs font-medium">
                          <span className={`flex items-center gap-1 ${analysis.matches_dietary ? "text-green-600" : "text-red-600"}`}>
                            {analysis.matches_dietary ? "✓" : "✗"} Dietary
                          </span>
                          <span className={`flex items-center gap-1 ${analysis.matches_budget ? "text-green-600" : "text-red-600"}`}>
                            {analysis.matches_budget ? "✓" : "✗"} Budget
                          </span>
                          <span className="text-muted-foreground">
                            • Nutrition: <span className="capitalize font-semibold">{analysis.nutrition_estimate}</span>
                          </span>
                        </div>
                      </div>
                    )}

                    {isAnalyzing && (
                      <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground bg-muted/30 rounded-lg">
                        <Loader2 className="size-4 animate-spin" />
                        Analyzing with AI...
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          restaurant.name + " " + restaurant.address
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-primary border border-primary/20 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors"
                      >
                        <ExternalLink className="size-3.5" />
                        Open Map
                      </a>

                      <Button
                        size="sm"
                        variant={isSaved ? "outline" : "default"}
                        className="flex-1 font-semibold"
                        onClick={() =>
                          isSaved
                            ? removeRestaurant(restaurant.id)
                            : saveRestaurant(restaurant.id)
                        }
                        disabled={saved.size >= 12 && !isSaved}
                      >
                        {isSaved ? (
                          <>
                            <Check className="size-4 mr-1.5" />
                            Saved
                          </>
                        ) : (
                          <>
                            <Plus className="size-4 mr-1.5" />
                            Add to Rotation
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Saved Badge */}
                    {isSaved && (
                      <div className="absolute top-3 right-3">
                        <div className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                          SAVED
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
