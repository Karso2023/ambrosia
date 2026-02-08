"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { DIETARY_OPTIONS } from "@/lib/preferences"

interface DietaryFieldProps {
  value: string[]
  onChange: (value: string[]) => void
}

export function DietaryField({ value, onChange }: DietaryFieldProps) {
  const toggle = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option))
    } else {
      onChange([...value, option])
    }
  }

  return (
    <div className="grid gap-2">
      <Label>Dietary Restrictions</Label>
      <div className="flex flex-wrap gap-2">
        {DIETARY_OPTIONS.map((option) => (
          <Button
            key={option}
            type="button"
            variant="outline"
            size="sm"
            className={
              value.includes(option)
                ? "bg-primary/80 text-primary-foreground hover:bg-primary/60"
                : ""
            }
            onClick={() => toggle(option)}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  )
}
