"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"
import { LoginDialog } from "./loginPage"
import { RegisterDialog } from "./registerPage"
import Link from "next/link"
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
import { Menu, X, User2Icon } from "lucide-react"
import type { User } from "@supabase/supabase-js"

export function NavBar() {
  const router = useRouter()
  const [user, setUser] = React.useState<User | null>(null)
  const [isLoginOpen, setIsLoginOpen] = React.useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

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
      <nav className="border-b bg-white dark:bg-black px-4 py-3">
        <div className="flex items-center justify-between">

          <Link
            href="/#ambrosia"
            className="text-2xl font-bold text-black dark:text-white"
          >
            Ambrosia
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavigationMenu>
              <NavigationMenuList>
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

            {/* Desktop Avatar Dropdown */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full outline-none">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback>
                      {user ? user.email?.charAt(0).toUpperCase() : "?"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" sideOffset={5}>
                {user ? (
                  <>
                    <DropdownMenuItem onClick={() => router.push("/settings")}>
                      <User2Icon className="size-4 mr-2" />
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

          {/* Mobile Controls */}
          <div className="flex items-center gap-3 md:hidden">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full outline-none">
                  <Avatar className="h-9 w-9">
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

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-black dark:text-white"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="mt-4 flex flex-col gap-4 md:hidden">
            <Link href="/#about" onClick={() => setIsMobileMenuOpen(false)}>
              About Us
            </Link>

            {!user && (
              <Link href="/#get-started" onClick={() => setIsMobileMenuOpen(false)}>
                Get Started
              </Link>
            )}

            {user && (
              <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                Dashboard
              </Link>
            )}

            <Link href="/#contact" onClick={() => setIsMobileMenuOpen(false)}>
              Contact
            </Link>
          </div>
        )}
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
