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
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-2">
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