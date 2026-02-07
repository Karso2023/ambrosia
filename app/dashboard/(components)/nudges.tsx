"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Sparkles, TrendingUp, Flame, Calendar, Coins, RefreshCw,
  Check, X, UtensilsCrossed, ChefHat, Apple, Send, Loader2, MessageCircle,
} from "lucide-react"

interface NudgeStats {
  total_meals_cooked: number
  current_streak: number
  total_saved: number
  adherence_rate: number
  missed_days: number
}

type Mood = "happy" | "tired" | "stressed" | "motivated" | "neutral"
type MealStatus = "pending" | "completed" | "missed"

interface TodayMeals {
  breakfast: MealStatus
  lunch: MealStatus
  dinner: MealStatus
}

interface ChatMessage {
  role: "user" | "assistant"
  text: string
  suggestPlanUpdate?: boolean
  updatedMeals?: any[]
  budgetImpact?: { saved: number; message: string }
}

const MOOD_OPTIONS: { value: Mood; label: string; emoji: string }[] = [
  { value: "happy", label: "Happy", emoji: "😊" },
  { value: "tired", label: "Tired", emoji: "😴" },
  { value: "stressed", label: "Stressed", emoji: "😓" },
  { value: "motivated", label: "Motivated", emoji: "💪" },
  { value: "neutral", label: "Neutral", emoji: "😐" },
]

