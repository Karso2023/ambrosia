"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Calendar,
  Loader2,
  RefreshCw,
  AlertCircle,
  Search,
  UtensilsCrossed,
  ChefHat,
  Apple,
  Star,
  Plus,
  Check,
  MapPin as MapPinIcon,
  ExternalLink,
  ShoppingCart,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface MealNutrition {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  level: "high" | "medium" | "low"
}

interface MealDetail {
  type: "cook" | "restaurant"
  restaurant_id?: string
  restaurant_name?: string
  meal_name: string
  cost: number
  nutrition: MealNutrition
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

interface MealPlan {
  month_year: string
  total_meals: number
  restaurants_used: number
  schedule: DaySchedule[]
}

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

export function MealPlan() {
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoSwitchMessage, setAutoSwitchMessage] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<DaySchedule | null>(null)
  const [selectedMeal, setSelectedMeal] = useState<"breakfast" | "lunch" | "dinner" | null>(null)
  const [dialogMeal, setDialogMeal] = useState<"breakfast" | "lunch" | "dinner">("breakfast")

  // Date utilities for dynamic calendar
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate()
  }
  const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth)
  const monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"]
  const currentMonthName = monthNames[currentMonth]

  // Checked ingredients state: key = "day-mealType", value = set of ingredient indices
  const [checkedIngredients, setCheckedIngredients] = useState<Map<string, Set<number>>>(new Map())

  const toggleIngredient = (day: number, mealType: string, index: number) => {
    const key = `${day}-${mealType}`
    setCheckedIngredients(prev => {
      const newMap = new Map(prev)
      const current = newMap.get(key) || new Set<number>()
      const newSet = new Set(current)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      newMap.set(key, newSet)
      return newMap
    })
  }

  const isIngredientChecked = (day: number, mealType: string, index: number): boolean => {
    const key = `${day}-${mealType}`
    return checkedIngredients.get(key)?.has(index) || false
  }

  // Restaurant search state
  const [showSearch, setShowSearch] = useState(false)
  const [searching, setSearching] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [analyses, setAnalyses] = useState<Map<string, Analysis>>(new Map())
  const [analyzing, setAnalyzing] = useState<Set<string>>(new Set())
  const [saved, setSaved] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Auto-generate plan on load if not exists
    generatePlan()
    loadSavedRestaurants()
  }, [])

  const generatePlan = async () => {
    setGenerating(true)
    setError(null)
    setAutoSwitchMessage(null)
    try {
      const res = await fetch("/api/restaurants/generate-plan", {
        method: "POST",
      })

      const data = await res.json()
      if (res.ok) {
        setPlan(data.meal_plan?.plan_data)

        // Show auto-switch message if it happened
        if (data.auto_switched && data.message) {
          setAutoSwitchMessage(data.message)
        }
      } else {
        setError(data.error || "Failed to generate meal plan")
      }
    } catch (error) {
      setError("Something went wrong. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

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
        setShowSearch(true)
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

  const handleDayClick = (day: DaySchedule, meal: "breakfast" | "lunch" | "dinner") => {
    setSelectedDay(day)
    setSelectedMeal(meal)
    setDialogMeal(meal)
  }

  const today = now.getDate()

  const getNutritionColor = (level: string) => {
    if (level === "high") return "text-green-600 dark:text-green-400"
    if (level === "medium") return "text-yellow-600 dark:text-yellow-400"
    return "text-orange-600 dark:text-orange-400"
  }

  const getNutritionBg = (level: string) => {
    if (level === "high") return "bg-green-100 dark:bg-green-900/20"
    if (level === "medium") return "bg-yellow-100 dark:bg-yellow-900/20"
    return "bg-orange-100 dark:bg-orange-900/20"
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

  const totalCost = plan?.schedule.reduce(
    (sum, day) => sum + day.breakfast.cost + day.lunch.cost + day.dinner.cost,
    0
  ) || 0
  const avgCostPerMeal = plan ? totalCost / plan.total_meals : 0

  const nutritionStats = plan?.schedule.reduce(
    (acc, day) => {
      ;[day.breakfast, day.lunch, day.dinner].forEach((meal) => {
        acc[meal.nutrition.level] = (acc[meal.nutrition.level] || 0) + 1
      })
      return acc
    },
    {} as Record<string, number>
  ) || {}

  if (showSearch) {
    return (
      <Card className="col-span-full shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Search className="size-5" />
                Search Restaurants
              </CardTitle>
              <CardDescription className="mt-1">
                {saved.size > 0
                  ? `You have ${saved.size}/12 saved restaurants`
                  : "Find and save restaurants for your meal plan"}
              </CardDescription>
            </div>
            <Button onClick={() => setShowSearch(false)} variant="outline">
              Back to Meal Plan
            </Button>
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
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
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

                      {restaurant.address && (
                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                          <MapPinIcon className="size-3.5 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{restaurant.address}</span>
                        </div>
                      )}

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

  return (
    <>
      <Card className="col-span-full shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calendar className="size-5" />
                Monthly Meal Plan
              </CardTitle>
              <CardDescription className="mt-1">
                {plan
                  ? `${plan.total_meals} meals planned • £${totalCost.toFixed(0)} total cost`
                  : "Generating your personalized meal plan..."}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowSearch(true)} variant="outline" size="sm">
                <Search className="size-4 mr-2" />
                Search Restaurants
              </Button>
              <Button onClick={generatePlan} disabled={generating} variant="outline" size="sm">
                <RefreshCw className="size-4 mr-2" />
                Regenerate
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {generating && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating your personalized meal plan...</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="border-destructive/50">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {autoSwitchMessage && (
            <Alert className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
              <AlertCircle className="size-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-900 dark:text-blue-100">
                {autoSwitchMessage}
              </AlertDescription>
            </Alert>
          )}

          {plan && plan.schedule && !generating && (
            <>
              {/* Monthly Summary */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Cost</p>
                  <p className="text-2xl font-bold text-foreground">£{totalCost.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg per Meal</p>
                  <p className="text-2xl font-bold text-foreground">£{avgCostPerMeal.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Restaurants</p>
                  <p className="text-2xl font-bold text-primary">{plan.restaurants_used}</p>
                </div>
              </div>

              {/* Nutrition Breakdown */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Nutrition Balance</p>
                <div className="flex gap-3">
                  {Object.entries(nutritionStats).map(([level, count]) => (
                    <div
                      key={level}
                      className={`flex-1 p-3 rounded-xl border-2 ${getNutritionBg(level)} transition-all hover:scale-105`}
                    >
                      <p className={`text-sm font-bold mb-1 ${getNutritionColor(level)}`}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </p>
                      <p className="text-base font-bold text-foreground">
                        {count} <span className="text-xs font-normal text-muted-foreground">meals</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {Math.round((count / plan.total_meals) * 100)}% of total
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calendar Grid - Dynamic */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{currentMonthName} {currentYear} ({daysInCurrentMonth} Days)</p>
                  <p className="text-xs text-muted-foreground">Click any meal for details</p>
                </div>
                <div className="grid grid-cols-7 gap-2.5">
                  {plan.schedule.slice(0, daysInCurrentMonth).map((day) => {
                    const isToday = day.day === today
                    const dailyCost = day.breakfast.cost + day.lunch.cost + day.dinner.cost

                    return (
                      <div
                        key={day.day}
                        className={`p-2 rounded-xl border-2 transition-all text-left ${
                          isToday
                            ? "border-primary bg-primary/10 shadow-md"
                            : "border-border bg-card"
                        }`}
                      >
                        <div className="text-xs font-bold mb-1.5 flex items-center justify-between">
                          <span>Day {day.day}</span>
                          {isToday && <span className="text-[8px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">TODAY</span>}
                        </div>

                        {/* Breakfast */}
                        <button
                          onClick={() => handleDayClick(day, "breakfast")}
                          className="w-full text-left p-1.5 rounded-lg mb-1 hover:bg-muted/50 transition-colors group"
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            <UtensilsCrossed className="size-2.5 text-muted-foreground" />
                            <span className="text-[9px] font-medium text-muted-foreground">Breakfast</span>
                          </div>
                          <p className="text-[10px] line-clamp-1 group-hover:text-foreground transition-colors">
                            {day.breakfast.meal_name}
                          </p>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-[9px] font-medium">£{day.breakfast.cost.toFixed(1)}</span>
                            <div className={`size-1.5 rounded-full ${
                              day.breakfast.nutrition.level === "high" ? "bg-green-500" :
                              day.breakfast.nutrition.level === "medium" ? "bg-yellow-500" : "bg-orange-500"
                            }`} />
                          </div>
                        </button>

                        {/* Lunch */}
                        <button
                          onClick={() => handleDayClick(day, "lunch")}
                          className="w-full text-left p-1.5 rounded-lg mb-1 hover:bg-muted/50 transition-colors group"
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            <ChefHat className="size-2.5 text-muted-foreground" />
                            <span className="text-[9px] font-medium text-muted-foreground">Lunch</span>
                          </div>
                          <p className="text-[10px] line-clamp-1 group-hover:text-foreground transition-colors">
                            {day.lunch.meal_name}
                          </p>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-[9px] font-medium">£{day.lunch.cost.toFixed(1)}</span>
                            <div className={`size-1.5 rounded-full ${
                              day.lunch.nutrition.level === "high" ? "bg-green-500" :
                              day.lunch.nutrition.level === "medium" ? "bg-yellow-500" : "bg-orange-500"
                            }`} />
                          </div>
                        </button>

                        {/* Dinner */}
                        <button
                          onClick={() => handleDayClick(day, "dinner")}
                          className="w-full text-left p-1.5 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            <Apple className="size-2.5 text-muted-foreground" />
                            <span className="text-[9px] font-medium text-muted-foreground">Dinner</span>
                          </div>
                          <p className="text-[10px] line-clamp-1 group-hover:text-foreground transition-colors">
                            {day.dinner.meal_name}
                          </p>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-[9px] font-medium">£{day.dinner.cost.toFixed(1)}</span>
                            <div className={`size-1.5 rounded-full ${
                              day.dinner.nutrition.level === "high" ? "bg-green-500" :
                              day.dinner.nutrition.level === "medium" ? "bg-yellow-500" : "bg-orange-500"
                            }`} />
                          </div>
                        </button>

                        <div className="text-[10px] font-bold mt-1.5 pt-1.5 border-t">
                          £{dailyCost.toFixed(1)}/day
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Meal Details Dialog */}
      <Dialog open={!!selectedDay && !!selectedMeal} onOpenChange={(open) => {
        if (!open) {
          setSelectedDay(null)
          setSelectedMeal(null)
        }
      }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {selectedDay && (
            <>
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-xl font-bold">
                  Day {selectedDay.day} - {currentMonthName}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  View meal details for this day
                </DialogDescription>
              </DialogHeader>

              {/* Meal Tabs */}
              <div className="flex gap-1.5 border-b pb-3">
                {(["breakfast", "lunch", "dinner"] as const).map((meal) => (
                  <button
                    key={meal}
                    onClick={() => setDialogMeal(meal)}
                    className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-colors ${
                      dialogMeal === meal
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {meal === "breakfast" && <UtensilsCrossed className="size-3" />}
                      {meal === "lunch" && <ChefHat className="size-3" />}
                      {meal === "dinner" && <Apple className="size-3" />}
                      <span className="capitalize">{meal}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {/* Meal Name */}
                <div className="text-center py-2">
                  <p className="text-lg font-semibold">{selectedDay[dialogMeal].meal_name}</p>
                </div>

                {/* Cost & Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Cost</p>
                    <p className="text-xl font-bold text-primary">£{selectedDay[dialogMeal].cost.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg border">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Type</p>
                    <p className="text-xl font-bold text-foreground capitalize">{selectedDay[dialogMeal].type}</p>
                  </div>
                </div>

                {/* Nutrition Info */}
                <div className={`p-3 rounded-lg border ${getNutritionBg(selectedDay[dialogMeal].nutrition.level)}`}>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Apple className="size-3.5" />
                    Nutrition
                  </h4>
                  <div className="grid grid-cols-5 gap-2">
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">Cal</p>
                      <p className="text-sm font-bold">{selectedDay[dialogMeal].nutrition.calories}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">Protein</p>
                      <p className="text-sm font-bold">{selectedDay[dialogMeal].nutrition.protein}g</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">Carbs</p>
                      <p className="text-sm font-bold">{selectedDay[dialogMeal].nutrition.carbs}g</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">Fat</p>
                      <p className="text-sm font-bold">{selectedDay[dialogMeal].nutrition.fat}g</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-muted-foreground">Fiber</p>
                      <p className="text-sm font-bold">{selectedDay[dialogMeal].nutrition.fiber}g</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <p className={`text-xs font-bold ${getNutritionColor(selectedDay[dialogMeal].nutrition.level)}`}>
                      Level: {selectedDay[dialogMeal].nutrition.level.toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* Recipe/Restaurant Details */}
                {selectedDay[dialogMeal].type === "cook" ? (
                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <ChefHat className="size-3.5 text-primary" />
                      Recipe Details
                    </h4>
                    <div className="flex gap-3 text-xs">
                      {selectedDay[dialogMeal].cooking_time && (
                        <span><span className="font-medium">Time:</span> {selectedDay[dialogMeal].cooking_time}min</span>
                      )}
                      {selectedDay[dialogMeal].difficulty && (
                        <span><span className="font-medium">Difficulty:</span> {selectedDay[dialogMeal].difficulty}</span>
                      )}
                    </div>
                    {selectedDay[dialogMeal].instructions && selectedDay[dialogMeal].instructions!.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-1">Instructions:</p>
                        <div className="max-h-24 overflow-y-auto pr-2">
                          <ol className="list-decimal list-inside text-xs space-y-0.5 text-muted-foreground">
                            {selectedDay[dialogMeal].instructions!.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <MapPinIcon className="size-3.5 text-primary" />
                      {selectedDay[dialogMeal].restaurant_name}
                    </h4>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        selectedDay[dialogMeal].restaurant_name || ""
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm font-semibold"
                    >
                      <ExternalLink className="size-4" />
                      Open in Google Maps
                    </a>
                  </div>
                )}

                {/* Day Shopping List - combined from all meals */}
                {(() => {
                  const dayIngredients: Array<{ meal: string; ingredient: string; mealType: string; index: number }> = []
                  for (const mealType of ["breakfast", "lunch", "dinner"] as const) {
                    const meal = selectedDay[mealType]
                    if (meal.type === "cook" && meal.ingredients) {
                      meal.ingredients.forEach((ing, i) => {
                        dayIngredients.push({
                          meal: mealType,
                          ingredient: ing,
                          mealType,
                          index: i,
                        })
                      })
                    }
                  }

                  if (dayIngredients.length === 0) return null

                  const totalChecked = dayIngredients.filter(
                    item => isIngredientChecked(selectedDay.day, item.mealType, item.index)
                  ).length

                  return (
                    <div className="p-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <ShoppingCart className="size-3.5 text-primary" />
                          Day {selectedDay.day} Shopping List
                        </h4>
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {totalChecked}/{dayIngredients.length} bought
                        </span>
                      </div>

                      <div className="max-h-40 overflow-y-auto pr-1 space-y-3">
                        {(["breakfast", "lunch", "dinner"] as const).map(mealType => {
                          const mealItems = dayIngredients.filter(item => item.mealType === mealType)
                          if (mealItems.length === 0) return null

                          return (
                            <div key={mealType}>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                                {mealType === "breakfast" && <UtensilsCrossed className="size-2.5" />}
                                {mealType === "lunch" && <ChefHat className="size-2.5" />}
                                {mealType === "dinner" && <Apple className="size-2.5" />}
                                {mealType} — {selectedDay[mealType].meal_name}
                              </p>
                              <div className="space-y-0.5">
                                {mealItems.map((item) => {
                                  const checked = isIngredientChecked(selectedDay.day, item.mealType, item.index)
                                  return (
                                    <button
                                      key={`${item.mealType}-${item.index}`}
                                      onClick={() => toggleIngredient(selectedDay.day, item.mealType, item.index)}
                                      className={`flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md transition-all text-xs ${
                                        checked
                                          ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400"
                                          : "hover:bg-muted/50 text-muted-foreground"
                                      }`}
                                    >
                                      <div className={`size-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                        checked
                                          ? "bg-green-500 border-green-500"
                                          : "border-muted-foreground/30"
                                      }`}>
                                        {checked && <Check className="size-3 text-white" />}
                                      </div>
                                      <span className={checked ? "line-through opacity-60" : ""}>
                                        {item.ingredient}
                                      </span>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
