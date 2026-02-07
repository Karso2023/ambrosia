import { z } from "zod"

const BLOCKED_PATTERNS = [
  /\b(rape|kill|murder|attack|bomb|weapon|poison|hurt|harm|destroy)\b/i,
  /\b(sex|porn|nude|xxx)\b/i,
  /\b(password|credit.?card|social.?security|ssn|bank.?account)\b/i,
  /<script|javascript:|data:/i,
  /ignore.*(previous|above|prior).*(instruction|prompt)/i,
  /\bsystem\s*prompt\b/i,
]

export const userGoalSchema = z
  .string()
  .min(10, "Please provide at least 10 characters")
  .max(500, "Please keep your response under 500 characters")
  .refine(
    (val) => !BLOCKED_PATTERNS.some((pattern) => pattern.test(val)),
    "Your input contains inappropriate content. Please focus on your food and nutrition goals."
  )

export type ValidationState = "idle" | "validating" | "valid" | "invalid"

export function validateUserGoal(input: string) {
  const result = userGoalSchema.safeParse(input)
  if (result.success) {
    return { valid: true as const, data: result.data }
  }
  return {
    valid: false as const,
    error: result.error.issues[0]?.message ?? "Invalid input",
  }
}