// lib/auth-guard.tsx

'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AuthGuardOptions = {
  redirectTo?: string
  loadingComponent?: ReactNode
}

export function useAuthGuard(options: AuthGuardOptions = {}) {
  const { redirectTo = '/login' } = options
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error('Auth error:', error.message)
          router.replace(redirectTo)
          return
        }

        if (!user) {
          router.replace(redirectTo)
          return
        }

        setIsAuthenticated(true)
      } catch (err) {
        console.error('Auth check error:', err)
        router.replace(redirectTo)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase, redirectTo])

  return { isLoading, isAuthenticated }
}

// ===== AUTH GUARD COMPONENT =====
export function AuthGuard({ 
  children, 
  fallback 
}: { 
  children: ReactNode
  fallback?: ReactNode 
}) {
  const { isLoading, isAuthenticated } = useAuthGuard()

  if (isLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}