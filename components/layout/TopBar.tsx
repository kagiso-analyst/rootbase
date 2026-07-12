'use client'

import { useFarm } from '@/lib/farm-context'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bell, LogOut, User, Leaf } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  const [greeting, setGreeting] = useState('Good morning')
  const { currentFarm, farms, switchFarm } = useFarm()
  

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')

    // Get user info
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email)
      if (data.user?.user_metadata?.full_name) {
        setUserName(data.user.user_metadata.full_name)
      }
    })
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6 md:px-6 pl-16 md:pl-6">
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-gray-500">
          {greeting}, {userName ? userName.split(' ')[0] : 'Farmer'} 🌱
        </p>

        {/* Farm switcher */}
        {farms.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex items-center gap-2 border-[#2D6A4F] text-[#2D6A4F] h-8 text-xs"
              >
                <Leaf size={12} />
                <span className="max-w-28 truncate">
                  {currentFarm?.name || 'Select Farm'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60">
              <DropdownMenuLabel className="text-xs text-gray-400 uppercase tracking-wide">
                Your Farms
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {farms.map(farm => (
                <DropdownMenuItem
                  key={farm.id}
                  onClick={() => switchFarm(farm.id)}
                  className={`cursor-pointer ${farm.is_active ? 'bg-[#D8F3DC] text-[#1B4332] font-medium' : ''}`}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${farm.is_active ? 'bg-[#2D6A4F]' : 'bg-gray-100'}`}>
                      <Leaf size={11} className={farm.is_active ? 'text-white' : 'text-gray-400'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{farm.name}</p>
                      {farm.farm_type && (
                        <p className="text-xs text-gray-400">{farm.farm_type}</p>
                      )}
                    </div>
                    {farm.is_active && (
                      <div className="w-2 h-2 bg-[#52B788] rounded-full flex-shrink-0" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push('/settings')}
                className="text-[#2D6A4F] cursor-pointer"
              >
                <span className="text-sm">+ Add New Farm</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/notifications')}
          title="Notifications"
        >
          <Bell size={18} className="text-gray-500" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Account">
              <User size={18} className="text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-xs text-gray-500">Signed in as</p>
              <p className="text-sm font-medium truncate">{userEmail}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <User size={14} className="mr-2" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-500 focus:text-red-500"
            >
              <LogOut size={14} className="mr-2" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          title="Sign Out"
          className="hidden sm:flex"
        >
          <LogOut size={18} className="text-gray-500" />
        </Button>
      </div>
    </header>
  )
}