"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/client"
import { NavBar } from "./(navBar)/navBar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CircleSmall, Frown, Smile } from "lucide-react"
import { RegisterDialog } from "./(navBar)/registerPage"
import { LoginDialog } from "./(navBar)/loginPage"
import type { User } from "@supabase/supabase-js"

export default function Home() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <>
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
                    Problems
                  </CardHeader>
                  <Separator />
                  <CardDescription className="mt-4 flex flex-col items-start gap-2 text-left px-4">
                    <p className="flex items-start gap-2">
                      <Frown className="size-4 mt-1 flex-shrink-0" />
                      Many individuals and families struggle to balance healthy eating with financial constraints.
                    </p>
                    <p className="flex items-start gap-2">
                      <Frown className="size-4 mt-1 flex-shrink-0" />
                      Grocery prices fluctuate frequently and nutritional information is fragmented.
                    </p>
                    <p className="flex items-start gap-2">
                      <Frown className="size-4 mt-1 flex-shrink-0" />
                      Meal planning requires time, knowledge, and effort.
                    </p>
                  </CardDescription>
                </Card>

                <Card className="text-center bg-white/50">
                  <CardHeader className="text-xl font-semibold">
                    Solution
                  </CardHeader>
                  <Separator />
                  <CardDescription className="mt-4 flex flex-col items-start gap-2 text-left px-4">
                    <p className="flex items-start gap-2">
                      <Smile className="size-4 mt-1 flex-shrink-0" />
                      Ambrosia actively optimises grocery spending while maximising nutritional value.
                    </p>
                    <p className="flex items-start gap-2">
                      <Smile className="size-4 mt-1 flex-shrink-0" />
                      Combines real-time grocery pricing data, nutritional information, and user dietary preferences.
                    </p>
                    <p className="flex items-start gap-2">
                      <Smile className="size-4 mt-1 flex-shrink-0" />
                      Ambrosia generates personalised weekly meal plans and cost-efficient grocery lists based on a user's budget.
                    </p>
                  </CardDescription>
                </Card>

              </div>
            </CardContent>
          </Card>
        </section>

        <section id="howitworks" className="px-6 py-18 max-w-5xl mx-auto">
          <Card className="bg-white/50 p-8">
            <CardTitle>
              <h2 className="text-3xl text-black dark:text-white text-center">How Ambrosia works</h2>
            </CardTitle>
            <div className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto flex flex-col items-start gap-2">
              <p className="flex items-start gap-2">
                <CircleSmall className="size-3 mt-1 flex-shrink-0" />
                Register an account via email, or simply login with your Google account.
              </p>
              <p className="flex items-start gap-2">
                <CircleSmall className="size-3 mt-1 flex-shrink-0" />
                Input postcode, monthly food budget, religious and dietary requirements, and meal preferences.
              </p>
              <p className="flex items-start gap-2">
                <CircleSmall className="size-3 mt-1 flex-shrink-0" />
                Tell our friendly AI more about your goals (e.g. bulking at the gym).
              </p>
              <p className="flex items-start gap-2">
                <CircleSmall className="size-3 mt-1 flex-shrink-0" />
                Click "Finish".
              </p>
            </div>
          </Card>
        </section>

        {!user && (
          <section id="get-started" className="px-6 py-24 max-w-4xl mx-auto text-center">
            <Card className="bg-white/50 p-8">
              <CardTitle>
                <h2 className="text-3xl text-black dark:text-white text-center">Get Started</h2>
              </CardTitle>
              <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Create an account and start planning your meals today!
              </p>
              <div className="mt-8">
                <Button size="lg" onClick={() => setIsRegisterOpen(true)}>
                  Sign me up!
                </Button>
              </div>
            </Card>
          </section>
        )}

        <section id="contact" className="px-6 py-24 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-black dark:text-white">Contact</h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Have questions or feedback? Reach out to us.
          </p>
        </section>
      </div>

      <RegisterDialog
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterOpen(false)
          setIsLoginOpen(true)
        }}
      />

      <LoginDialog
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </>
  )
}