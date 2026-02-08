export interface ShoppingItem {
  name: string
  quantity: string
  aisle: string
  checked: boolean
  meal_ids: string[]
  is_staple: boolean
}

export interface ShoppingList {
  items: ShoppingItem[]
  total_estimated_cost: number
  week_start: string
}

// Aisle categorization for UK supermarkets
const AISLE_MAPPING: Record<string, string[]> = {
  "Fresh Produce": [
    "onion", "garlic", "tomato", "lettuce", "cucumber", "carrot", "potato", "sweet potato",
    "pepper", "courgette", "zucchini", "broccoli", "cauliflower", "spinach", "kale",
    "mushroom", "avocado", "lemon", "lime", "apple", "banana", "orange", "berries",
    "ginger", "chilli", "coriander", "parsley", "basil", "mint"
  ],
  "Meat & Fish": [
    "chicken", "beef", "pork", "lamb", "mince", "steak", "sausage", "bacon",
    "salmon", "cod", "tuna", "prawns", "fish", "turkey"
  ],
  "Dairy & Eggs": [
    "milk", "cheese", "cheddar", "mozzarella", "parmesan", "butter", "cream",
    "yogurt", "yoghurt", "eggs", "egg"
  ],
  "Bakery": [
    "bread", "rolls", "bagels", "pitta", "naan", "tortilla", "wrap"
  ],
  "Pantry & Cupboard": [
    "rice", "pasta", "noodles", "flour", "sugar", "salt", "pepper",
    "oil", "olive oil", "vegetable oil", "vinegar", "soy sauce",
    "stock", "bouillon", "tinned tomatoes", "canned", "tin", "tomato puree", "paste"
  ],
  "Herbs & Spices": [
    "cumin", "paprika", "turmeric", "curry powder", "cinnamon", "oregano",
    "thyme", "bay leaves", "mixed herbs", "chili powder", "cayenne"
  ],
  "Frozen": [
    "frozen peas", "frozen corn", "frozen vegetables", "frozen"
  ],
  "Condiments & Sauces": [
    "ketchup", "mayonnaise", "mustard", "hot sauce", "worcestershire"
  ],
}

// Common staples that users likely already have
const COMMON_STAPLES = [
  "salt", "black pepper", "olive oil", "vegetable oil", "flour", "sugar"
]

export function categorizeByAisle(ingredient: string): string {
  const lowerIngredient = ingredient.toLowerCase()

  for (const [aisle, keywords] of Object.entries(AISLE_MAPPING)) {
    if (keywords.some(keyword => lowerIngredient.includes(keyword))) {
      return aisle
    }
  }

  return "Other"
}

export function isCommonStaple(ingredient: string): boolean {
  const lowerIngredient = ingredient.toLowerCase()
  return COMMON_STAPLES.some(staple => lowerIngredient.includes(staple))
}

export function aggregateIngredients(
  meals: Array<{
    id: string
    ingredients: string[]
    cost: number
  }>
): ShoppingItem[] {
  const ingredientMap = new Map<string, ShoppingItem>()

  meals.forEach(meal => {
    meal.ingredients?.forEach(ingredient => {
      // Extract base ingredient name (remove quantities like "2 cups", "500g")
      const baseName = extractIngredientName(ingredient)

      if (ingredientMap.has(baseName)) {
        const existing = ingredientMap.get(baseName)!
        existing.meal_ids.push(meal.id)
        // Aggregate quantities if possible
        existing.quantity = aggregateQuantities(existing.quantity, ingredient)
      } else {
        ingredientMap.set(baseName, {
          name: baseName,
          quantity: ingredient,
          aisle: categorizeByAisle(baseName),
          checked: false,
          meal_ids: [meal.id],
          is_staple: isCommonStaple(baseName)
        })
      }
    })
  })

  return Array.from(ingredientMap.values())
}

function extractIngredientName(ingredient: string): string {
  // Remove leading quantities: "2 cups flour" -> "flour"
  // Remove measurements: "500g chicken" -> "chicken"
  const cleaned = ingredient
    .replace(/^\d+(\.\d+)?\s*(cups?|tbsp|tsp|g|kg|ml|l|oz|lb|pounds?|pcs?|pieces?)\s+/i, '')
    .replace(/^\d+(\.\d+)?\s+/i, '')
    .trim()

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

function aggregateQuantities(existing: string, newQuantity: string): string {
  // Simple aggregation - just combine both quantities
  // In a real app, you'd parse and sum them properly
  const existingBase = extractIngredientName(existing)
  const newBase = extractIngredientName(newQuantity)

  if (existingBase.toLowerCase() === newBase.toLowerCase()) {
    // Extract numbers if possible
    const existingNum = parseFloat(existing.match(/[\d.]+/)?.[0] || '0')
    const newNum = parseFloat(newQuantity.match(/[\d.]+/)?.[0] || '0')

    if (existingNum && newNum) {
      const unit = existing.match(/[a-zA-Z]+/)?.[0] || ''
      return `${existingNum + newNum} ${unit}`
    }
  }

  return existing // Keep original if can't parse
}

export function estimateTotalCost(items: ShoppingItem[], mealCosts: number[]): number {
  // Simple estimation: sum of meal costs for the week
  return mealCosts.reduce((sum, cost) => sum + cost, 0)
}

export function sortItemsByAisle(items: ShoppingItem[]): ShoppingItem[] {
  const aisleOrder = [
    "Fresh Produce",
    "Meat & Fish",
    "Dairy & Eggs",
    "Bakery",
    "Frozen",
    "Pantry & Cupboard",
    "Herbs & Spices",
    "Condiments & Sauces",
    "Other"
  ]

  return items.sort((a, b) => {
    const aIndex = aisleOrder.indexOf(a.aisle)
    const bIndex = aisleOrder.indexOf(b.aisle)

    if (aIndex !== bIndex) {
      return aIndex - bIndex
    }

    return a.name.localeCompare(b.name)
  })
}
