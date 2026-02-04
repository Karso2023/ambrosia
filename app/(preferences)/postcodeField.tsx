"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PostcodeFieldProps {
  value: string
  onChange: (value: string) => void
}

export function PostcodeField({ value, onChange }: PostcodeFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="postcode">Postcode</Label>
      <Input
        id="postcode"
        type="text"
        placeholder="e.g. 2000"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
