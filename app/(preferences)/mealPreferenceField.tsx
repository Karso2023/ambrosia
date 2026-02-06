"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ChefHat, UtensilsCrossed, Blend } from "lucide-react"

export type MealPreference = "cook" | "eat_out" | "mix"

interface MealPreferenceFieldProps {
  value: MealPreference | ""
  onChange: (value: MealPreference) => void
}

const OPTIONS: { value: MealPreference; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: "cook",
    label: "Cook at Home",
    icon: <ChefHat className="size-5" />,
    description: "Best for budgeting",
  },
  {
    value: "mix",
    label: "Mix Both",
    icon: <Blend className="size-5" />,
    description: "Cook prioritised",
  },
  {
    value: "eat_out",
    label: "Eat Out",
    icon: <UtensilsCrossed className="size-5" />,
    description: "May exceed budget",
  },
]

export function MealPreferenceField({ value, onChange }: MealPreferenceFieldProps) {
  return (
    <div className="grid gap-3">
      <Label>How do you prefer to have your meals?</Label>
      <div className="grid gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
              value === option.value
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-accent"
            }`}
            onClick={() => onChange(option.value)}
          >
            <div
              className={`mt-0.5 ${
                value === option.value ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {option.icon}
            </div>
            <div className="flex-1">
              <div className="font-medium">{option.label}</div>
              <div className="text-sm text-muted-foreground">{option.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
