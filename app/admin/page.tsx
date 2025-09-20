"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getAllUsers, checkDatabaseConnection, initializeDatabase, type User } from "@/lib/database"
import { initializeAuth, type Admin } from "@/lib/auth"
import { Users, Plus, RefreshCw, Shield, LogOut, Ticket, BarChart3, History, Edit, Trash2, RotateCcw } from "lucide-react"
import ConnectionStatus from "@/components/connection-status"
import AdminLogin from "@/components/admin-login"

interface VoucherStats {
  prize_amount: number
  total_codes: number
  total_max_uses: number
  total_current_uses: number
  remaining_uses: number
}

interface VoucherHistory {
  date: string
  voucher_code: string
  prize_amount: number
  times_distributed: number
}

interface Voucher {
  id: number
  code: string
  prize_amount: number
  max_uses: number
  current_uses: number
  created_at: Date
}

export default function AdminPage() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [creditsToAdd, setCreditsToAdd] = useState("")
  const [addingCredits, setAddingCredits] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [voucherStats, setVoucherStats] = useState<VoucherStats[]>([])
  const [voucherHistory, setVoucherHistory] = useState<VoucherHistory[]>([])
  const [voucherLoading, setVoucherLoading] = useState(false)

  // Voucher CRUD states
  const [showVoucherDialog, setShowVoucherDialog] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null)
  const [voucherForm, setVoucherForm] = useState({
    code: "",
    prizeAmount: 0,
    maxUses: 0,
    currentUses: 0,
  })
  const [voucherFormLoading, setVoucherFormLoading] = useState(false)
  const [voucherFormError, setVoucherFormError] = useState<string | null>(null)

  useEffect(() => {
    initializeSystem()
  }, [])

  const initializeSystem = async () => {
    try {
      // Initialize both database and auth system
      await Promise.all([initializeDatabase(), initializeAuth()])

      // Then check auth status
      await checkAuthStatus()
    } catch (error) {
      console.error("System initialization failed:", error)
    } finally {
      setInitializing(false)
    }
  }

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.admin) {
          setAdmin(data.admin)
          loadUsers()
          loadVoucherData()
        }
      } else {
        setAdmin(null)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      setAdmin(null)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (username: string, password: string) => {
    setLoginLoading(true)
    setLoginError(null)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setLoginError(data.error || "Login failed")
        return
      }

      setAdmin(data.admin)
      loadUsers()
      // Load voucher data when admin logs in
      loadVoucherData()
    } catch (error) {
      console.error("Login error:", error)
      setLoginError("An error occurred during login. Please try again.")
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setAdmin(null)
      setUsers([])
      setVouchers([])
      setVoucherStats([])
      setVoucherHistory([])
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const isConnected = await checkDatabaseConnection()
      if (!isConnected) {
        throw new Error("Unable to connect to the database.")
      }

      const userData = await getAllUsers()
      setUsers(userData)
    } catch (error: any) {
      console.error("Error loading users:", error)
      alert("Error loading users: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadVoucherData = async () => {
    setVoucherLoading(true)
    try {
      // Load voucher stats
      const statsResponse = await fetch("/api/admin/vouchers?type=stats")
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setVoucherStats(statsData.stats)
      }

      // Load voucher history
      const historyResponse = await fetch("/api/admin/vouchers?type=history")
      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        setVoucherHistory(historyData.history)
      }

      // Load all vouchers
      const vouchersResponse = await fetch("/api/admin/vouchers")
      if (vouchersResponse.ok) {
        const vouchersData = await vouchersResponse.json()
        setVouchers(vouchersData.vouchers)
      }
    } catch (error) {
      console.error("Error loading voucher data:", error)
    } finally {
      setVoucherLoading(false)
    }
  }

  const openAddCreditsDialog = (user: User) => {
    setSelectedUser(user)
    setCreditsToAdd("")
    setDialogOpen(true)
  }

  const closeAddCreditsDialog = () => {
    setDialogOpen(false)
    setSelectedUser(null)
    setCreditsToAdd("")
  }

  const handleAddCredits = async () => {
    if (!selectedUser || !creditsToAdd) return

    setAddingCredits(true)
    try {
      const credits = Number.parseInt(creditsToAdd)
      if (credits <= 0 || isNaN(credits)) {
        alert("Please enter a valid number of credits")
        return
      }

      const response = await fetch("/api/admin/add-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: selectedUser.email,
          credits,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          setAdmin(null)
          alert("Session expired. Please log in again.")
          return
        }
        throw new Error(data.error || "Failed to add credits")
      }

      // Update the user in the local state
      setUsers(users.map((user) => (user.email === selectedUser.email ? data.user : user)))

      closeAddCreditsDialog()
      alert(`Successfully added ${credits} credits to ${data.user.name}!`)
    } catch (error: any) {
      console.error("Error adding credits:", error)
      alert("Error adding credits: " + error.message)
    } finally {
      setAddingCredits(false)
    }
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return "Never"
    return new Date(date).toLocaleDateString()
  }

  const getUsagePercentage = (current: number, max: number) => {
    return max > 0 ? Math.round((current / max) * 100) : 0
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500"
    if (percentage >= 70) return "bg-yellow-500"
    return "bg-green-500"
  }

  // Voucher CRUD Functions
  const openVoucherDialog = (voucher?: Voucher) => {
    if (voucher) {
      setEditingVoucher(voucher)
      setVoucherForm({
        code: voucher.code,
        prizeAmount: voucher.prize_amount,
        maxUses: voucher.max_uses,
        currentUses: voucher.current_uses,
      })
    } else {
      setEditingVoucher(null)
      setVoucherForm({
        code: "",
        prizeAmount: 0,
        maxUses: 0,
        currentUses: 0,
      })
    }
    setVoucherFormError(null)
    setShowVoucherDialog(true)
  }

  const closeVoucherDialog = () => {
    setShowVoucherDialog(false)
    setEditingVoucher(null)
    setVoucherForm({
      code: "",
      prizeAmount: 0,
      maxUses: 0,
      currentUses: 0,
    })
    setVoucherFormError(null)
  }

  const handleVoucherSubmit = async () => {
    setVoucherFormLoading(true)
    setVoucherFormError(null)

    try {
      if (editingVoucher) {
        // Update existing voucher
        const response = await fetch("/api/admin/vouchers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingVoucher.id,
            code: voucherForm.code,
            prizeAmount: voucherForm.prizeAmount,
            maxUses: voucherForm.maxUses,
            currentUses: voucherForm.currentUses,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to update voucher")
        }

        // Update local state
        setVouchers(vouchers.map(v => v.id === editingVoucher.id ? data.voucher : v))
        closeVoucherDialog()
        alert("Voucher updated successfully!")
      } else {
        // Create new voucher
        const response = await fetch("/api/admin/vouchers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: voucherForm.code,
            prizeAmount: voucherForm.prizeAmount,
            maxUses: voucherForm.maxUses,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to create voucher")
        }

        // Update local state
        setVouchers([...vouchers, data.voucher])
        closeVoucherDialog()
        alert("Voucher created successfully!")
      }

      // Reload voucher data to update stats
      loadVoucherData()
    } catch (error: any) {
      console.error("Voucher operation error:", error)
      setVoucherFormError(error.message)
    } finally {
      setVoucherFormLoading(false)
    }
  }

  const handleDeleteVoucher = async (voucher: Voucher) => {
    if (!confirm(`Are you sure you want to delete voucher "${voucher.code}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/vouchers?id=${voucher.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete voucher")
      }

      // Update local state
      setVouchers(vouchers.filter(v => v.id !== voucher.id))
      alert("Voucher deleted successfully!")

      // Reload voucher data to update stats
      loadVoucherData()
    } catch (error: any) {
      console.error("Delete voucher error:", error)
      alert("Error deleting voucher: " + error.message)
    }
  }

  const handleResetVoucherUsage = async (voucher: Voucher) => {
    if (!confirm(`Are you sure you want to reset the usage count for voucher "${voucher.code}"?`)) {
      return
    }

    try {
      const response = await fetch("/api/admin/vouchers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: voucher.id,
          action: "reset",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset voucher usage")
      }

      // Update local state
      setVouchers(vouchers.map(v => v.id === voucher.id ? data.voucher : v))
      alert("Voucher usage reset successfully!")

      // Reload voucher data to update stats
      loadVoucherData()
    } catch (error: any) {
      console.error("Reset voucher usage error:", error)
      alert("Error resetting voucher usage: " + error.message)
    }
  }

  const generateVoucherCode = () => {
    const prefix = "UMSPIN"
    const randomNumber = Math.floor(Math.random() * 90000) + 10000
    return `${prefix}${randomNumber}`
  }

  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto text-center">
          <CardContent className="p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing system...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading && !admin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto text-center">
          <CardContent className="p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking authentication...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!admin) {
    return <AdminLogin onLogin={handleLogin} loading={loginLoading} error={loginError} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Secure Session
            </Badge>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{admin.username}</div>
              <p className="text-xs text-gray-500">Last login: {formatDate(admin.last_login)}</p>
            </div>

            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600 bg-transparent"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <ConnectionStatus />

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>User Management</span>
            </TabsTrigger>
            <TabsTrigger value="vouchers" className="flex items-center space-x-2">
              <Ticket className="h-4 w-4" />
              <span>Voucher System</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-600" />
                <h2 className="text-2xl font-bold">User Management</h2>
              </div>
              <Button onClick={loadUsers} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{users.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Total Spins</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{users.reduce((sum, user) => sum + user.total_spins, 0)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{users.filter((user) => user.credits > 0).length}</div>
                </CardContent>
              </Card>
            </div>

            {/* User Management Table */}
            <Card>
              <CardHeader>
                <CardTitle>Users Management</CardTitle>
                <CardDescription>Manage user credits and view statistics</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading users...</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No users found. Users will appear here after they play the fortune wheel.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Total Spins</TableHead>
                        <TableHead>Last Played</TableHead>
                        <TableHead>Latest Prizes</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.email}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.credits > 0 ? "default" : "secondary"}>{user.credits}</Badge>
                          </TableCell>
                          <TableCell>{user.total_spins}</TableCell>
                          <TableCell>{formatDate(user.last_played)}</TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-xs bg-transparent">
                                  ({user.prizes.length}) show Prizes
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Prizes {user.name}</DialogTitle>
                                  <DialogDescription>list of Prizes</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-2 max-h-60 overflow-y-auto text-sm">
                                  {user.prizes.length > 0 ? (
                                    user.prizes.map((prize, index) => (
                                      <div key={index} className="border-b pb-1">
                                        🎁 {prize}
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-gray-500">لا توجد جوائز حتى الآن.</p>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" onClick={() => openAddCreditsDialog(user)}>
                              <Plus className="h-4 w-4 mr-1" />
                              Add Credits
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vouchers" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Ticket className="h-8 w-8 text-blue-600" />
                <h2 className="text-2xl font-bold">Voucher System</h2>
              </div>
              <div className="flex items-center space-x-2">
                <Button onClick={() => openVoucherDialog()} className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Voucher
                </Button>
                <Button onClick={loadVoucherData} disabled={voucherLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${voucherLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Voucher Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {voucherStats.map((stat) => (
                <Card key={stat.prize_amount}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">${stat.prize_amount} Vouchers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-2xl font-bold text-green-600">{stat.remaining_uses}</div>
                    <p className="text-xs text-gray-500">Remaining Uses</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getStatusColor(getUsagePercentage(stat.total_current_uses, stat.total_max_uses))}`}
                        style={{
                          width: `${getUsagePercentage(stat.total_current_uses, stat.total_max_uses)}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {stat.total_current_uses}/{stat.total_max_uses} used (
                      {getUsagePercentage(stat.total_current_uses, stat.total_max_uses)}%)
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Voucher Details Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Voucher Details</span>
                </CardTitle>
                <CardDescription>Complete list of all voucher codes and their usage</CardDescription>
              </CardHeader>
              <CardContent>
                {voucherLoading ? (
                  <div className="text-center py-8">Loading vouchers...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Prize Amount</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vouchers.map((voucher) => {
                        const usagePercentage = getUsagePercentage(voucher.current_uses, voucher.max_uses)
                        return (
                          <TableRow key={voucher.id}>
                            <TableCell className="font-mono">{voucher.code}</TableCell>
                            <TableCell>
                              <Badge variant="outline">${voucher.prize_amount}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">
                                  {voucher.current_uses}/{voucher.max_uses}
                                </span>
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${getStatusColor(usagePercentage)}`}
                                    style={{ width: `${usagePercentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  usagePercentage >= 100
                                    ? "destructive"
                                    : usagePercentage >= 90
                                      ? "secondary"
                                      : "default"
                                }
                              >
                                {usagePercentage >= 100 ? "Exhausted" : usagePercentage >= 90 ? "Low" : "Available"}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(voucher.created_at)}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openVoucherDialog(voucher)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleResetVoucherUsage(voucher)}
                                  className="h-8 w-8 p-0"
                                  title="Reset Usage"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteVoucher(voucher)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Recent Voucher Distribution History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="h-5 w-5" />
                  <span>Recent Distribution History</span>
                </CardTitle>
                <CardDescription>Latest voucher codes distributed to users</CardDescription>
              </CardHeader>
              <CardContent>
                {voucherLoading ? (
                  <div className="text-center py-8">Loading history...</div>
                ) : voucherHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No voucher distribution history found.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Voucher Code</TableHead>
                        <TableHead>Prize Amount</TableHead>
                        <TableHead>Times Distributed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {voucherHistory.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-mono">{entry.voucher_code}</TableCell>
                          <TableCell>
                            <Badge variant="outline">${entry.prize_amount}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge>{entry.times_distributed}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Credits Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Credits</DialogTitle>
              <DialogDescription>
                Add credits for {selectedUser?.name} ({selectedUser?.email})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="credits">Number of Credits</Label>
                <Input
                  id="credits"
                  type="number"
                  min="1"
                  placeholder="Enter credits to add"
                  value={creditsToAdd}
                  onChange={(e) => setCreditsToAdd(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddCredits()
                    }
                  }}
                />
              </div>
              {selectedUser && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Current Credits: <strong>{selectedUser.credits}</strong>
                  </p>
                  {creditsToAdd && !isNaN(Number.parseInt(creditsToAdd)) && (
                    <p className="text-sm text-green-600">
                      New Balance: <strong>{selectedUser.credits + Number.parseInt(creditsToAdd || "0")}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeAddCreditsDialog} disabled={addingCredits}>
                Cancel
              </Button>
              <Button onClick={handleAddCredits} disabled={addingCredits || !creditsToAdd}>
                {addingCredits ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Adding...
                  </div>
                ) : (
                  "Add Credits"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Voucher CRUD Dialog */}
        <Dialog open={showVoucherDialog} onOpenChange={setShowVoucherDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingVoucher ? "Edit Voucher" : "Add New Voucher"}
              </DialogTitle>
              <DialogDescription>
                {editingVoucher 
                  ? "Update voucher details and usage statistics" 
                  : "Create a new voucher code for the fortune wheel"
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {voucherFormError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{voucherFormError}</p>
                </div>
              )}

              <div>
                <Label htmlFor="voucher-code">Voucher Code</Label>
                <div className="flex space-x-2">
                  <Input
                    id="voucher-code"
                    value={voucherForm.code}
                    onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value })}
                    placeholder="UMSPIN12345"
                    className="flex-1"
                  />
                  {!editingVoucher && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setVoucherForm({ ...voucherForm, code: generateVoucherCode() })}
                      className="px-3"
                    >
                      Generate
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="prize-amount">Prize Amount ($)</Label>
                <Select
                  value={voucherForm.prizeAmount.toString()}
                  onValueChange={(value) => setVoucherForm({ ...voucherForm, prizeAmount: Number.parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select amount" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">$10</SelectItem>
                    <SelectItem value="20">$20</SelectItem>
                    <SelectItem value="30">$30</SelectItem>
                    <SelectItem value="40">$40</SelectItem>
                    <SelectItem value="50">$50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="max-uses">Maximum Uses</Label>
                <Input
                  id="max-uses"
                  type="number"
                  min="1"
                  value={voucherForm.maxUses}
                  onChange={(e) => setVoucherForm({ ...voucherForm, maxUses: Number.parseInt(e.target.value) || 0 })}
                  placeholder="100"
                />
              </div>

              {editingVoucher && (
                <div>
                  <Label htmlFor="current-uses">Current Uses</Label>
                  <Input
                    id="current-uses"
                    type="number"
                    min="0"
                    max={voucherForm.maxUses}
                    value={voucherForm.currentUses}
                    onChange={(e) => setVoucherForm({ ...voucherForm, currentUses: Number.parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current usage count. Cannot exceed maximum uses.
                  </p>
                </div>
              )}

              {editingVoucher && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm space-y-1">
                    <p><strong>Usage:</strong> {voucherForm.currentUses}/{voucherForm.maxUses}</p>
                    <p><strong>Remaining:</strong> {voucherForm.maxUses - voucherForm.currentUses}</p>
                    <p><strong>Status:</strong> {
                      voucherForm.currentUses >= voucherForm.maxUses ? "Exhausted" :
                      voucherForm.currentUses >= voucherForm.maxUses * 0.9 ? "Low" : "Available"
                    }</p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeVoucherDialog} disabled={voucherFormLoading}>
                Cancel
              </Button>
              <Button 
                onClick={handleVoucherSubmit} 
                disabled={voucherFormLoading || !voucherForm.code || !voucherForm.prizeAmount || !voucherForm.maxUses}
              >
                {voucherFormLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    {editingVoucher ? "Updating..." : "Creating..."}
                  </div>
                ) : (
                  editingVoucher ? "Update Voucher" : "Create Voucher"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
