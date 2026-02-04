import { NavBar } from "@/app/(navBar)/navBar"
import { Dashboard } from "@/app/dashboard/(components)/dashboard"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <NavBar />
      <Dashboard />
    </div>
  )
}
