"use client"

import { fetchClient } from "@/lib/fetch"
import {
  CrownIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  TrashIcon,
  UserCircleIcon,
  XIcon,
  WarningIcon,
} from "@phosphor-icons/react"
import { useCallback, useEffect, useState } from "react"

type User = {
  id: string
  email: string
  anonymous: boolean
  premium: boolean
  display_name: string | null
  message_count: number
  daily_message_count: number
  daily_pro_message_count: number
  favorite_models: string[] | null
  created_at: string
  last_active_at: string
}

type UserDetail = {
  user: User & {
    daily_reset: string | null
    daily_pro_reset: string | null
    profile_image: string | null
    system_prompt: string | null
  }
  chatCount: number
  modelUsage: { model: string; count: number }[]
  recentMessages: {
    id: number
    role: string
    content: string
    model: string | null
    created_at: string
  }[]
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "authenticated", label: "Registered" },
  { key: "anonymous", label: "Guests" },
  { key: "premium", label: "Premium" },
]

function formatDate(dateStr: string): string {
  if (!dateStr) return "Never"
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editPremium, setEditPremium] = useState(false)
  const [editMsgCount, setEditMsgCount] = useState("")
  const [editDailyCount, setEditDailyCount] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        search,
        filter,
      })
      const res = await fetchClient(`/api/admin/users?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load users")
      setUsers(data.users || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users")
    } finally {
      setLoading(false)
    }
  }, [page, search, filter])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const viewUser = async (userId: string) => {
    setDetailLoading(true)
    setSelectedUser(null)
    setError("")
    try {
      const res = await fetchClient(`/api/admin/users/${userId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load user")
      setSelectedUser(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user details")
    } finally {
      setDetailLoading(false)
    }
  }

  const openEdit = (user: User) => {
    setEditingUser(user)
    setEditPremium(user.premium)
    setEditMsgCount(user.message_count.toString())
    setEditDailyCount(user.daily_message_count.toString())
  }

  const saveEdit = async () => {
    if (!editingUser) return
    setSaving(true)
    setError("")
    try {
      const res = await fetchClient(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          premium: editPremium,
          message_count: parseInt(editMsgCount) || 0,
          daily_message_count: parseInt(editDailyCount) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save")
      setEditingUser(null)
      loadUsers()
      if (selectedUser?.user.id === editingUser.id) {
        viewUser(editingUser.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  const deleteUser = async (userId: string) => {
    setDeleting(true)
    try {
      const res = await fetchClient(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete")
      setDeleteConfirm(null)
      setSelectedUser(null)
      loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user")
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage {total} users
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 border-red-500/30 bg-red-500/5 rounded-lg border p-3">
          <WarningIcon className="h-4 w-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-500">{error}</p>
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-500">
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <MagnifyingGlassIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring block h-10 w-full rounded-md border pl-9 pr-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setPage(1) }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Users List - Cards on mobile, table on desktop */}
        <div className={`w-full ${selectedUser ? "hidden lg:block lg:w-1/2" : "w-full"} overflow-hidden`}>
          {loading ? (
            <div className="flex py-12 justify-center">
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground text-sm">No users found</p>
            </div>
          ) : (
            <>
              {/* Mobile: Card layout */}
              <div className="space-y-2 lg:hidden">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={`border-border bg-card rounded-xl border p-3 transition-colors ${
                      selectedUser?.user.id === user.id ? "ring-primary/30 ring-1" : ""
                    }`}
                    onClick={() => viewUser(user.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent">
                        {user.anonymous ? (
                          <EyeIcon className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <UserCircleIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">
                            {user.anonymous ? "Guest User" : user.display_name || user.email}
                          </p>
                          {user.premium && <CrownIcon className="h-3.5 w-3.5 text-yellow-500 shrink-0" />}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {user.message_count} messages &middot; {user.daily_message_count}/day
                          {user.email && !user.anonymous && (
                            <span className="ml-1 truncate block sm:inline"> &middot; {user.email}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(user) }}
                          className="text-muted-foreground hover:text-foreground rounded p-1.5 transition-colors"
                          title="Edit"
                        >
                          <PencilSimpleIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(user.id) }}
                          className="text-muted-foreground hover:text-red-500 rounded p-1.5 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-xs mt-1.5 pl-12">
                      Joined {formatDate(user.created_at)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Desktop: Table layout */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-border border-b text-left">
                      <th className="px-4 py-3 font-medium text-muted-foreground">User</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Messages</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Daily</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Joined</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className={`border-border border-b cursor-pointer transition-colors hover:bg-accent/50 ${
                          selectedUser?.user.id === user.id ? "bg-accent" : ""
                        }`}
                        onClick={() => viewUser(user.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {user.anonymous ? (
                              <EyeIcon className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <UserCircleIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div className="min-w-0">
                              <p className="truncate max-w-48 font-medium">
                                {user.anonymous ? "Guest User" : user.display_name || user.email}
                              </p>
                              {!user.anonymous && (
                                <p className="text-muted-foreground truncate max-w-48 text-xs">
                                  {user.email}
                                </p>
                              )}
                            </div>
                            {user.premium && (
                              <CrownIcon className="h-3.5 w-3.5 text-yellow-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {user.message_count}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {user.daily_message_count}
                          <span className="text-muted-foreground"> / {user.daily_pro_message_count} pro</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); openEdit(user) }}
                              className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
                              title="Edit"
                            >
                              <PencilSimpleIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirm(user.id) }}
                              className="text-muted-foreground hover:text-red-500 rounded p-1 transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-border flex items-center justify-between border-t px-4 py-3">
              <p className="text-muted-foreground text-xs">
                Page {page} of {totalPages} ({total} users)
              </p>
              <div className="flex gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="disabled:opacity-30 hover:bg-accent rounded px-3 py-1.5 text-xs"
                >
                  Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="disabled:opacity-30 hover:bg-accent rounded px-3 py-1.5 text-xs"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Detail Panel */}
        {(selectedUser || detailLoading) && (
          <div className="border-border bg-card rounded-xl border w-full lg:w-1/2 overflow-hidden">
            {detailLoading ? (
              <div className="flex py-12 justify-center">
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              </div>
            ) : selectedUser ? (
              <div className="p-4 sm:p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">User Details</h3>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-muted-foreground hover:text-foreground p-1"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* User Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent">
                      {selectedUser.user.anonymous ? (
                        <EyeIcon className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <UserCircleIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {selectedUser.user.anonymous
                          ? "Guest User"
                          : selectedUser.user.display_name || "No name"}
                      </p>
                      <p className="text-muted-foreground text-xs truncate">
                        {selectedUser.user.email}
                      </p>
                    </div>
                    {selectedUser.user.premium && (
                      <span className="bg-yellow-500/10 text-yellow-600 rounded-full px-2 py-0.5 text-xs font-medium shrink-0">
                        PREMIUM
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="bg-accent/50 rounded-lg p-3">
                      <p className="text-muted-foreground text-xs">Total Messages</p>
                      <p className="text-lg font-bold">{selectedUser.user.message_count}</p>
                    </div>
                    <div className="bg-accent/50 rounded-lg p-3">
                      <p className="text-muted-foreground text-xs">Total Chats</p>
                      <p className="text-lg font-bold">{selectedUser.chatCount}</p>
                    </div>
                    <div className="bg-accent/50 rounded-lg p-3">
                      <p className="text-muted-foreground text-xs">Daily Messages</p>
                      <p className="text-lg font-bold">{selectedUser.user.daily_message_count}</p>
                    </div>
                    <div className="bg-accent/50 rounded-lg p-3">
                      <p className="text-muted-foreground text-xs">Pro Messages</p>
                      <p className="text-lg font-bold">{selectedUser.user.daily_pro_message_count}</p>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="break-all">ID: <span className="font-mono">{selectedUser.user.id}</span></p>
                    <p>Joined: {formatDate(selectedUser.user.created_at)}</p>
                    <p>Last Active: {formatDate(selectedUser.user.last_active_at)}</p>
                  </div>
                </div>

                {/* Model Usage */}
                {selectedUser.modelUsage.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Model Usage</h4>
                    <div className="space-y-2">
                      {selectedUser.modelUsage.map((m) => (
                        <div key={m.model} className="flex items-center justify-between text-xs">
                          <span className="font-mono text-muted-foreground truncate max-w-[200px]">
                            {m.model}
                          </span>
                          <span className="font-medium">{m.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Messages */}
                {selectedUser.recentMessages.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Recent Messages</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedUser.recentMessages.map((msg) => (
                        <div key={msg.id} className="bg-accent/30 rounded-lg p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium capitalize">{msg.role}</span>
                            <span className="text-muted-foreground text-xs">
                              {formatDate(msg.created_at)}
                            </span>
                          </div>
                          <p className="text-xs line-clamp-2">{msg.content}</p>
                          {msg.model && (
                            <p className="text-muted-foreground font-mono text-xs">{msg.model}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(selectedUser.user)}
                    className="flex-1 bg-accent hover:bg-accent/80 rounded-lg py-2.5 text-sm font-medium transition-colors"
                  >
                    Edit User
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(selectedUser.user.id)}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <div className="bg-background w-full sm:max-w-md rounded-t-2xl sm:rounded-xl border p-5 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Edit User</h3>
              <button onClick={() => setEditingUser(null)} className="text-muted-foreground hover:text-foreground p-1">
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">
                  {editingUser.anonymous ? "Guest" : editingUser.email}
                </p>
                <p className="text-muted-foreground text-xs font-mono break-all">{editingUser.id}</p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editPremium}
                  onChange={(e) => setEditPremium(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm">Premium User</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground text-xs">Total Messages</label>
                  <input
                    type="number"
                    value={editMsgCount}
                    onChange={(e) => setEditMsgCount(e.target.value)}
                    className="border-input bg-background mt-1 block h-10 w-full rounded-md border px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">Daily Messages</label>
                  <input
                    type="number"
                    value={editDailyCount}
                    onChange={(e) => setEditDailyCount(e.target.value)}
                    className="border-input bg-background mt-1 block h-10 w-full rounded-md border px-3 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditingUser(null)}
                className="bg-accent hover:bg-accent/80 rounded-lg px-4 py-2.5 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <div className="bg-background w-full sm:max-w-sm rounded-t-2xl sm:rounded-xl border p-5 sm:p-6 space-y-4">
            <h3 className="font-semibold text-red-500">Delete User?</h3>
            <p className="text-sm text-muted-foreground">
              This will permanently delete the user, all their chats, messages, and API keys. This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="bg-accent hover:bg-accent/80 rounded-lg px-4 py-2.5 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteUser(deleteConfirm)}
                disabled={deleting}
                className="bg-red-500 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}