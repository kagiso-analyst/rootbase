// app/subscription/cancel/page.tsx

'use client'

import Link from 'next/link'
import { XCircle, ArrowLeft, Home } from 'lucide-react' // 👈 ADD ArrowLeft, Home
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useEffect, useState } from 'react' // 👈 ADD THIS
import { useRouter } from 'next/navigation' // 👈 ADD THIS

export default function CancelPage() {
  const [countdown, setCountdown] = useState(5) // 👈 ADD THIS
  const router = useRouter()

  // 👇 Auto-redirect after 5 seconds
  useEffect(() => {
    if (countdown === 0) {
      router.push('/dashboard')
      return
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] to-[#D8F3DC]/20 flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-xl border-0 overflow-hidden">
        {/* Decorative top bar */}
        <div className="h-1.5 bg-gradient-to-r from-red-400 to-red-500"></div>
        
        <CardContent className="pt-12 pb-10 px-8">
          {/* Icon */}
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <XCircle size={40} className="text-red-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Payment Cancelled
          </h1>
          
          <p className="text-gray-500 text-sm mb-2">
            No payment was taken. Your free account remains active.
          </p>
          <p className="text-xs text-gray-400 mb-8">
            You can upgrade anytime from your settings.
          </p>

          {/* Buttons */}
          <div className="space-y-3">
            <Link href="/dashboard">
              <Button className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white shadow-sm hover:shadow-md transition-all">
                <Home size={16} className="mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            
            <Link href="/subscription">
              <Button variant="outline" className="w-full border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC] hover:border-[#1B4332] transition-all">
                <ArrowLeft size={16} className="mr-2" />
                Try Again
              </Button>
            </Link>
          </div>

          {/* Auto-redirect countdown */}
          <p className="text-xs text-gray-400 mt-6">
            Redirecting to dashboard in {countdown} seconds...
          </p>
          
          <p className="text-xs text-gray-400 mt-2">
            Need help? <Link href="/support" className="text-[#2D6A4F] hover:underline">Contact support</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}