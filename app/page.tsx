import { NavBar } from "./(navBar)/navBar"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <NavBar />
      <main className="flex flex-col items-center justify-center px-6 py-24 max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold tracking-tight text-black dark:text-white">
          Ambrosia
        </h1>
        <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
          Take control of your meal planning, grocery budget, and nutrition
          tracking — all in one place.
        </p>
        <div className="mt-10 flex gap-4">
          <Button asChild size="lg">
            <Link href="/dashboard">Get Started</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
