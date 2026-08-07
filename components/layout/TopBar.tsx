// components/layout/TopBar.tsx

'use client'

import { useFarm } from '@/lib/farm-context'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Bell, 
  LogOut, 
  Leaf, 
  ChevronDown, 
  Settings, 
  HelpCircle, 
  Home,
  Shield,
  Sparkles,
  Clock,
  Package,
  FileText,
  CloudRain,
  User,
  Loader2
} from 'lucide-react'
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
  
  // ===== STATE =====
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [userPlan, setUserPlan] = useState('free')
  const [notificationCount, setNotificationCount] = useState(0)
  const [notificationDetails, setNotificationDetails] = useState({
    overdue: 0,
    lowStock: 0,
    expiringDocs: 0,
    alerts: 0
  })
  const [greeting, setGreeting] = useState('Good morning')
  const [greetingEmoji, setGreetingEmoji] = useState('🌱')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const { currentFarm, farms, switchFarm } = useFarm()
  const notificationInterval = useRef<NodeJS.Timeout | null>(null)

  // ===== FETCH USER DATA =====
  const fetchUserData = useCallback(async () => {
    try {
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
      }
    } catch (err) {
      console.error('Fetch user data error:', err)
    }
  }, [supabase])

  // ===== SAFE QUERY HELPER =====
  const safeCountQuery = useCallback(async (table: string, query: any) => {
    try {
      // First check if the table exists by trying to get a single row
      const { error: tableCheckError } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: true })
        .limit(1)
      
      // If table doesn't exist, return 0
      if (tableCheckError && tableCheckError.code === '42P01') {
        console.warn(`Table "${table}" doesn't exist yet, skipping count`)
        return 0
      }
      
      // If table exists but there was another error, return 0
      if (tableCheckError) {
        console.warn(`Error checking table "${table}":`, tableCheckError)
        return 0
      }
      
      // Now run the actual count query
      const { count, error } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: true })
        .match(query)
      
      if (error) {
        console.warn(`Error counting from "${table}":`, error)
        return 0
      }
      
      return count || 0
    } catch (err) {
      console.warn(`Unexpected error counting from "${table}":`, err)
      return 0
    }
  }, [supabase])

  // ===== FETCH REAL NOTIFICATIONS =====
  const fetchNotificationCount = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !currentFarm) {
      setNotificationCount(0)
      setNotificationDetails({ overdue: 0, lowStock: 0, expiringDocs: 0, alerts: 0 })
      setIsLoading(false)
      return
    }

    try {
      setIsRefreshing(true)
      const today = new Date().toISOString().split('T')[0]
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      const expiryDate = thirtyDaysFromNow.toISOString().split('T')[0]

      // Run all queries with safe error handling
      const [overdueCount, lowStockCount, docCount, alertCount] = await Promise.all([
        // Count overdue tasks
        safeCountQuery('tasks', {
          user_id: user.id,
          farm_id: currentFarm.id,
          status: 'todo',
          // Use a filter for due_date < today
        }).then(async (count) => {
          // If we got a count, filter by due_date manually
          if (count > 0) {
            const { count: filteredCount, error } = await supabase
              .from('tasks')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('farm_id', currentFarm.id)
              .eq('status', 'todo')
              .lt('due_date', today)
            
            if (!error && filteredCount !== null) {
              return filteredCount
            }
          }
          return 0
        }),
        
        // Count low stock items
        safeCountQuery('inventory_items', {
          user_id: user.id,
          farm_id: currentFarm.id,
        }).then(async (count) => {
          // Only apply stock filter if we got a count
          if (count > 0) {
            const { count: filteredCount, error } = await supabase
              .from('inventory_items')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('farm_id', currentFarm.id)
              .gt('reorder_level', 0)
              .lt('current_quantity', 'reorder_level')
            
            if (!error && filteredCount !== null) {
              return filteredCount
            }
          }
          return 0
        }),
        
        // Count expiring documents
        safeCountQuery('documents', {
          user_id: user.id,
          farm_id: currentFarm.id,
        }).then(async (count) => {
          if (count > 0) {
            const { count: filteredCount, error } = await supabase
              .from('documents')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('farm_id', currentFarm.id)
              .gte('expiry_date', today)
              .lte('expiry_date', expiryDate)
            
            if (!error && filteredCount !== null) {
              return filteredCount
            }
          }
          return 0
        }),
        
        // Count unread weather alerts
        safeCountQuery('weather_alerts', {
          user_id: user.id,
          farm_id: currentFarm.id,
          is_read: false,
        }),
      ])

      const details = {
        overdue: overdueCount || 0,
        lowStock: lowStockCount || 0,
        expiringDocs: docCount || 0,
        alerts: alertCount || 0
      }

      setNotificationDetails(details)
      const total = details.overdue + details.lowStock + details.expiringDocs + details.alerts
      setNotificationCount(total)
      
    } catch (err) {
      console.error('Notification fetch error:', err)
      // Keep previous values on error
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [supabase, currentFarm, safeCountQuery])

  // ===== HANDLE SIGN OUT =====
  const handleSignOut = useCallback(async () => {
    try {
      if (notificationInterval.current) {
        clearInterval(notificationInterval.current)
        notificationInterval.current = null
      }
      await supabase.auth.signOut()
      router.push('/')
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }, [supabase, router])

  // ===== GET INITIALS =====
  const getInitials = useCallback((name: string) => {
    if (!name) return 'F'
    const parts = name.split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }, [])

  // ===== GET PLAN BADGE =====
  const getPlanBadge = useCallback((plan: string) => {
    const badges: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      free: { 
        label: 'Free', 
        color: 'bg-gray-100 text-gray-600',
        icon: null
      },
      starter: { 
        label: 'Starter', 
        color: 'bg-blue-100 text-blue-700',
        icon: <Sparkles size={10} className="mr-1" />
      },
      pro: { 
        label: 'Pro', 
        color: 'bg-purple-100 text-purple-700',
        icon: <Shield size={10} className="mr-1" />
      },
      business: { 
        label: 'Business', 
        color: 'bg-amber-100 text-amber-700',
        icon: <Shield size={10} className="mr-1" />
      },
    }
    return badges[plan] || badges.free
  }, [])

  // ===== GET NOTIFICATION TOOLTIP =====
  const getNotificationTooltip = useCallback(() => {
    const parts = []
    if (notificationDetails.overdue > 0) parts.push(`${notificationDetails.overdue} overdue tasks`)
    if (notificationDetails.lowStock > 0) parts.push(`${notificationDetails.lowStock} low stock items`)
    if (notificationDetails.expiringDocs > 0) parts.push(`${notificationDetails.expiringDocs} expiring documents`)
    if (notificationDetails.alerts > 0) parts.push(`${notificationDetails.alerts} weather alerts`)
    return parts.length > 0 ? parts.join(', ') : 'No notifications'
  }, [notificationDetails])

  // ===== INITIAL LOAD =====
  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  // ===== REFRESH ON PROFILE CHANGE =====
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchUserData()
    }
    window.addEventListener('profile-updated', handleProfileUpdate)
    return () => window.removeEventListener('profile-updated', handleProfileUpdate)
  }, [fetchUserData])

  // ===== FETCH NOTIFICATIONS =====
  useEffect(() => {
    if (currentFarm) {
      fetchNotificationCount()
      
      if (notificationInterval.current) {
        clearInterval(notificationInterval.current)
      }
      notificationInterval.current = setInterval(fetchNotificationCount, 5 * 60 * 1000)
      
      return () => {
        if (notificationInterval.current) {
          clearInterval(notificationInterval.current)
          notificationInterval.current = null
        }
      }
    }
  }, [currentFarm, fetchNotificationCount])

  const planBadge = getPlanBadge(userPlan)

  return (
    <header className="h-16 border-b border-gray-200/80 bg-white/95 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 pl-16 md:pl-6 shadow-sm">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <Logo variant="icon" size="sm" className="md:hidden" />

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">{greeting}</span>
          <span className="text-sm font-semibold text-[#1B4332]">
            {userName ? userName.split(' ')[0] : 'Farmer'}
          </span>
          <span className="text-sm">{greetingEmoji}</span>
        </div>

        <div className="hidden sm:block w-px h-6 bg-gray-200" />

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
        <span className={cn(
          "hidden sm:inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium",
          planBadge.color
        )}>
          {planBadge.icon}
          {planBadge.label}
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/notifications')}
          title={getNotificationTooltip()}
          className="relative hover:bg-gray-100 rounded-full w-9 h-9"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 size={18} className="text-gray-400 animate-spin" />
          ) : (
            <Bell size={18} className="text-gray-500" />
          )}
          {!isLoading && notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </Button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

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
              <div className="flex items-center gap-1 mt-1">
                <span className={cn(
                  "inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-medium",
                  planBadge.color
                )}>
                  {planBadge.icon}
                  {planBadge.label}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />
            
            {!isLoading && notificationCount > 0 && (
              <>
                <div className="px-3 py-1.5">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Notifications</p>
                  <div className="mt-1 space-y-0.5">
                    {notificationDetails.overdue > 0 && (
                      <div className="flex items-center gap-2 text-xs text-red-600">
                        <Clock size={12} />
                        <span>{notificationDetails.overdue} overdue task{notificationDetails.overdue > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {notificationDetails.lowStock > 0 && (
                      <div className="flex items-center gap-2 text-xs text-amber-600">
                        <Package size={12} />
                        <span>{notificationDetails.lowStock} low stock item{notificationDetails.lowStock > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {notificationDetails.expiringDocs > 0 && (
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <FileText size={12} />
                        <span>{notificationDetails.expiringDocs} expiring document{notificationDetails.expiringDocs > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {notificationDetails.alerts > 0 && (
                      <div className="flex items-center gap-2 text-xs text-purple-600">
                        <CloudRain size={12} />
                        <span>{notificationDetails.alerts} weather alert{notificationDetails.alerts > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator className="my-1" />
              </>
            )}

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