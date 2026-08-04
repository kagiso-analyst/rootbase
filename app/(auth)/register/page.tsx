// app/(auth)/register/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/ui/Logo' // 👈 ADD THIS
import { getSeasonalGreeting } from '@/lib/utils' // 👈 ADD THIS
import { Sparkles, CheckCircle, AlertCircle } from 'lucide-react' // 👈 ADD THESE
import Link from 'next/link'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('') // 👈 ADD THIS
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0) // 👈 ADD THIS
  const [acceptedTerms, setAcceptedTerms] = useState(false) // 👈 ADD THIS
  const [greeting, setGreeting] = useState('Start your farming journey')
  const [greetingEmoji, setGreetingEmoji] = useState('🌱')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const seasonal = getSeasonalGreeting('Farmer')
    setGreeting(seasonal.greeting)
    setGreetingEmoji(seasonal.emoji)
  }, [])

  // Password strength checker
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0)
      return
    }
    let strength = 0
    if (password.length >= 8) strength += 1
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1
    if (/\d/.test(password)) strength += 1
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1
    setPasswordStrength(strength)
  }, [password])

  async function handleRegister() {
    // Validate
    if (!fullName.trim()) {
      setError('Please enter your full name')
      return
    }
    if (!email) {
      setError('Please enter your email address')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!acceptedTerms) {
      setError('Please accept the terms and conditions')
      return
    }

    setLoading(true)
    setError('')
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { 
          full_name: fullName,
          plan: 'free'
        } 
      }
    })
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  function getPasswordStrengthLabel() {
    if (passwordStrength === 0) return ''
    if (passwordStrength === 1) return 'Weak'
    if (passwordStrength === 2) return 'Fair'
    if (passwordStrength === 3) return 'Good'
    return 'Strong'
  }

  function getPasswordStrengthColor() {
    if (passwordStrength <= 1) return 'bg-red-400'
    if (passwordStrength === 2) return 'bg-yellow-400'
    if (passwordStrength === 3) return 'bg-blue-400'
    return 'bg-green-400'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FAFB] to-[#D8F3DC]/30 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
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
            <CardTitle className="text-2xl font-bold text-[#1B4332]">Create your account</CardTitle>
            <CardDescription>Start managing your farm digitally</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-start gap-2">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" required>Full Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={fullName}
                onChange={(e) => setFullName((e.target as HTMLInputElement).value)}
                className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" required>Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@farm.com"
                value={email}
                onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" required>Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
                showPasswordToggle
              />
              {/* Password strength bar */}
              {password && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 4) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{getPasswordStrengthLabel()}</span>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Use 8+ chars with uppercase, lowercase, number & special character
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
                className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
                showPasswordToggle
              />
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
              {password && confirmPassword && password === confirmPassword && (
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <CheckCircle size={12} /> Passwords match
                </p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#2D6A4F] focus:ring-[#2D6A4F]"
              />
              <Label htmlFor="terms" className="text-xs text-gray-500 cursor-pointer leading-relaxed">
                I agree to the{' '}
                <Link href="/terms" className="text-[#2D6A4F] hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-[#2D6A4F] hover:underline">Privacy Policy</Link>
                {'. '}I also understand the{' '}
                <Link href="/refund-policy" className="text-[#2D6A4F] hover:underline">refund and cancellation policy</Link>.
              </Label>
            </div>

            <Button
              className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white shadow-sm hover:shadow-md transition-all"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <><span className="animate-spin mr-2">⏳</span> Creating account...</>
              ) : (
                'Create Account'
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-gray-400">Already have an account?</span>
              </div>
            </div>

            <Link href="/login">
              <Button
                variant="outline"
                className="w-full border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC] hover:border-[#1B4332] transition-all"
              >
                Sign in instead
              </Button>
            </Link>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link href="/" className="hover:text-[#2D6A4F] transition-colors">
            ← Back to RootBase
          </Link>
        </p>

        {/* Farm emoji decoration */}
        <div className="mt-4 text-center text-xs uppercase tracking-[0.3em] text-gray-400">
          Secure farm management
        </div>
      </div>
    </div>
  )
}