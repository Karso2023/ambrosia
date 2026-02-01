"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function MealPlan() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferred Meal Plan</CardTitle>
        <CardDescription>Your current meal preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-lg">Mediterranean Diet</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">3 meals, 2 snacks daily</p>
      </CardContent>
    </Card>
  )
}