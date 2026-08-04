// app/test-signup/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestSignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    setLoading(true)
    setStatus('Attempting signup...')
    setError('')

    try {
      const supabase = createClient()
      
      // Log the client config
      console.log('Supabase client created')
      console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            full_name: 'Test User',
          },
        },
      })

      if (error) {
        console.error('Signup error:', error)
        setStatus('❌ Failed')
        setError(error.message || 'Unknown error')
      } else {
        console.log('Signup success:', data)
        setStatus('✅ Success! User created: ' + data.user?.email)
        setError('')
      }
    } catch (err: any) {
      console.error('Exception:', err)
      setStatus('❌ Exception')
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test Signup</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="test@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="TestPassword123!"
          />
        </div>
        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full p-2 bg-[#2D6A4F] text-white rounded disabled:opacity-50"
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
        {status && <p className="font-medium">{status}</p>}
        {error && <p className="text-red-500">{error}</p>}
      </div>
    </div>
  )
}