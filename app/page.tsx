import { NavBar } from "./(navBar)/navBar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CircleSmall } from "lucide-react"


export default function Home() {
  return (
    <div className="min-h-screen scroll-smooth bg-gray-200 dark:bg-gray-900">
      <NavBar />

      <section className="flex flex-col items-center justify-center px-6 py-18 max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold tracking-tight text-black dark:text-white">
          Ambrosia
        </h1>
        <p className="mt-6 text-3xl text-gray-600 dark:text-gray-400">
          Eat well - Spend less - Save automatically
        </p>
      </section>

      <section id="about" className="px-6 py-18 max-w-5xl mx-auto text-center">
        <Card className="bg-white/50 p-8">
          <CardHeader>
            <CardTitle>
              <h2 className="text-3xl text-black dark:text-white">About Us</h2>
            </CardTitle>
            <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Ambrosia is an intelligent meal planning assistant powered by Gemini that helps you maximize your preferred nutrition whilst minimizing cost. Unlike traditional budgeting apps that only track spending, Ambrosia actively optimizes your grocery choices using real-time pricing, nutritional data, and AI-powered planning.
            </p>
          </CardHeader>

          <CardContent className="mt-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <Card className="text-center bg-white/50">
                <CardHeader className="text-xl font-semibold">
                  Problem
                </CardHeader>
                <Separator />
                <CardDescription className="mt-4 text-center">
                  Many individuals and families struggle to balance healthy eating with financial constraints. Grocery prices fluctuate frequently, nutritional information is fragmented, and meal planning requires time, knowledge, and effort. This challenge becomes even more complex for users with dietary restrictions such as halal, vegan, or allergy-based requirements. Existing budgeting apps only track expenses after money has been spent, rather than actively helping users optimise their food choices. As a result, people often overspend, compromise on nutrition, or fail to meet their dietary goals.
                </CardDescription>
              </Card>

              <Card className="text-center bg-white/50">
                <CardHeader className="text-xl font-semibold">
                  Solution
                </CardHeader>
                <Separator />
                <CardDescription className="mt-4 text-center">
                  ambrosia.ai is an intelligent meal planning assistant that actively optimises grocery spending while maximising nutritional value. By combining real-time grocery pricing data, nutritional information, and user dietary preferences, Gemini generates personalised weekly meal plans and cost-efficient grocery lists that stay within a user’s budget. The system ensures dietary safety and nutritional accuracy through automated evaluation and validation, while tracking any unspent budget as automatic savings. Instead of simply monitoring expenses, ambrosia.ai proactively engineers smarter food decisions to help users eat well and save money simultaneously.
                </CardDescription>
              </Card>

            </div>
          </CardContent>
        </Card>
      </section>

      <section id="howitworks" className="px-6 py-24 max-w-4xl mx-auto text-center">
        <Card>
        <h2 className="text-3xl font-bold text-black dark:text-white">How It Works</h2>
        <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          <CircleSmall className="size-5"/>Simply set your dietary preferences, location and monthly food budget—then let our AI create optimized weekly meal plans and grocery lists.
        </p>
        </Card>
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
