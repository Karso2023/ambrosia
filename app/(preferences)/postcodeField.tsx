"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, MapPin } from "lucide-react"

interface Suggestion {
  description: string
  placeId: string
}

interface PostcodeFieldProps {
  value: string
  onChange: (value: string) => void
}

export function PostcodeField({ value, onChange }: PostcodeFieldProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchSuggestions = (input: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (input.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/places/autocomplete?input=${encodeURIComponent(input)}`
        )
        const data = await res.json()
        setSuggestions(data.suggestions ?? [])
        setOpen((data.suggestions ?? []).length > 0)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  const handleSelect = (suggestion: Suggestion) => {
    // Extract just the postcode from the description (e.g. "SW1A 1AA, UK" -> "SW1A 1AA")
    const postcode = suggestion.description.split(",")[0].trim()
    onChange(postcode)
    setOpen(false)
    setSuggestions([])
  }

  return (
    <div className="grid gap-2" ref={wrapperRef}>
      <Label htmlFor="postcode">Postcode</Label>
      <div className="relative">
        <Input
          id="postcode"
          type="text"
          placeholder="e.g. SW1A 1AA"
          value={value}
          autoComplete="off"
          onChange={(e) => {
            onChange(e.target.value)
            fetchSuggestions(e.target.value)
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true)
          }}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        {open && suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
            {suggestions.map((s) => (
              <li key={s.placeId}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => handleSelect(s)}
                >
                  <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                  {s.description}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
