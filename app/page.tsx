"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { createClient } from "@/lib/client"
import { NavBar } from "./(navBar)/navBar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CircleSmall, Frown, Smile, Flower } from "lucide-react"
import { RegisterDialog } from "./(navBar)/registerPage"
import { LoginDialog } from "./(navBar)/loginPage"
import { useScrollAnimation } from "@/hooks/useScrollAnimation"
import type { User } from "@supabase/supabase-js"
import { useRouter } from 'next/navigation'

export default function Home() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [currentBgColor, setCurrentBgColor] = useState("#3498db")
  const router = useRouter()

  // Create refs for each section
  const ambrosiaRef = useRef<HTMLElement>(null)
  const aboutRef = useRef<HTMLElement>(null)
  const howItWorksRef = useRef<HTMLElement>(null)
  const getStartedRef = useRef<HTMLElement>(null)
  const contactRef = useRef<HTMLElement>(null)

const sectionColors: { [key: string]: string } = {
  ambrosia: "#4A90E2",    // Soft Blue - Trust & calm
  about: "#F8E5B9",       // Cream/Light Yellow - Warmth
  howitworks: "#7DCEA0",  // Sage Green - Fresh & healthy
  getstarted: "#F5B7B1",  // Soft Coral - Inviting
  contact: "#D7DBDD"      // Light Gray - Professional
}

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

  // Setup scroll animation with background color changes
  const refs = useMemo(() => 
    user 
      ? [ambrosiaRef, aboutRef, howItWorksRef, contactRef]
      : [ambrosiaRef, aboutRef, howItWorksRef, getStartedRef, contactRef],
    [user]
  )

  useScrollAnimation(refs, {
    threshold: 0.5,
    rootMargin: "-50px",
    onEnter: (element) => {
      const sectionId = element.id
      const bgColor = sectionColors[sectionId]
      if (bgColor) {
        setCurrentBgColor(bgColor)
      }
    }
  })

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <NavBar />
      </div>
      
      {/* Animated background */}
      <div 
        className="fixed inset-0 -z-10 transition-colors duration-1000 ease-in-out"
        style={{ backgroundColor: currentBgColor }}
      />
      
      <main className="pt-16">
        <section 
          ref={ambrosiaRef}
          className="min-h-screen flex items-center justify-center" 
          id="ambrosia"
        >
          <div 
            className="flex flex-col items-center justify-center px-6 mx-auto text-center relative w-full h-screen"
            style={{
              backgroundImage: '',
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            <div className="relative z-10">
              <h1 className="text-5xl font-bold tracking-tight text-white flex items-center justify-center gap-4 animate-slide-up">
                <Flower className="size-10"/> 
                Ambrosia 
                <Flower className="size-10"/>
              </h1>
              <p className="mt-6 text-3xl text-white animate-slide-up animation-delay-200">
                Eat well - Spend less - Save automatically
              </p>
            </div>
          </div>
        </section>

        <section 
          ref={aboutRef}
          className="min-h-screen flex items-center justify-center" 
          id="about"
        >
          <div className="px-6 py-18 mx-auto flex items-center justify-center w-full">
            <Card className="bg-white/60 backdrop-blur-sm p-8 max-w-5xl text-center animate-fade-in">
              <CardHeader>
                <CardTitle>
                  <h2 className="text-3xl text-black dark:text-white text-center">About Us</h2>
                </CardTitle>
                <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Ambrosia is an intelligent meal planning assistant powered by Gemini that helps you maximize your preferred nutrition whilst minimizing cost. Unlike traditional budgeting apps that only track spending, Ambrosia actively optimizes your grocery choices using real-time pricing, nutritional data, and AI-powered planning.
                </p>
              </CardHeader>

              <CardContent className="mt-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="text-center bg-red-100/50 animate-slide-in-left">
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

                  <Card className="text-center bg-green-100/50 animate-slide-in-right">
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
          </div>
        </section>

        <section 
          ref={howItWorksRef}
          className="min-h-screen flex items-center justify-center" 
          id="howitworks"
        >
          <div className="px-6 mx-auto flex items-center justify-center w-full">
            <Card className="bg-white/60 backdrop-blur-sm p-8 animate-fade-in">
              <CardTitle>
                <h2 className="text-3xl text-black dark:text-white text-center">How Ambrosia works</h2>
              </CardTitle>
              <div className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto flex flex-col items-start gap-2">
                <p className="flex items-start gap-2">
                  <CircleSmall className="size-3 mt-1 flex-shrink-0" />
                  Register an account via email, or simply just login with your Google account
                </p>
                <p className="flex items-start gap-2">
                  <CircleSmall className="size-3 mt-1 flex-shrink-0"/>
                  Input your personal details such as postcode, monthly food budget, most importantly your religious and dietary requirements and lastly your meal preferences
                </p>
                <p className="flex items-start gap-2">
                  <CircleSmall className="size-3 mt-1 flex-shrink-0"/>
                  You could tell our friendly AI more about your preferences (e.g. I want to get big in the gym!)
                </p>
                <p className="flex items-start gap-2">
                  <CircleSmall className="size-3 mt-1 flex-shrink-0"/>
                  Click "Finish"
                </p>
              </div>
            </Card>
          </div>
        </section>

        {!user && (
          <section 
            ref={getStartedRef}
            className="min-h-screen flex items-center justify-center" 
            id="get-started"
          >
            <div className="px-6 mx-auto flex items-center justify-center w-full">
              <Card className="bg-white/90 backdrop-blur-sm p-8 animate-fade-in">
                <CardTitle>
                  <h2 className="text-3xl text-black dark:text-white text-center">Get Started</h2>
                </CardTitle>
                <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-center">
                  Create an account and start planning your meals today!
                </p>
                <div className="mt-8 text-center">
                  <Button size="lg" onClick={() => setIsRegisterOpen(true)}>
                    Sign me up!
                  </Button>
                </div>
              </Card>
            </div>
          </section>
        )}

        <section 
          ref={contactRef}
          className="min-h-screen flex items-center justify-center" 
          id="contact"
        >
          <div className="px-6 max-w-4xl mx-auto flex items-center justify-center w-full">
            <div className="text-center animate-fade-in">
              <h2 className="text-3xl font-bold text-black dark:text-white">Contact</h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Have questions or feedback? Reach out to us.
              </p>
            </div>
          </div>
        </section>
      </main>

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