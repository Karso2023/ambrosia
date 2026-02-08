import { createClient } from "@/lib/client"

export type MealPreference = "cook" | "eat_out" | "mix"

export interface UserPreferences {
  postcode: string
  budget: string
  religion: string[]
  dietary_restrictions: string[]
  meal_preference: MealPreference
}

export const RELIGION_OPTIONS = [
  "Halal",
  "Kosher",
  "Hindu Vegetarian",
  "Buddhist",
  "Jain",
] as const

export const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Nut-Free",
  "Shellfish-Free",
  "Egg-Free",
  "Soy-Free",
] as const

export async function getUserPreferences(): Promise<UserPreferences> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return {
    postcode: user?.user_metadata?.postcode ?? "",
    budget: user?.user_metadata?.budget ?? "",
    religion: user?.user_metadata?.religion ?? [],
    dietary_restrictions: user?.user_metadata?.dietary_restrictions ?? [],
    meal_preference: user?.user_metadata?.meal_preference ?? "cook",
  }
}

export async function setUserPreferences(prefs: Partial<UserPreferences>) {
  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ data: prefs })
  if (error) throw error
}
