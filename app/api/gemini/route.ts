import { NextRequest, NextResponse } from "next/server"
import { geminiModel } from "@/lib/gemini/client"
import { buildRephrasePrompt } from "@/lib/gemini/prompts"
import { validateUserGoal } from "@/lib/gemini/validation"

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json()

    const validation = validateUserGoal(input)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const prompt = buildRephrasePrompt(validation.data)
    const result = await geminiModel.generateContent(prompt)
    const rephrased = result.response.text().trim()

    if (rephrased === "UNRELATED_INPUT") {
      return NextResponse.json(
        { error: "Your input doesn't seem related to food or nutrition goals. Please try again." },
        { status: 400 }
      )
    }

    return NextResponse.json({ rephrased })
  } catch (err: unknown) {
    console.error("Gemini API error:", err)

    const isRateLimit =
      err instanceof Error && "status" in err && (err as { status: number }).status === 429

    return NextResponse.json(
      {
        error: isRateLimit
          ? "Rate limit reached. Please wait a moment and try again."
          : "Something went wrong. Please try again.",
      },
      { status: isRateLimit ? 429 : 500 }
    )
  }
}
