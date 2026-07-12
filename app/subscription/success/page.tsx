// app/subscription/success/page.tsx

'use client'

import Link from 'next/link'
import { CheckCircle, Sparkles, ArrowRight, Mail } from 'lucide-react' // 👈 ADD Sparkles, ArrowRight, Mail
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useEffect, useState } from 'react' // 👈 ADD THIS
import { useRouter } from 'next/navigation' // 👈 ADD THIS

export default function SuccessPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] to-[#D8F3DC]/30 flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-xl border-0 overflow-hidden relative">
        {/* Decorative top bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#52B788] to-[#2D6A4F]"></div>
        
        {/* Animated confetti effect */}
        <div className="absolute top-0 right-0 opacity-10">
          <div className="text-6xl">✨</div>
        </div>
        
        <CardContent className="pt-12 pb-10 px-8 relative">
          {/* Icon with pulse animation */}
          <div className="w-20 h-20 bg-[#D8F3DC] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#D8F3DC]/50 animate-pulse">
            <CheckCircle size={40} className="text-[#2D6A4F]" />
          </div>
          
          <h1 className="text-2xl font-bold text-[#1B4332] mb-2 flex items-center justify-center gap-2">
            Payment Successful!
            <Sparkles size={20} className="text-yellow-400" />
          </h1>
          
          <p className="text-gray-500 text-sm mb-1">
            Welcome to RootBase! Your subscription is now active.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            Your farm data is safe and your account has been upgraded.
          </p>

          {/* Quick stats or next steps */}
          <div className="bg-[#D8F3DC]/30 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs font-semibold text-[#1B4332] mb-2">What's next?</p>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]"></div>
                Access all premium features immediately
              </li>
              <li className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]"></div>
                Unlimited crops, fields, and financial reports
              </li>
              <li className="flex items-center gap-2 text-xs text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F]"></div>
                Priority support from the RootBase team
              </li>
            </ul>
          </div>

          {/* Buttons */}
          <Link href="/dashboard">
            <Button className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white shadow-sm hover:shadow-md transition-all group">
              Go to Dashboard
              <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          {/* Email confirmation */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <Mail size={14} className="text-gray-400" />
            <p className="text-xs text-gray-400">
              Confirmation email sent to your inbox
            </p>
          </div>

          {/* Auto-redirect countdown */}
          <p className="text-xs text-gray-400 mt-4">
            Redirecting to dashboard in {countdown} seconds...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}