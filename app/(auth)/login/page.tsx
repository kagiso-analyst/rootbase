'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Leaf } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      window.location.href = '/dashboard'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-[#1B4332] rounded-lg flex items-center justify-center">
              <Leaf size={16} className="text-[#52B788]" />
            </div>
            <span className="text-xl font-bold text-[#1B4332]">RootBase</span>
          </Link>
        </div>

        <Card className="shadow-sm border border-gray-200">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold text-[#1B4332]">Welcome back</CardTitle>
            <CardDescription>Sign in to your farm account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@farm.com"
                value={email}
                onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button
              className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <p className="text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link href="/register" className="text-[#2D6A4F] font-medium hover:underline">
                Register free
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link href="/" className="hover:text-[#2D6A4F]">← Back to RootBase</Link>
        </p>
      </div>
    </div>
  )
}