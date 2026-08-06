// components/layout/TopBar.tsx

'use client'

import { useFarm } from '@/lib/farm-context'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bell, LogOut, User, Leaf, ChevronDown, Settings, HelpCircle, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/Logo'
import { getSeasonalGreeting, cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function TopBar() {
  const router = useRouter()
  const supabase = createClient()
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [userPlan, setUserPlan] = useState('free')
  const [notificationCount, setNotificationCount] = useState(0)
  const [greeting, setGreeting] = useState('Good morning')
  const [greetingEmoji, setGreetingEmoji] = useState('🌱')
  const { currentFarm, farms, switchFarm } = useFarm()

  useEffect(() => {
    async function fetchUserData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const displayName = user.user_metadata?.full_name?.trim() || user.email?.split('@')[0] || 'Farmer'
      const seasonal = getSeasonalGreeting(displayName)

      setUserEmail(user.email || '')
      setUserName(displayName)
      setGreeting(seasonal.greeting)
      setGreetingEmoji(seasonal.emoji)

      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, plan')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profile) {
        setAvatarUrl(profile.avatar_url || '')
        setUserPlan(profile.plan || 'free')
      } else {
        setUserPlan('free')
      }
    }

    fetchUserData()
    setNotificationCount(3)
  }, [supabase])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  function getInitials(name: string) {
    if (!name) return 'F'
    const parts = name.split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  function getPlanBadge(plan: string) {
    const badges: Record<string, { label: string; color: string }> = {
      free: { label: 'Free', color: 'bg-gray-100 text-gray-600' },
      starter: { label: 'Starter', color: 'bg-blue-100 text-blue-700' },
      pro: { label: 'Pro', color: 'bg-purple-100 text-purple-700' },
      business: { label: 'Business', color: 'bg-amber-100 text-amber-700' },
    }
    return badges[plan] || badges.free
  }

  const planBadge = getPlanBadge(userPlan)

  return (
    <header className="h-16 border-b border-gray-200/80 bg-white/95 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 pl-16 md:pl-6 shadow-sm">
      {/* Left section */}
      <div className="flex items-center gap-4">
        {/* Logo - visible on mobile */}
        <Logo variant="icon" size="sm" className="md:hidden" />

        {/* Greeting - visible on desktop */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">{greeting}</span>
          <span className="text-sm font-semibold text-[#1B4332]">
            {userName ? userName.split(' ')[0] : 'Farmer'}
          </span>
          <span className="text-sm">{greetingEmoji}</span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-gray-200" />

        {/* Farm switcher */}
        {farms.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex items-center gap-2 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC] hover:border-[#1B4332] transition-all h-8 text-xs font-medium rounded-full px-3"
              >
                <Leaf size={13} className="text-[#2D6A4F]" />
                <span className="max-w-32 truncate">
                  {currentFarm?.name || 'Select Farm'}
                </span>
                <ChevronDown size={12} className="text-[#2D6A4F]/60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 p-1 shadow-xl border-gray-100">
              <DropdownMenuLabel className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold px-2 py-1.5">
                Your Farms
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1" />
              {farms.map(farm => (
                <DropdownMenuItem
                  key={farm.id}
                  onClick={() => switchFarm(farm.id)}
                  className={cn(
                    "cursor-pointer rounded-lg transition-all py-2 px-3",
                    farm.is_active 
                      ? "bg-[#D8F3DC] text-[#1B4332] font-medium hover:bg-[#D8F3DC]" 
                      : "hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                      farm.is_active ? "bg-[#2D6A4F]" : "bg-gray-100"
                    )}>
                      <Leaf size={13} className={farm.is_active ? "text-white" : "text-gray-400"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate font-medium">{farm.name}</p>
                      {farm.farm_type && (
                        <p className="text-[10px] text-gray-400 truncate">{farm.farm_type}</p>
                      )}
                    </div>
                    {farm.is_active && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-[#52B788] rounded-full animate-pulse" />
                        <span className="text-[10px] text-[#52B788] font-medium">Active</span>
                      </div>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                onClick={() => router.push('/settings')}
                className="text-[#2D6A4F] cursor-pointer rounded-lg hover:bg-[#D8F3DC] py-2"
              >
                <div className="flex items-center gap-2 w-full">
                  <div className="w-7 h-7 rounded-lg border border-dashed border-[#2D6A4F] flex items-center justify-center">
                    <span className="text-lg">+</span>
                  </div>
                  <span className="text-sm font-medium">Add New Farm</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1">
        {/* Plan Badge */}
        <span className={cn(
          "hidden sm:inline-block text-xs px-2 py-0.5 rounded-full font-medium",
          planBadge.color
        )}>
          {planBadge.label}
        </span>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/notifications')}
          title="Notifications"
          className="relative hover:bg-gray-100 rounded-full w-9 h-9"
        >
          <Bell size={18} className="text-gray-500" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </Button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 hover:bg-gray-100 rounded-full px-2 py-1 h-9 transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2D6A4F] to-[#1B4332] flex items-center justify-center text-white text-xs font-medium shadow-sm overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  getInitials(userName)
                )}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-gray-700 max-w-24 truncate">
                {userName || 'Farmer'}
              </span>
              <ChevronDown size={14} className="text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1 shadow-xl border-gray-100">
            <DropdownMenuLabel className="font-normal px-3 py-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Signed in as</p>
              <p className="text-sm font-medium truncate text-gray-800">{userEmail || 'farmer@example.com'}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem 
              onClick={() => router.push('/dashboard')}
              className="cursor-pointer rounded-lg hover:bg-gray-50 py-2"
            >
              <Home size={14} className="mr-2 text-gray-500" /> Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => router.push('/settings')}
              className="cursor-pointer rounded-lg hover:bg-gray-50 py-2"
            >
              <Settings size={14} className="mr-2 text-gray-500" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => router.push('/support')}
              className="cursor-pointer rounded-lg hover:bg-gray-50 py-2"
            >
              <HelpCircle size={14} className="mr-2 text-gray-500" /> Help & Support
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer rounded-lg hover:bg-red-50 py-2 text-red-500 hover:text-red-600 focus:text-red-500"
            >
              <LogOut size={14} className="mr-2" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sign out button (mobile) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          title="Sign Out"
          className="hidden sm:flex hover:bg-gray-100 rounded-full w-9 h-9"
        >
          <LogOut size={18} className="text-gray-400" />
        </Button>
      </div>
    </header>
  )
}