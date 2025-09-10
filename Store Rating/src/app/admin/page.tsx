"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, Store, Star, Plus, LogOut, Search, Filter } from "lucide-react"
import { UserRole } from "@prisma/client"

interface User {
  id: string
  name: string
  email: string
  address: string
  role: UserRole
  createdAt: string
}

interface Store {
  id: string
  name: string
  email: string
  address: string
  createdAt: string
  averageRating?: number
}

interface DashboardStats {
  totalUsers: number
  totalStores: number
  totalRatings: number
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({ totalUsers: 0, totalStores: 0, totalRatings: 0 })
  const [users, setUsers] = useState<User[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState<UserRole | "ALL">("ALL")
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [showAddStoreDialog, setShowAddStoreDialog] = useState(false)

  // New user form state
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    address: "",
    password: "",
    role: UserRole.NORMAL_USER
  })

  // New store form state
  const [newStore, setNewStore] = useState({
    name: "",
    email: "",
    address: ""
  })

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user.role !== "SYSTEM_ADMIN") {
      router.push("/")
      return
    }

    fetchDashboardData()
  }, [session, status, router])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, usersRes, storesRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users"),
        fetch("/api/admin/stores")
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }

      if (storesRes.ok) {
        const storesData = await storesRes.json()
        setStores(storesData)
      }
    } catch (error) {
      setError("Failed to fetch dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      })

      if (response.ok) {
        setShowAddUserDialog(false)
        setNewUser({ name: "", email: "", address: "", password: "", role: UserRole.NORMAL_USER })
        fetchDashboardData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to add user")
      }
    } catch (error) {
      setError("Failed to add user")
    }
  }

  const handleAddStore = async () => {
    try {
      const response = await fetch("/api/admin/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStore)
      })

      if (response.ok) {
        setShowAddStoreDialog(false)
        setNewStore({ name: "", email: "", address: "" })
        fetchDashboardData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to add store")
      }
    } catch (error) {
      setError("Failed to add store")
    }
  }

  const handleSignOut = () => {
    router.push("/api/auth/signout")
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === "ALL" || user.role === filterRole
    return matchesSearch && matchesRole
  })

  const filteredStores = stores.filter(store => 
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {session?.user.name}</span>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStores}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ratings</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRatings}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterRole} onValueChange={(value) => setFilterRole(value as UserRole | "ALL")}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value={UserRole.SYSTEM_ADMIN}>System Admin</SelectItem>
              <SelectItem value={UserRole.NORMAL_USER}>Normal User</SelectItem>
              <SelectItem value={UserRole.STORE_OWNER}>Store Owner</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="stores">Stores</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      Create a new user account
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newUser.name}
                        onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                        placeholder="Enter user name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        placeholder="Enter email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={newUser.address}
                        onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                        placeholder="Enter address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        placeholder="Enter password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value as UserRole})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UserRole.NORMAL_USER}>Normal User</SelectItem>
                          <SelectItem value={UserRole.STORE_OWNER}>Store Owner</SelectItem>
                          <SelectItem value={UserRole.SYSTEM_ADMIN}>System Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddUser} className="w-full">Add User</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showAddStoreDialog} onOpenChange={setShowAddStoreDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Store
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Store</DialogTitle>
                    <DialogDescription>
                      Create a new store
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="storeName">Store Name</Label>
                      <Input
                        id="storeName"
                        value={newStore.name}
                        onChange={(e) => setNewStore({...newStore, name: e.target.value})}
                        placeholder="Enter store name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="storeEmail">Email</Label>
                      <Input
                        id="storeEmail"
                        type="email"
                        value={newStore.email}
                        onChange={(e) => setNewStore({...newStore, email: e.target.value})}
                        placeholder="Enter store email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="storeAddress">Address</Label>
                      <Input
                        id="storeAddress"
                        value={newStore.address}
                        onChange={(e) => setNewStore({...newStore, address: e.target.value})}
                        placeholder="Enter store address"
                      />
                    </div>
                    <Button onClick={handleAddStore} className="w-full">Add Store</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>Manage all users in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.address}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "SYSTEM_ADMIN" ? "destructive" : 
                                       user.role === "STORE_OWNER" ? "default" : "secondary"}>
                            {user.role.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stores">
            <Card>
              <CardHeader>
                <CardTitle>Stores</CardTitle>
                <CardDescription>Manage all stores in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStores.map((store) => (
                      <TableRow key={store.id}>
                        <TableCell className="font-medium">{store.name}</TableCell>
                        <TableCell>{store.email}</TableCell>
                        <TableCell>{store.address}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            {store.averageRating ? store.averageRating.toFixed(1) : "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(store.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}