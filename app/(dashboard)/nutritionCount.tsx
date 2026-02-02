"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function NutritionCount() {
    return(
        <Card>
            <CardHeader>
                <CardTitle>Meal Value</CardTitle>
                <CardDescription>Click here to check your nutrition per dollar!</CardDescription>
            </CardHeader>
        </Card>
    )
}