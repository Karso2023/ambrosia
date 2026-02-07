"use client"

import { FoodBudget } from "./foodBudget"
import { MealPlan } from "./mealPlan"
import { MonthlyExpense } from "./monthlyExpense"
import { GroceryShop } from "./groceryShop"
import { NutritionCount } from "./nutritionCount"
import { MonthlySavings } from "./monthlySavings"

export function Dashboard() {
  return (
    <div className="w-full p-6">
      <h1 className="text-2xl font-bold mb-8 text-black dark:text-white">Dashboard</h1>
      
      <div className="grid grid-cols-3 gap-2 max-w-3xl [&>*]:w-58 [&>*]:h-48">
        <FoodBudget />
        <MealPlan />
        <MonthlyExpense />
        <GroceryShop />
        <NutritionCount />
        <MonthlySavings />
      </div>
    </div>
  )
}