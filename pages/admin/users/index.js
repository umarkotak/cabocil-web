import cabocilAPI from "@/apis/cabocil_api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUserIds, setSelectedUserIds] = useState([])

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await cabocilAPI.GetUsers("", {}, {})
      if (response.status === 200) {
        const body = await response.json()
        if (body.success && body.data) {
          setUsers(body.data)
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedUserIds(users.map((user) => user.id))
    } else {
      setSelectedUserIds([])
    }
  }

  const handleSelectOne = (userId, checked) => {
    if (checked) {
      setSelectedUserIds((prev) => [...prev, userId])
    } else {
      setSelectedUserIds((prev) => prev.filter((id) => id !== userId))
    }
  }

  const handleLogSelected = () => {
    console.log("Selected User IDs:", selectedUserIds)
  }

  const formatDate = (dateString) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isAllSelected = users.length > 0 && selectedUserIds.length === users.length

  return (
    <div className="flex flex-col gap-4 p-4 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Users</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground mr-2">{selectedUserIds.length} selected</span>
          <Button size="sm" onClick={handleLogSelected} disabled={selectedUserIds.length === 0}>
            Log Selected IDs
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-[50px]">ID</TableHead>
              <TableHead className="w-[200px]">Created At</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} data-state={selectedUserIds.includes(user.id) && "selected"}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUserIds.includes(user.id)}
                      onCheckedChange={(checked) => handleSelectOne(user.id, checked)}
                      aria-label={`Select user ${user.id}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.photo_url && (
                        <Avatar>
                          <AvatarImage src={user.photo_url} alt={user.username} />
                          <AvatarFallback className=""><img src="/icons/cabocil-logo-clear.png" /></AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium leading-none">{user.name}</span>
                        <span className="text-xs text-muted-foreground">@{user.username}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                      {user.user_role}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}