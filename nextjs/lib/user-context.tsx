"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { api } from "@/lib/api"

export type User = {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  created_at: string
}

interface UserContextValue {
  user: User | null
  loading: boolean
}

// Module-level cache — survives component remounts (navigation, StrictMode)
let _cachedUser: User | null = null
let _fetchPromise: Promise<User | null> | null = null

function fetchUser(): Promise<User | null> {
  if (_fetchPromise) return _fetchPromise
  _fetchPromise = api
    .get<User>("/user")
    .then((res) => {
      _cachedUser = res.data ?? null
      return _cachedUser
    })
    .catch(() => {
      _cachedUser = null
      _fetchPromise = null // allow retry on error
      return null
    })
  return _fetchPromise
}

export function clearUserCache() {
  _cachedUser = null
  _fetchPromise = null
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(_cachedUser)
  const [loading, setLoading] = useState(_cachedUser === null)

  useEffect(() => {
    if (_cachedUser !== null) {
      setUser(_cachedUser)
      setLoading(false)
      return
    }
    fetchUser().then((u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error("useUser must be used inside <UserProvider>")
  return ctx
}
