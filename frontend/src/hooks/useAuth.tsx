import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { AuthResponse } from '@/types'

interface AuthContextType {
  auth: AuthResponse | null
  login: (auth: AuthResponse) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthResponse | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedAuth = localStorage.getItem('auth')
    if (token && storedAuth) {
      try {
        setAuth(JSON.parse(storedAuth))
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('auth')
      }
    }
  }, [])

  const login = (authData: AuthResponse) => {
    localStorage.setItem('token', authData.token)
    localStorage.setItem('auth', JSON.stringify(authData))
    setAuth(authData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('auth')
    setAuth(null)
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout, isAuthenticated: !!auth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}