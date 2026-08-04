// app/(auth)/layout.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/Logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user ?? null

        if (user && (pathname === '/login' || pathname === '/register')) {
          if (isMounted) {
            router.replace('/dashboard')
          }
          return
        }

        if (isMounted) {
          setLoading(false)
        }
      } catch (err) {
        console.error('Auth check error:', err)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [pathname, router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FAFB] to-[#D8F3DC]/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-[#F9FAFB] to-[#D8F3DC]/30">
      <div className="absolute top-4 left-4 z-20 md:top-6 md:left-6">
        <Logo size="sm" />
      </div>
      
      <div className="relative z-10 flex min-h-screen items-center justify-center px-3 py-16 sm:px-4 sm:py-20 md:px-6">
        {children}
      </div>

      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#D8F3DC] rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#52B788] rounded-full opacity-10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#1B4332] rounded-full opacity-5 blur-3xl" />
      </div>

      <div className="absolute bottom-4 left-0 right-0 px-3 text-center">
        <p className="text-[10px] text-gray-400">
          © 2026 RootBase · Farm Management for African Farmers
        </p>
      </div>
    </div>
  )
}