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
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && (pathname === '/login' || pathname === '/register')) {
        router.replace('/dashboard')
        return
      }
      
      setLoading(false)
    }
    
    checkAuth()
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
    <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] to-[#D8F3DC]/30">
      <div className="absolute top-4 left-4 md:top-6 md:left-6">
        <Logo size="sm" />
      </div>
      
      <div className="relative z-10">
        {children}
      </div>

      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#D8F3DC] rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#52B788] rounded-full opacity-10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#1B4332] rounded-full opacity-5 blur-3xl" />
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-[10px] text-gray-400">
          © 2026 RootBase · Farm Management for African Farmers
        </p>
      </div>
    </div>
  )
}