export function Nudges() {
  const [stats, setStats] = useState<NudgeStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Meal completion state
  const [todayMeals, setTodayMeals] = useState<TodayMeals>({
    breakfast: "pending", lunch: "pending", dinner: "pending"
  })
  const [marking, setMarking] = useState(false)

  // Mood state
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null)
  const [submittingMood, setSubmittingMood] = useState(false)

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Missed meal reason state
  const [missingMeal, setMissingMeal] = useState<"breakfast" | "lunch" | "dinner" | null>(null)
  const [missedReason, setMissedReason] = useState("")

  // Plan update state
  const [updatingPlan, setUpdatingPlan] = useState(false)

  useEffect(() => {
    loadStats()
    loadTodayMeals()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const loadStats = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/nudges")
      const data = await res.json()
      if (res.ok) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Failed to load stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadTodayMeals = async () => {
    try {
      const res = await fetch("/api/nudges/today")
      const data = await res.json()
      if (res.ok) {
        const meals: TodayMeals = { breakfast: "pending", lunch: "pending", dinner: "pending" }
        if (data.completedMeals) {
          for (const m of ["breakfast", "lunch", "dinner"] as const) {
            if (data.completedMeals[m] === true) meals[m] = "completed"
            else if (data.completedMeals[m] === "missed") meals[m] = "missed"
          }
        }
        setTodayMeals(meals)
        if (data.todayMood) setSelectedMood(data.todayMood)
      }
    } catch (error) {
      console.error("Failed to load today's meals:", error)
    }
  }

  const markMealComplete = async (mealType: "breakfast" | "lunch" | "dinner") => {
    if (todayMeals[mealType] !== "pending") return
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
        setTodayMeals(prev => ({ ...prev, [mealType]: "completed" }))
        loadStats()
      }
    } catch (error) {
      console.error("Failed to mark meal complete:", error)
    } finally {
      setMarking(false)
    }
  }

  const startMissedMeal = (mealType: "breakfast" | "lunch" | "dinner") => {
    if (todayMeals[mealType] !== "pending") return
    setMissingMeal(mealType)
    setMissedReason("")
  }

  const submitMissedMeal = async () => {
    if (!missingMeal || !missedReason.trim()) return
    setMarking(true)

    try {
      // Record the missed meal
      await fetch("/api/nudges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_type: "meal_missed",
          metadata: { meal_type: missingMeal, reason: missedReason }
        })
      })

      setTodayMeals(prev => ({ ...prev, [missingMeal!]: "missed" }))
      setMissingMeal(null)

      // Start chat with Gemini about the missed meal
      setShowChat(true)
      setChatLoading(true)

      const res = await fetch("/api/nudges/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `I missed ${missingMeal} because: ${missedReason}`,
          context: {
            missedMeal: {
              meal_type: missingMeal,
              reason: missedReason,
              meal_cost: 5,
            },
            mood: selectedMood,
            stats,
            conversationHistory: [],
          }
        })
      })

      const data = await res.json()
      if (res.ok) {
        setChatMessages([
          { role: "user", text: `I missed ${missingMeal}: ${missedReason}` },
          {
            role: "assistant",
            text: data.message,
            suggestPlanUpdate: data.suggestPlanUpdate,
            updatedMeals: data.updatedMeals,
            budgetImpact: data.budgetImpact,
          },
        ])
      }

      setMissedReason("")
      loadStats()
    } catch (error) {
      console.error("Failed to report missed meal:", error)
    } finally {
      setMarking(false)
      setChatLoading(false)
    }
  }

  const submitMood = async (mood: Mood) => {
    setSubmittingMood(true)
    try {
      await fetch("/api/nudges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_type: "mood_logged",
          metadata: { mood }
        })
      })

      setSelectedMood(mood)
      setShowChat(true)
      setChatLoading(true)

      // Get Gemini response based on mood
      const res = await fetch("/api/nudges/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `I'm feeling ${mood} today`,
          context: { mood, stats, conversationHistory: [] }
        })
      })

      const data = await res.json()
      if (res.ok) {
        setChatMessages([
          { role: "user", text: `I'm feeling ${mood} today` },
          {
            role: "assistant",
            text: data.message,
            suggestPlanUpdate: data.suggestPlanUpdate,
            updatedMeals: data.updatedMeals,
          },
        ])
      }
    } catch (error) {
      console.error("Failed to submit mood:", error)
    } finally {
      setSubmittingMood(false)
      setChatLoading(false)
    }
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = chatInput.trim()
    setChatInput("")
    setChatLoading(true)

    const newMessages: ChatMessage[] = [...chatMessages, { role: "user", text: userMsg }]
    setChatMessages(newMessages)

    try {
      const res = await fetch("/api/nudges/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          context: {
            mood: selectedMood,
            stats,
            conversationHistory: newMessages.map(m => ({ role: m.role, text: m.text })),
          }
        })
      })

      const data = await res.json()
      if (res.ok) {
        setChatMessages(prev => [...prev, {
          role: "assistant",
          text: data.message,
          suggestPlanUpdate: data.suggestPlanUpdate,
          updatedMeals: data.updatedMeals,
          budgetImpact: data.budgetImpact,
        }])
      }
    } catch (error) {
      console.error("Chat error:", error)
      setChatMessages(prev => [...prev, {
        role: "assistant",
        text: "Sorry, I had a hiccup! Try again in a moment."
      }])
    } finally {
      setChatLoading(false)
    }
  }

  const applyPlanUpdate = async (updatedMeals: any[]) => {
    setUpdatingPlan(true)
    try {
      const res = await fetch("/api/restaurants/update-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: updatedMeals })
      })

      if (res.ok) {
        setChatMessages(prev => [...prev, {
          role: "assistant",
          text: "Done! Your plan has been updated. Refresh the calendar to see the changes."
        }])
      } else {
        setChatMessages(prev => [...prev, {
          role: "assistant",
          text: "Hmm, I couldn't update the plan. Try refreshing and trying again."
        }])
      }
    } catch (error) {
      console.error("Plan update error:", error)
    } finally {
      setUpdatingPlan(false)
    }
  }

  const getMealIcon = (meal: "breakfast" | "lunch" | "dinner") => {
    if (meal === "breakfast") return <UtensilsCrossed className="size-4 text-muted-foreground" />
    if (meal === "lunch") return <ChefHat className="size-4 text-muted-foreground" />
    return <Apple className="size-4 text-muted-foreground" />
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
              Track your meals and chat with your AI assistant
            </CardDescription>
          </div>
          <Button onClick={() => { loadStats(); loadTodayMeals() }} variant="ghost" size="sm">
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

            {/* Today's Meals - Complete or Did Not Achieve */}
            <div className="p-4 rounded-xl bg-muted/30 border space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Check className="size-4" />
                Today's Meals
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {(["breakfast", "lunch", "dinner"] as const).map((meal) => {
                  const status = todayMeals[meal]
                  return (
                    <div key={meal} className="space-y-1">
                      <div className={`py-2 px-2 rounded-lg border-2 text-center transition-all ${
                        status === "completed"
                          ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                          : status === "missed"
                          ? "border-red-400 bg-red-50 dark:bg-red-950/20"
                          : "border-border"
                      }`}>
                        <div className="flex flex-col items-center gap-1">
                          {status === "completed" && <Check className="size-4 text-green-600" />}
                          {status === "missed" && <X className="size-4 text-red-500" />}
                          {status === "pending" && getMealIcon(meal)}
                          <span className={`text-xs font-medium capitalize ${
                            status === "completed" ? "text-green-600"
                            : status === "missed" ? "text-red-500"
                            : ""
                          }`}>{meal}</span>
                        </div>
                      </div>
                      {status === "pending" && (
                        <div className="flex gap-1">
                          <button
                            disabled={marking}
                            onClick={() => markMealComplete(meal)}
                            className="flex-1 py-1.5 rounded border text-[10px] font-medium bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 hover:bg-green-100 transition-colors disabled:opacity-50"
                          >
                            Done
                          </button>
                          <button
                            disabled={marking}
                            onClick={() => startMissedMeal(meal)}
                            className="flex-1 py-1.5 rounded border text-[10px] font-medium bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            Missed
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Missed meal reason input */}
              {missingMeal && (
                <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 space-y-2">
                  <p className="text-xs font-medium text-orange-800 dark:text-orange-300">
                    Why did you miss {missingMeal}? (helps us adjust your plan)
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={missedReason}
                      onChange={(e) => setMissedReason(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && submitMissedMeal()}
                      placeholder="e.g. busy with work, not hungry..."
                      className="flex-1 px-3 py-2 text-xs rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                      maxLength={200}
                    />
                    <Button
                      size="sm"
                      onClick={submitMissedMeal}
                      disabled={!missedReason.trim() || marking}
                    >
                      {marking ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setMissingMeal(null)}
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                </div>
              )}

              {todayMeals.breakfast === "completed" && todayMeals.lunch === "completed" && todayMeals.dinner === "completed" && (
                <p className="text-xs text-center text-green-600 font-medium">
                  All meals completed today! Great job!
                </p>
              )}
            </div>

            {/* Mood/Feelings Input */}
            <div className="p-4 rounded-xl bg-muted/30 border space-y-3">
              <h4 className="text-sm font-semibold">How are you feeling today?</h4>
              <p className="text-xs text-muted-foreground">Select your mood and I'll tailor suggestions for you</p>
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

            {/* AI Chat */}
            {showChat && (
              <div className="p-4 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <MessageCircle className="size-4 text-primary" />
                    Ambrosia AI
                  </h4>
                  <button
                    onClick={() => { setShowChat(false); setChatMessages([]) }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border"
                      }`}>
                        <p className="leading-relaxed">{msg.text}</p>

                        {/* Budget impact */}
                        {msg.budgetImpact && (
                          <div className="mt-2 pt-2 border-t border-current/10 text-xs opacity-80">
                            {msg.budgetImpact.message}
                          </div>
                        )}

                        {/* Plan update suggestion */}
                        {msg.suggestPlanUpdate && msg.updatedMeals && msg.updatedMeals.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-current/10 flex gap-2">
                            <Button
                              size="sm"
                              variant={msg.role === "user" ? "secondary" : "default"}
                              className="text-xs h-7"
                              disabled={updatingPlan}
                              onClick={() => applyPlanUpdate(msg.updatedMeals!)}
                            >
                              {updatingPlan ? (
                                <><Loader2 className="size-3 animate-spin mr-1" /> Updating...</>
                              ) : (
                                "Yes, update my plan"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-7"
                              onClick={() => setChatMessages(prev => [...prev, {
                                role: "assistant",
                                text: "No worries! Your current plan stays as is. You're doing great!"
                              }])}
                            >
                              No thanks
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="px-3 py-2 rounded-xl bg-background border">
                        <Loader2 className="size-4 animate-spin text-primary" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                    placeholder="Reply to Ambrosia..."
                    className="flex-1 px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    maxLength={500}
                    disabled={chatLoading}
                  />
                  <Button
                    size="sm"
                    onClick={sendChatMessage}
                    disabled={!chatInput.trim() || chatLoading}
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Open chat button if chat is hidden */}
            {!showChat && selectedMood && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowChat(true)}
              >
                <MessageCircle className="size-4 mr-2" />
                Chat with Ambrosia AI
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
