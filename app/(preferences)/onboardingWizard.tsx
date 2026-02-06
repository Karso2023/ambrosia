"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { PostcodeField } from "./postcodeField"
import { BudgetField } from "./budgetField"
import { ReligionField } from "./religionField"
import { DietaryField } from "./dietaryField"
import { MealPreferenceField, type MealPreference } from "./mealPreferenceField"
import { setUserPreferences } from "@/lib/preferences"
import {
  MapPin,
  Wallet,
  Church,
  UtensilsCrossed,
  MessageSquare,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react"
import { validateUserGoal, type ValidationState } from "@/lib/gemini/validation"

interface OnboardingWizardProps {
  onComplete: () => void
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1)
  const [postcode, setPostcode] = useState("")
  const [budget, setBudget] = useState("")
  const [religion, setReligion] = useState<string[]>([])
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([])
  const [mealPreference, setMealPreference] = useState<MealPreference | "">("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [userGoal, setUserGoal] = useState("")
  const [validationState, setValidationState] = useState<ValidationState>("idle")
  const [validationError, setValidationError] = useState<string | null>(null)
  const [rephrasedGoal, setRephrasedGoal] = useState<string | null>(null)

  const handleGoalSubmit = async () => {
    setValidationState("validating")
    setValidationError(null)
    setRephrasedGoal(null)

    // Client-side validation
    const validation = validateUserGoal(userGoal)
    if (!validation.valid) {
      setValidationState("invalid")
      setValidationError(validation.error)
      return
    }

    // Server-side validation + Gemini rephrase
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: userGoal }),
      })

      const data = await res.json()

      if (!res.ok) {
        setValidationState("invalid")
        setValidationError(data.error)
        return
      }

      setRephrasedGoal(data.rephrased)
      setValidationState("valid")
    } catch {
      setValidationState("invalid")
      setValidationError("Something went wrong. Please try again.")
    }
  }

  const handleFinish = async () => {
    setLoading(true)
    setError(null)
    try {
      await setUserPreferences({
        postcode,
        budget,
        religion,
        dietary_restrictions: dietaryRestrictions,
        meal_preference: mealPreference as MealPreference,
      })
      onComplete()
    } catch {
      setError("Failed to save preferences")
      setLoading(false)
    }
  }

  const steps = [
    {
      title: "Your Location",
      description: "Enter your postcode to find nearby stores",
      icon: <MapPin className="size-5" />,
      content: <PostcodeField value={postcode} onChange={setPostcode} />,
    },
    {
      title: "Your Budget",
      description: "Set your monthly food budget",
      icon: <Wallet className="size-5" />,
      content: <BudgetField value={budget} onChange={setBudget} />,
    },
    {
      title: "Religious Requirements",
      description: "Select any religious dietary requirements",
      icon: <Church className="size-5" />,
      content: <ReligionField value={religion} onChange={setReligion} />,
    },
    {
      title: "Dietary Restrictions",
      description: "Select any that apply to you",
      icon: <UtensilsCrossed className="size-5" />,
      content: (
        <DietaryField
          value={dietaryRestrictions}
          onChange={setDietaryRestrictions}
        />
      ),
    },
    {
      title: "Meal Preference",
      description: "How do you prefer to have your meals?",
      icon: <UtensilsCrossed className="size-5" />,
      content: (
        <MealPreferenceField
          value={mealPreference}
          onChange={setMealPreference}
        />
      ),
    },
    {
      title: "Tell us more",
      description:
        "With your current budget and food requirements, what do you want to achieve?",
      icon: <MessageSquare className="size-5" />,
      content: (
        <div className="space-y-3">
          <Textarea
            placeholder="e.g. I want to meal prep for the week on a tight budget while keeping things healthy..."
            value={userGoal}
            onChange={(e) => {
              setUserGoal(e.target.value)
              if (validationState !== "idle") {
                setValidationState("idle")
                setValidationError(null)
                setRephrasedGoal(null)
              }
            }}
            rows={4}
            disabled={validationState === "validating"}
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {userGoal.length}/500
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleGoalSubmit}
              disabled={
                userGoal.length < 10 || validationState === "validating"
              }
            >
              {validationState === "validating" ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  Validating...
                </>
              ) : validationState === "valid" ? (
                <>
                  <CheckCircle2 className="size-3" />
                  Validated
                </>
              ) : (
                <>
                  <ShieldCheck className="size-3" />
                  Validate
                </>
              )}
            </Button>
          </div>

          {validationState === "invalid" && validationError && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {validationState === "valid" && rephrasedGoal && (
            <Alert>
              <CheckCircle2 className="size-4" />
              <AlertDescription>
                <span className="font-medium">We understood that as:</span>
                <p className="mt-1 text-muted-foreground">{rephrasedGoal}</p>
              </AlertDescription>
            </Alert>
          )}
        </div>
      ),
    },
  ]

  const current = steps[step - 1]
  const totalSteps = steps.length
  const isLastStep = step === totalSteps
  const canFinish = isLastStep && validationState === "valid" && mealPreference !== ""

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          {current.icon}
          <CardTitle>{current.title}</CardTitle>
        </div>
        <CardDescription>{current.description}</CardDescription>
        <div className="flex gap-1 pt-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i < step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent>{current.content}</CardContent>
      <CardFooter className="flex justify-between">
        {step > 1 ? (
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        ) : (
          <div />
        )}
        {!isLastStep ? (
          <Button onClick={() => setStep(step + 1)}>Continue</Button>
        ) : (
          <Button onClick={handleFinish} disabled={!canFinish || loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Finish"
            )}
          </Button>
        )}
      </CardFooter>
      {error && (
        <p className="text-sm text-red-500 px-6 pb-4">{error}</p>
      )}
    </Card>
  )
}
