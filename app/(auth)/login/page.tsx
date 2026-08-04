// app/(auth)/login/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Logo } from '@/components/ui/Logo'
import { getSeasonalGreeting } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [greeting, setGreeting] = useState('Welcome back, Farmer')
  const [greetingEmoji, setGreetingEmoji] = useState('🌱')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const seasonal = getSeasonalGreeting('Farmer')
    setGreeting(seasonal.greeting)
    setGreetingEmoji(seasonal.emoji)
  }, [])

  async function handleLogin() {
    setLoading(true)
    setError('')
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      })
      
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FAFB] to-[#D8F3DC]/30 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Logo size="lg" />
          </Link>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>{greetingEmoji}</span>
            <span>{greeting}</span>
          </div>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 bg-[#D8F3DC] rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles size={20} className="text-[#2D6A4F]" />
            </div>
            <CardTitle className="text-2xl font-bold text-[#1B4332]">Welcome back</CardTitle>
            <CardDescription>Sign in to your farm account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-start gap-2">
                <span className="text-red-400">⚠️</span>
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@farm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-[#2D6A4F] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
              />
            </div>
            <Button
              className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white shadow-sm hover:shadow-md transition-all"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <><span className="animate-spin mr-2">⏳</span> Signing in...</>
              ) : (
                'Sign In'
              )}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-gray-400">New to RootBase?</span>
              </div>
            </div>
            <Link href="/register">
              <Button
                variant="outline"
                className="w-full border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC] hover:border-[#1B4332] transition-all"
              >
                Create free account
              </Button>
            </Link>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link href="/" className="hover:text-[#2D6A4F] transition-colors">
            ← Back to RootBase
          </Link>
        </p>

        <div className="mt-4 text-center text-xs uppercase tracking-[0.3em] text-gray-400">
          Secure farm management
        </div>
      </div>
    </div>
  )
}