'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getSession, signOut as authSignOut, isSessionValid } from '../lib/auth'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const session = getSession()
        if (session) {
          const valid = await isSessionValid()
          if (valid) {
            setUser(session)
          } else {
            authSignOut()
          }
        }
      } catch (err) {
        console.error('Session check failed:', err)
      } finally {
        setLoading(false)
      }
    }
    checkSession()
  }, [])

  const signOut = useCallback(() => {
    authSignOut()
    setUser(null)
  }, [])

  const setSession = useCallback((session) => {
    setUser(session)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signOut, setSession }}>
      {children}
    </AuthContext.Provider>
  )
}
