// app/test/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestPage() {
  const [status, setStatus] = useState('Testing...')
  const [error, setError] = useState('')
  const [url, setUrl] = useState('')
  const [keyLength, setKeyLength] = useState(0)

  useEffect(() => {
    async function test() {
      try {
        const supabase = createClient()
        const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'
        const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
        
        setUrl(envUrl)
        setKeyLength(envKey.length)
        
        console.log('=== Supabase Test ===')
        console.log('URL:', envUrl)
        console.log('Key length:', envKey.length)
        console.log('Key starts with:', envKey.substring(0, 10))
        
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          setError(error.message)
          setStatus('❌ Failed')
        } else {
          console.log('✅ Connection successful!')
          setStatus('✅ Connected successfully!')
        }
      } catch (err: any) {
        console.error('Test error:', err)
        setError(err.message || 'Unknown error')
        setStatus('❌ Failed')
      }
    }
    
    test()
  }, [])

  if (process.env.NODE_ENV === 'production') return null

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      <div className="p-4 bg-gray-100 rounded-lg space-y-2">
        <p><strong>Status:</strong> {status}</p>
        <p><strong>URL:</strong> {url}</p>
        <p><strong>Key present:</strong> {keyLength > 0 ? `Yes (${keyLength} chars)` : 'No'}</p>
        {error && <p className="text-red-500"><strong>Error:</strong> {error}</p>}
      </div>
    </div>
  )
}