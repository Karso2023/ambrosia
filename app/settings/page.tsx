"use client"

import { useState, useEffect } from "react"
import { NavBar } from "@/app/(navBar)/navBar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PostcodeField } from "@/app/(preferences)/postcodeField"
import { BudgetField } from "@/app/(preferences)/budgetField"
import { ReligionField } from "@/app/(preferences)/religionField"
import { DietaryField } from "@/app/(preferences)/dietaryField"
import { MealPreferenceField, type MealPreference } from "@/app/(preferences)/mealPreferenceField"
import { getUserPreferences, setUserPreferences } from "@/lib/preferences"
import { Settings } from "lucide-react"

export default function SettingsPage() {
  const [postcode, setPostcode] = useState("")
  const [budget, setBudget] = useState("")
  const [religion, setReligion] = useState<string[]>([])
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([])
  const [mealPreference, setMealPreference] = useState<MealPreference>("cook")
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getUserPreferences().then((prefs) => {
      setPostcode(prefs.postcode)
      setBudget(prefs.budget)
      setReligion(prefs.religion)
      setDietaryRestrictions(prefs.dietary_restrictions)
      setMealPreference(prefs.meal_preference)
    })
  }, [])

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setSaved(false)
    try {
      await setUserPreferences({
        postcode,
        budget,
        religion,
        dietary_restrictions: dietaryRestrictions,
        meal_preference: mealPreference,
      })
      setSaved(true)
    } catch {
      setError("Failed to save preferences")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <NavBar />
      <div className="w-full max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-8 text-black dark:text-white flex items-center gap-2">
          <Settings className="size-6" />
          Settings
        </h1>
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Manage your location, budget, and dietary preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <PostcodeField value={postcode} onChange={setPostcode} />
              <BudgetField value={budget} onChange={setBudget} />
              <ReligionField value={religion} onChange={setReligion} />
              <DietaryField
                value={dietaryRestrictions}
                onChange={setDietaryRestrictions}
              />
              <MealPreferenceField
                value={mealPreference}
                onChange={setMealPreference}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              {saved && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Preferences saved successfully
                </p>
              )}
              <Button
                onClick={handleSave}
                className="w-full"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Preferences"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
