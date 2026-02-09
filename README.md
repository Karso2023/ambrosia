
# Ambrosia

**Eat well. Spend less. Save automatically.**

Ambrosia is an AI-powered meal planning assistant that helps users eat nutritiously while staying within their food budget. It generates personalised monthly meal plans with easy recipes, and when users miss a meal, the AI motivates them, understands their mood, and reschedules the plan — keeping it healthy and under budget.

## The Problem

Eating well on a budget is hard. People often choose between nutrition and affordability, leading to poor eating habits, wasted food, or overspending. Meal planning takes time and effort that most people don't have, and when life gets in the way, most plans just fall apart.

Ambrosia solves this by generating easy, affordable meal plans with AI — and when users can't follow the plan, the AI listens, understands their situation, and reschedules meals to keep things healthy and under budget.

## Features

### AI-Powered Meal Plans
- Generates a full monthly meal plan tailored to your budget, dietary restrictions, and religious requirements
- Supports three modes: **cook at home**, **eat out**, or a **mix of both**
- Each meal includes nutritional info (calories, protein, carbs, fat, fibre) with colour-coded nutrition levels
- Daily cost breakdowns and monthly spending summaries

### Smart Shopping Lists
- Automatically generated from your meal plan's home-cooked meals
- Items grouped by grocery aisle for efficient shopping
- Track progress with a visual completion bar
- Star staple items for future shopping trips

### Restaurant Discovery
- Search for nearby restaurants using your postcode
- AI analyses each restaurant and scores it on:
  - Budget compatibility
  - Dietary restriction matching
  - Nutritional value
- Save up to 12 favourite restaurants for your rotation

### Interactive Dashboard
- Calendar view of your entire monthly meal plan
- Click any meal to see full recipe details, ingredients, or restaurant info
- Track daily meal completion (breakfast, lunch, dinner)
- View real-time progress stats

## Staying Motivated

Ambrosia keeps users motivated not through pressure, but by making healthy eating easier and more forgiving:

- **Easy, budget-friendly recipes** -- Every meal is designed to be simple to cook and within your budget, removing the biggest barriers to eating well
- **No judgement for missed meals** -- Users can mark whether they followed the plan or not. If they missed a meal, they tell the AI why
- **AI that understands you** -- The AI reads your mood and reasons, then encourages you and reschedules the meal plan accordingly — always keeping it healthy and under budget
- **Mood-aware rescheduling** -- Feeling stressed or tired? The AI adapts your upcoming meals to match how you're feeling, so the plan works with your life, not against it
- **Progress tracking** -- See your meals cooked, savings, and adherence rate to appreciate how far you've come

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (Turbopack) |
| Styling | Tailwind CSS v4, Radix UI, shadcn/ui |
| Auth & Database | Supabase (PostgreSQL, Auth, Google OAuth) |
| AI | Google Gemini 2.5 Flash Lite |
| APIs | Google Places API, Google Maps Autocomplete |
| Validation | Zod |

## Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

## Authors

- [@Karso2023](https://www.github.com/Karso2023)
- [@RyanT04](https://www.github.com/RyanT04)

## License

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
