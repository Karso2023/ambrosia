"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/client"
import { NavBar } from "@/app/(navBar)/navBar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ShieldAlert, Users } from "lucide-react"

interface UserWithViolations {
  id: string
  name: string
  email: string
  role: string
  banned: boolean
  created_at: string
  violation_count: number
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserWithViolations[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [banTarget, setBanTarget] = useState<UserWithViolations | null>(null)
  const [banning, setBanning] = useState(false)

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

  async function checkAdminAndFetch() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setIsAdmin(false)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      setIsAdmin(false)
      setLoading(false)
      return
    }

    setIsAdmin(true)
    await fetchUsers()
  }

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setUsers(data.users)
    } catch (err) {
      console.error("Error fetching users:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleBan(userId: string) {
    setBanning(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "PATCH",
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "Failed to ban user")
        return
      }
      setBanTarget(null)
      await fetchUsers()
    } catch {
      alert("Failed to ban user")
    } finally {
      setBanning(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
        <NavBar />
        <div className="w-full max-w-4xl mx-auto p-6">
          <p className="text-zinc-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
        <NavBar />
        <div className="w-full max-w-4xl mx-auto p-6 text-center mt-20">
          <ShieldAlert className="size-12 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-black dark:text-white">
            Access Denied
          </h1>
          <p className="text-zinc-500 mt-2">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <NavBar />
      <div className="w-full max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-8 text-black dark:text-white flex items-center gap-2">
          <Users className="size-6" />
          Admin Dashboard
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              Users with more than 5 illegal prompt violations can be banned.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-zinc-500 text-sm">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-zinc-500 dark:text-zinc-400">
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium">Joined</th>
                      <th className="pb-3 font-medium text-center">Violations</th>
                      <th className="pb-3 font-medium text-center">Status</th>
                      <th className="pb-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b last:border-0 text-black dark:text-white"
                      >
                        <td className="py-3">{u.name || "—"}</td>
                        <td className="py-3 text-zinc-600 dark:text-zinc-400">
                          {u.email}
                        </td>
                        <td className="py-3 text-zinc-600 dark:text-zinc-400">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-center">
                          <Badge
                            variant={u.violation_count > 5 ? "destructive" : "secondary"}
                          >
                            {u.violation_count}
                          </Badge>
                        </td>
                        <td className="py-3 text-center">
                          {u.banned ? (
                            <Badge variant="destructive">Banned</Badge>
                          ) : (
                            <Badge variant="outline">Active</Badge>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          {u.violation_count > 5 && !u.banned && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setBanTarget(u)}
                            >
                              Ban User
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!banTarget} onOpenChange={() => setBanTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Ban</DialogTitle>
            <DialogDescription>
              Are you sure you want to ban{" "}
              <span className="font-semibold text-black dark:text-white">
                {banTarget?.name || banTarget?.email}
              </span>
              ? This user has {banTarget?.violation_count} illegal prompt
              violations. This action cannot be easily undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={banning}
              onClick={() => banTarget && handleBan(banTarget.id)}
            >
              {banning ? "Banning..." : "Ban User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
