import { NavBar } from "./(navBar)/navBar"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen scroll-smooth bg-zinc-50 font-sans dark:bg-black">
      <NavBar />

      <section className="flex flex-col items-center justify-center px-6 py-24 max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold tracking-tight text-black dark:text-white">
          Ambrosia
        </h1>
        <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
          Take control of your meal planning, grocery budget, and nutrition
          tracking — all in one place.
        </p>
        <div className="mt-10 flex gap-4">
          <Button asChild size="lg">
            <a href="#features">Learn More</a>
          </Button>
        </div>
      </section>

      <section id="features" className="px-6 py-24 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-black dark:text-white">Features</h2>
        <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Everything you need to plan meals, track nutrition, and manage your grocery budget.
        </p>
      </section>

      <section id="get-started" className="px-6 py-24 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-black dark:text-white">Get Started</h2>
        <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Create an account and start planning your meals today.
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </section>

      <section id="contact" className="px-6 py-24 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-black dark:text-white">Contact</h2>
        <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Have questions or feedback? Reach out to us.
        </p>
      </section>
    </div>
  )
}
