"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function FoodBudget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meal Budget</CardTitle>
        <CardDescription>Your current monthly cost</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-lg">Total costs:</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">$$$</p>
      </CardContent>
    </Card>
  )
}