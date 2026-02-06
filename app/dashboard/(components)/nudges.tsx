"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, TrendingUp, Flame, Calendar, Coins, RefreshCw, Check, UtensilsCrossed, ChefHat, Apple } from "lucide-react"

interface Nudge {
  message: string
  action?: string
  actionLink?: string
  tone: "celebrate" | "encourage" | "rescue" | "info"
  icon?: string
}

interface NudgeStats {
  total_meals_cooked: number
  current_streak: number
  total_saved: number
  adherence_rate: number
  missed_days: number
}

type Mood = "happy" | "tired" | "stressed" | "motivated" | "neutral"

interface TodayMeals {
  breakfast: boolean
  lunch: boolean
  dinner: boolean
}

const MOOD_OPTIONS: { value: Mood; label: string; emoji: string }[] = [
  { value: "happy", label: "Happy", emoji: "😊" },
  { value: "tired", label: "Tired", emoji: "😴" },
  { value: "stressed", label: "Stressed", emoji: "😓" },
  { value: "motivated", label: "Motivated", emoji: "💪" },
  { value: "neutral", label: "Neutral", emoji: "😐" },
]

export function Nudges() {
  const [nudge, setNudge] = useState<Nudge | null>(null)
  const [tip, setTip] = useState<string>("")
  const [stats, setStats] = useState<NudgeStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Meal completion state
  const [todayMeals, setTodayMeals] = useState<TodayMeals>({ breakfast: false, lunch: false, dinner: false })
  const [marking, setMarking] = useState(false)

  // Mood state
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null)
  const [submittingMood, setSubmittingMood] = useState(false)

  useEffect(() => {
    loadNudge()
    loadTodayMeals()
  }, [])

  const loadNudge = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/nudges")
      const data = await res.json()
      if (res.ok) {
        setNudge(data.nudge)
        setTip(data.tip)
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Failed to load nudge:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadTodayMeals = async () => {
    try {
      const res = await fetch("/api/nudges/today")
      const data = await res.json()
      if (res.ok) {
        setTodayMeals(data.completedMeals)
        if (data.todayMood) {
          setSelectedMood(data.todayMood)
        }
      }
    } catch (error) {
      console.error("Failed to load today's meals:", error)
    }
  }

  const markMealComplete = async (mealType: "breakfast" | "lunch" | "dinner") => {
    if (todayMeals[mealType]) return
    setMarking(true)
    try {
      const res = await fetch("/api/nudges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_type: "meal_completed",
          metadata: { meal_type: mealType }
        })
      })

      if (res.ok) {
        setTodayMeals(prev => ({ ...prev, [mealType]: true }))
        loadNudge()
      }
    } catch (error) {
      console.error("Failed to mark meal complete:", error)
    } finally {
      setMarking(false)
    }
  }

  const submitMood = async (mood: Mood) => {
    setSubmittingMood(true)
    try {
      const res = await fetch("/api/nudges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_type: "mood_logged",
          metadata: { mood }
        })
      })

      if (res.ok) {
        setSelectedMood(mood)
        loadNudge()
      }
    } catch (error) {
      console.error("Failed to submit mood:", error)
    } finally {
      setSubmittingMood(false)
    }
  }

  const getToneStyles = (tone: string) => {
    switch (tone) {
      case "celebrate":
        return "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800"
      case "encourage":
        return "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800"
      case "rescue":
        return "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800"
      default:
        return "bg-gradient-to-br from-muted/50 to-muted/30 border-border"
    }
  }

  const getToneIcon = (tone: string) => {
    switch (tone) {
      case "celebrate":
        return <Sparkles className="size-5 text-green-600 dark:text-green-400" />
      case "encourage":
        return <TrendingUp className="size-5 text-blue-600 dark:text-blue-400" />
      case "rescue":
        return <Flame className="size-5 text-orange-600 dark:text-orange-400" />
      default:
        return <Sparkles className="size-5" />
    }
  }

  return (
    <Card className="col-span-full shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="size-5 text-yellow-500" />
              Your Progress
            </CardTitle>
            <CardDescription className="mt-1">
              Keep up the great work! 🎉
            </CardDescription>
          </div>
          <Button onClick={loadNudge} variant="ghost" size="sm">
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading your progress...
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="size-4 text-purple-600 dark:text-purple-400" />
                    <p className="text-xs font-medium text-muted-foreground">Meals Cooked</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.total_meals_cooked}</p>
                </div>

                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="size-4 text-orange-600 dark:text-orange-400" />
                    <p className="text-xs font-medium text-muted-foreground">Streak</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.current_streak} days</p>
                </div>

                <div className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Coins className="size-4 text-green-600 dark:text-green-400" />
                    <p className="text-xs font-medium text-muted-foreground">Saved</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">£{stats.total_saved}</p>
                </div>

                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="size-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-xs font-medium text-muted-foreground">Adherence</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.adherence_rate}%</p>
                </div>
              </div>
            )}

            {/* Today's Meals Completion */}
            <div className="p-4 rounded-xl bg-muted/30 border space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Check className="size-4" />
                Today's Meals
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {(["breakfast", "lunch", "dinner"] as const).map((meal) => (
                  <button
                    key={meal}
                    disabled={marking || todayMeals[meal]}
                    onClick={() => markMealComplete(meal)}
                    className={`py-3 px-3 rounded-lg border-2 transition-all ${
                      todayMeals[meal]
                        ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    } ${marking ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      {todayMeals[meal] ? (
                        <Check className="size-5 text-green-600" />
                      ) : (
                        <>
                          {meal === "breakfast" && <UtensilsCrossed className="size-5 text-muted-foreground" />}
                          {meal === "lunch" && <ChefHat className="size-5 text-muted-foreground" />}
                          {meal === "dinner" && <Apple className="size-5 text-muted-foreground" />}
                        </>
                      )}
                      <span className={`text-xs font-medium capitalize ${todayMeals[meal] ? "text-green-600" : ""}`}>
                        {meal}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              {todayMeals.breakfast && todayMeals.lunch && todayMeals.dinner && (
                <p className="text-xs text-center text-green-600 font-medium">
                  All meals completed today! Great job!
                </p>
              )}
            </div>

            {/* Mood/Feelings Input */}
            <div className="p-4 rounded-xl bg-muted/30 border space-y-3">
              <h4 className="text-sm font-semibold">How are you feeling today?</h4>
              <p className="text-xs text-muted-foreground">This helps us tailor your meal suggestions</p>
              <div className="flex flex-wrap gap-2">
                {MOOD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => submitMood(option.value)}
                    disabled={submittingMood}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 transition-all ${
                      selectedMood === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    } ${submittingMood ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span className="text-base">{option.emoji}</span>
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Nudge Message */}
            {nudge && (
              <div className={`p-4 rounded-xl border-2 ${getToneStyles(nudge.tone)}`}>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-1">
                    {getToneIcon(nudge.tone)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-base font-medium text-foreground leading-relaxed">
                      {nudge.message}
                    </p>
                    {nudge.action && nudge.actionLink && (
                      <Button
                        size="sm"
                        variant="default"
                        className="mt-2"
                        onClick={() => window.location.href = nudge.actionLink!}
                      >
                        {nudge.action}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Motivational Tip */}
            {tip && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground">{tip}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
