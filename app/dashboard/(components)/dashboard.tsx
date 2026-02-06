"use client"

import { FoodBudget } from "./foodBudget"
import { MealPlan } from "./mealPlan"
import { MonthlyExpense } from "./monthlyExpense"
import { NutritionCount } from "./nutritionCount"
import { MonthlySavings } from "./monthlySavings"
import { ShoppingList } from "./shoppingList"
import { Nudges } from "./nudges"

export function Dashboard() {
  return (
    <div className="w-full p-6">
      <h1 className="text-2xl font-bold mb-8 text-black dark:text-white">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-2">
        <Nudges />
        <FoodBudget />
        <MealPlan />
        <ShoppingList />
        <MonthlyExpense />
        <NutritionCount />
        <MonthlySavings />
      </div>
    </div>
  )
}