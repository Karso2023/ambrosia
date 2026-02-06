export interface NudgeContext {
  missedDays: number
  lastActive: Date | null
  adherenceRate: number // 0-1
  totalMealsCompleted: number
  currentStreak: number
  totalSaved: number // money saved vs eating out
  todayMealsCompleted?: number // 0-3
  currentMood?: "happy" | "tired" | "stressed" | "motivated" | "neutral"
}

export interface Nudge {
  message: string
  action?: string
  actionLink?: string
  tone: 'celebrate' | 'encourage' | 'rescue' | 'info'
  icon?: string
}

const CELEBRATION_MESSAGES = [
  {
    threshold: 5,
    messages: [
      "🎉 5 meals cooked! You're building a great habit.",
      "✨ Nice! 5 home-cooked meals under your belt.",
      "🌟 5 meals down! Keep up the momentum."
    ]
  },
  {
    threshold: 10,
    messages: [
      "🔥 10 meals! You're absolutely crushing it!",
      "💪 Double digits! Your cooking skills are leveling up.",
      "🎊 10 meals cooked! That's serious dedication."
    ]
  },
  {
    threshold: 20,
    messages: [
      "🏆 20 meals! You're a cooking champion!",
      "⭐ 20 home-cooked meals! That's incredible consistency.",
      "🎯 20 meals! Your future self thanks you."
    ]
  },
  {
    threshold: 50,
    messages: [
      "🌈 50 meals! You've transformed your eating habits!",
      "💎 50 meals cooked! You're a meal prep master now.",
      "🚀 50 meals! Absolutely legendary."
    ]
  }
]

export function getNudgeMessage(context: NudgeContext): Nudge | null {
  // Celebrate all meals completed today
  if (context.todayMealsCompleted === 3) {
    return {
      message: "Amazing! All three meals completed today! You're absolutely crushing it!",
      tone: 'celebrate',
      icon: '🏆'
    }
  }

  // Mood-aware messages (take priority when mood is set today)
  if (context.currentMood === "tired") {
    return {
      message: "Feeling tired? No worries! How about a super simple one-pot meal tonight? Minimal effort, maximum comfort.",
      action: "Show easy meals",
      actionLink: "/dashboard?filter=easy",
      tone: 'encourage',
      icon: '🍲'
    }
  }

  if (context.currentMood === "stressed") {
    return {
      message: "Cooking can be therapeutic! Try a simple comfort food recipe to unwind. You've got this!",
      action: "Browse comfort food",
      actionLink: "/dashboard?filter=comfort",
      tone: 'encourage',
      icon: '🧘'
    }
  }

  if (context.currentMood === "happy") {
    return {
      message: "Love that positive energy! Why not try something new and exciting today?",
      tone: 'celebrate',
      icon: '🌟'
    }
  }

  if (context.currentMood === "motivated") {
    return {
      message: "You're feeling motivated - perfect time to meal prep for the week ahead!",
      action: "View meal prep tips",
      actionLink: "/dashboard?filter=mealprep",
      tone: 'celebrate',
      icon: '💪'
    }
  }

  // Celebration for milestones
  for (const milestone of CELEBRATION_MESSAGES) {
    if (context.totalMealsCompleted === milestone.threshold) {
      const randomMessage = milestone.messages[Math.floor(Math.random() * milestone.messages.length)]
      const savedAmount = context.totalMealsCompleted * 8 // avg £8 saved per meal
      return {
        message: `${randomMessage} You've saved ~£${savedAmount} vs eating out.`,
        tone: 'celebrate',
        icon: '🎉'
      }
    }
  }

  // High adherence - celebrate
  if (context.adherenceRate > 0.8 && context.totalMealsCompleted > 3) {
    return {
      message: `You're on fire! ${Math.round(context.adherenceRate * 100)}% cooking success rate this week.`,
      tone: 'celebrate',
      icon: '🔥'
    }
  }

  // Missed 1-2 days - gentle rescue
  if (context.missedDays >= 1 && context.missedDays <= 2) {
    return {
      message: "Life happens! Those ingredients are still fresh. Want to cook something quick tonight?",
      action: "Show 15-min meals",
      actionLink: "/dashboard?filter=quick",
      tone: 'rescue',
      icon: '🍳'
    }
  }

  // Missed 3+ days - encouraging reset
  if (context.missedDays >= 3) {
    return {
      message: "Let's get back on track with something super easy. No pressure!",
      action: "Find easy recipes",
      actionLink: "/dashboard?filter=easy",
      tone: 'encourage',
      icon: '✨'
    }
  }

  // Good streak - encourage
  if (context.currentStreak >= 3) {
    return {
      message: `${context.currentStreak} days in a row! You're building an amazing routine.`,
      tone: 'celebrate',
      icon: '⚡'
    }
  }

  // New user - welcome
  if (context.totalMealsCompleted === 0) {
    return {
      message: "Ready to start saving money and eating healthier? Let's cook your first meal!",
      action: "View this week's plan",
      actionLink: "/dashboard",
      tone: 'encourage',
      icon: '👋'
    }
  }

  // First meal - big encouragement
  if (context.totalMealsCompleted === 1) {
    return {
      message: "🎯 First meal completed! The hardest part is starting. You've got this!",
      tone: 'celebrate',
      icon: '🎯'
    }
  }

  return null
}

export function getWeeklyReflectionPrompt(adherenceRate: number): {
  question: string
  options: Array<{ value: string; label: string; emoji: string }>
} {
  return {
    question: "How did cooking feel this week?",
    options: [
      {
        value: "too_hard",
        label: "Too challenging",
        emoji: "😓"
      },
      {
        value: "just_right",
        label: "Just right!",
        emoji: "✅"
      },
      {
        value: "too_easy",
        label: "Could do more",
        emoji: "😊"
      }
    ]
  }
}

export function getSavingsMessage(totalMealsCooked: number): string {
  const avgSavingsPerMeal = 8 // £8 saved vs eating out
  const totalSaved = totalMealsCooked * avgSavingsPerMeal
  const monthlyRate = totalMealsCooked * 4 // estimate monthly if maintaining pace

  if (totalSaved < 50) {
    return `You've saved £${totalSaved} so far. Keep going!`
  } else if (totalSaved < 200) {
    return `£${totalSaved} saved! At this rate, you'll save ~£${monthlyRate}/month.`
  } else {
    return `Amazing! £${totalSaved} saved by cooking at home. That's real money in your pocket!`
  }
}

export function getMotivationalTip(): string {
  const tips = [
    "💡 Prep vegetables on Sunday to make weeknight cooking easier.",
    "💡 Cook double portions and freeze half for lazy days.",
    "💡 Can't face cooking? A simple omelette still beats takeaway.",
    "💡 Keep frozen veg on hand - they're just as nutritious and ready instantly.",
    "💡 One-pot meals = less washing up = more likely to cook again tomorrow.",
    "💡 Listen to music or a podcast while cooking - makes it more enjoyable!",
    "💡 It's okay to use pre-chopped ingredients when you're tired.",
    "💡 Start with the easiest recipe on your plan - build confidence first."
  ]

  return tips[Math.floor(Math.random() * tips.length)]
}
