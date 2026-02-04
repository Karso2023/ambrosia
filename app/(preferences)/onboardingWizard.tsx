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
import { PostcodeField } from "./postcodeField"
import { BudgetField } from "./budgetField"
import { ReligionField } from "./religionField"
import { DietaryField } from "./dietaryField"
import { setUserPreferences } from "@/lib/preferences"
import { MapPin, Wallet, Church, UtensilsCrossed } from "lucide-react"

interface OnboardingWizardProps {
  onComplete: () => void
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1)
  const [postcode, setPostcode] = useState("")
  const [budget, setBudget] = useState("")
  const [religion, setReligion] = useState<string[]>([])
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFinish = async () => {
    setLoading(true)
    setError(null)
    try {
      await setUserPreferences({
        postcode,
        budget,
        religion,
        dietary_restrictions: dietaryRestrictions,
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
  ]

  const current = steps[step - 1]
  const totalSteps = steps.length

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
        {step < totalSteps ? (
          <Button onClick={() => setStep(step + 1)}>Continue</Button>
        ) : (
          <Button onClick={handleFinish} disabled={loading}>
            {loading ? "Saving..." : "Finish"}
          </Button>
        )}
      </CardFooter>
      {error && (
        <p className="text-sm text-red-500 px-6 pb-4">{error}</p>
      )}
    </Card>
  )
}
