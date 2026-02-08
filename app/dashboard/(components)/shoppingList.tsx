"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Loader2, RefreshCw, Check, Star } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ShoppingItem {
  name: string
  quantity: string
  aisle: string
  checked: boolean
  meal_ids: string[]
  is_staple: boolean
}

interface ShoppingList {
  items: ShoppingItem[]
  total_estimated_cost: number
  week_start: string
  common_staples: Array<{ name: string; always_buy: boolean }>
}

export function ShoppingList() {
  const [list, setList] = useState<ShoppingList | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadShoppingList()
  }, [])

  const loadShoppingList = async () => {
    try {
      const res = await fetch("/api/shopping-list/update")
      const data = await res.json()
      if (res.ok && data.shopping_list) {
        setList({
          items: data.shopping_list.items || [],
          total_estimated_cost: data.shopping_list.total_estimated_cost || 0,
          week_start: data.shopping_list.week_start,
          common_staples: data.shopping_list.common_staples || []
        })
      }
    } catch (error) {
      console.error("Failed to load shopping list:", error)
    }
  }

  const generateList = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/shopping-list/generate", {
        method: "POST",
      })

      const data = await res.json()
      if (res.ok) {
        setList({
          items: data.items || [],
          total_estimated_cost: data.total_estimated_cost || 0,
          week_start: data.week_start,
          common_staples: data.shopping_list?.common_staples || []
        })
      } else {
        setError(data.error || "Failed to generate shopping list")
      }
    } catch (error) {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const toggleItem = async (index: number) => {
    if (!list) return

    const updatedItems = [...list.items]
    updatedItems[index].checked = !updatedItems[index].checked

    setList({ ...list, items: updatedItems })

    // Save to backend
    try {
      await fetch("/api/shopping-list/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_start: list.week_start,
          items: updatedItems,
          common_staples: list.common_staples
        }),
      })
    } catch (error) {
      console.error("Failed to update shopping list:", error)
    }
  }

  const toggleStaple = async (index: number) => {
    if (!list) return

    const item = list.items[index]
    const updatedStaples = list.common_staples || []

    if (item.is_staple) {
      // Remove from staples
      const filtered = updatedStaples.filter(s => s.name.toLowerCase() !== item.name.toLowerCase())
      const updatedItems = [...list.items]
      updatedItems[index].is_staple = false

      setList({ ...list, items: updatedItems, common_staples: filtered })

      await fetch("/api/shopping-list/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_start: list.week_start,
          items: updatedItems,
          common_staples: filtered
        }),
      })
    } else {
      // Add to staples
      updatedStaples.push({ name: item.name, always_buy: true })
      const updatedItems = [...list.items]
      updatedItems[index].is_staple = true

      setList({ ...list, items: updatedItems, common_staples: updatedStaples })

      await fetch("/api/shopping-list/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_start: list.week_start,
          items: updatedItems,
          common_staples: updatedStaples
        }),
      })
    }
  }

  const groupByAisle = (items: ShoppingItem[]) => {
    const grouped: Record<string, ShoppingItem[]> = {}
    items.forEach((item, index) => {
      if (!grouped[item.aisle]) {
        grouped[item.aisle] = []
      }
      grouped[item.aisle].push({ ...item, index } as any)
    })
    return grouped
  }

  const checkedCount = list?.items.filter(i => i.checked).length || 0
  const totalCount = list?.items.length || 0
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0

  return (
    <Card className="col-span-full shadow-sm bg-red-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ShoppingCart className="size-5" />
              Shopping List
            </CardTitle>
            <CardDescription className="mt-1">
              {list
                ? `${checkedCount}/${totalCount} items • £${list.total_estimated_cost.toFixed(2)} estimated`
                : "Generate your weekly shopping list"}
            </CardDescription>
          </div>
          <Button onClick={generateList} disabled={loading} variant="outline" size="sm">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="size-4 mr-2" />
                {list ? "Regenerate" : "Generate List"}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="border-destructive/50">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {list && totalCount > 0 && (
          <>
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progress</span>
                <span className="text-muted-foreground">{progress}% complete</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <Separator />

            {/* Items grouped by aisle */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {Object.entries(groupByAisle(list.items)).map(([aisle, items]) => (
                <div key={aisle} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-foreground">{aisle}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {items.filter((i: any) => i.checked).length}/{items.length}
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    {items.map((item: any) => (
                      <div
                        key={`${item.name}-${item.index}`}
                        className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${
                          item.checked
                            ? "bg-muted/50 border-muted"
                            : "bg-card border-border hover:border-primary/50"
                        }`}
                      >
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => toggleItem(item.index)}
                          className="shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${item.checked ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {item.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{item.quantity}</p>
                        </div>
                        <button
                          onClick={() => toggleStaple(item.index)}
                          className={`shrink-0 p-1 rounded transition-colors ${
                            item.is_staple
                              ? "text-yellow-500 hover:text-yellow-600"
                              : "text-muted-foreground hover:text-yellow-500"
                          }`}
                          title={item.is_staple ? "Remove from staples" : "Save as staple"}
                        >
                          <Star className={`size-4 ${item.is_staple ? "fill-current" : ""}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {progress === 100 && (
              <div className="flex items-center justify-center gap-2 p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Check className="size-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  Shopping list complete! Great job! 🎉
                </span>
              </div>
            )}
          </>
        )}

        {!list && !loading && (
          <div className="text-center py-8">
            <ShoppingCart className="size-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No shopping list yet. Generate one from your meal plan!
            </p>
            <Button onClick={generateList} size="sm">
              Generate Shopping List
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
