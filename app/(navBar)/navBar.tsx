"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"
import { LoginDialog } from "./loginPage"
import Link from "next/link"
import { RegisterDialog } from "./registerPage"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Settings, User2Icon } from "lucide-react"
import type { User } from "@supabase/supabase-js"

export function NavBar() {
  const router = useRouter()
  const [user, setUser] = React.useState<User | null>(null)
  const [isLoginOpen, setIsLoginOpen] = React.useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = React.useState(false)

  React.useEffect(() => {
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

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = "/"
  }

  return (
    <>
      <nav className="border-b bg-white dark:bg-black p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-8">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink href="/#ambrosia" className="text-xl font-bold text-black dark:text-white">
                    Ambrosia
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink href="/#about" className={navigationMenuTriggerStyle()}>
                    About Us
                  </NavigationMenuLink>
                </NavigationMenuItem>
                {!user && (
                  <NavigationMenuItem>
                    <NavigationMenuLink href="/#get-started" className={navigationMenuTriggerStyle()}>
                      Get Started
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )}
                {user && (
                  <NavigationMenuItem>
                    <NavigationMenuLink href="/dashboard" className={navigationMenuTriggerStyle()}>
                      Dashboard
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )}
                <NavigationMenuItem>
                  <NavigationMenuLink href="/#contact" className={navigationMenuTriggerStyle()}>
                    Contact
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email ?? ""} />
                  <AvatarFallback>
                    {user ? user.email?.charAt(0).toUpperCase() : "?"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user ? (
                <>
                  <DropdownMenuItem onClick={() => router.push("/settings")}>
                    <User2Icon className="size-4" />
                    Preferences
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Log out
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => setIsLoginOpen(true)}>
                    Login
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsRegisterOpen(true)}>
                    Register
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      <LoginDialog isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <RegisterDialog
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterOpen(false)
          setIsLoginOpen(true)
        }}
      />
    </>
  )
}