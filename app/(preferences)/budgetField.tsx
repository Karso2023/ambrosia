"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface BudgetFieldProps {
  value: string
  onChange: (value: string) => void
}

export function BudgetField({ value, onChange }: BudgetFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="budget">Monthly Food Budget (£)</Label>
      <Input
        id="budget"
        type="number"
        placeholder="e.g. 400"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
