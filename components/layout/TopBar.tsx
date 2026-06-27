'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bell, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TopBar() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      <h1 className="text-sm font-medium text-gray-500">Good morning, Farmer 🌱</h1>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon"><Bell size={18} /></Button>
        <Button variant="ghost" size="icon"><User size={18} /></Button>
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  )
}