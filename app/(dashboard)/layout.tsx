// app/(dashboard)/layout.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import { FarmProvider } from '@/lib/farm-context'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          console.error('Auth error:', authError)
          setError('Authentication error. Please try logging in again.')
          setTimeout(() => router.replace('/login'), 2000)
          return
        }
        
        if (!user) {
          router.replace('/login')
        } else {
          setChecking(false)
        }
      } catch (err) {
        console.error('Auth check error:', err)
        setError('Something went wrong. Please refresh the page.')
        setTimeout(() => router.replace('/login'), 2000)
      }
    }
    
    checkAuth()
  }, [router, supabase])

  // ===== LOADING STATE =====
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FAFB] to-[#D8F3DC]">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border-4 border-[#D8F3DC] border-t-[#2D6A4F] animate-spin"></div>
            </div>
            <div className="relative z-10 text-5xl mb-4 animate-bounce">🌱</div>
          </div>
          <h2 className="text-xl font-semibold text-[#1B4332] mt-4">RootBase</h2>
          <p className="text-sm text-gray-400 mt-1">Loading your farm dashboard...</p>
          <div className="mt-4 flex justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse" style={{ animationDelay: '300ms' }}></span>
            <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse" style={{ animationDelay: '600ms' }}></span>
          </div>
        </div>
      </div>
    )
  }

  // ===== ERROR STATE =====
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <p className="text-xs text-gray-400">Redirecting to login...</p>
          <div className="mt-4 flex justify-center">
            <Loader2 size={24} className="animate-spin text-[#2D6A4F]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <FarmProvider>
      <div className="flex min-h-screen w-full overflow-hidden bg-[#F9FAFB]">
        <Sidebar />
        <div className="flex-1 flex min-h-screen flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-5 md:px-6 md:py-6">
            {children}
          </main>
        </div>
      </div>
    </FarmProvider>
  )
}