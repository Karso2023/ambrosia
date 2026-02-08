"use client"

import { useState } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { OnboardingWizard } from "@/app/(preferences)/onboardingWizard"

interface RegisterDialogProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToLogin: () => void
}

export function RegisterDialog({ isOpen, onClose, onSwitchToLogin }: RegisterDialogProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [onboardingDone, setOnboardingDone] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setLoading(false)
    setSuccess(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {success && !onboardingDone ? (
        <OnboardingWizard onComplete={() => setOnboardingDone(true)} />
      ) : (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>
              {onboardingDone ? "Almost there!" : "Register an account"}
            </CardTitle>
            <CardAction>
              <Button variant="outline" onClick={onClose}>X</Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {onboardingDone ? (
              <p className="text-sm text-center">
                Account successfully registered!
              </p>
            ) : (
              <form onSubmit={handleRegister}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-red-500">{error}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Registering..." : "Register"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <div className="text-center text-sm mt-2 ">
              Already have an account?{" "}
              <a
                href="#"
                className="underline w-full hover:text-blue-600"
                onClick={(e) => {
                  e.preventDefault()
                  onClose()
                  onSwitchToLogin()
                }}
              >
                Login
              </a>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
