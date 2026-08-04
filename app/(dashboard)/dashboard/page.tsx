// app/(dashboard)/dashboard/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { 
  BarChart2, Leaf, CheckSquare, BookOpen, Sparkles, 
  TrendingUp, TrendingDown, DollarSign, Cloud, Sun, 
  CloudRain, Thermometer, Wind
} from 'lucide-react' // 👈 ADD MORE ICONS
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge' // 👈 ADD THIS
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context' // 👈 ADD THIS
import { getSeasonalGreeting, cn } from '@/lib/utils' // 👈 ADD THIS
import Link from 'next/link'
import { fetchWeather, getWeatherEmoji, type WeatherData } from '@/lib/weather'
import { Button } from '@/components/ui/button'

type Task = {
  id: string
  title: string
  priority: string
  due_date: string
  status: string
}

type JournalEntry = {
  id: string
  title: string
  content: string
  entry_type: string
  entry_date: string
}

export default function DashboardPage() {
  // ===== STATE =====
  const [income, setIncome] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [activeCrops, setActiveCrops] = useState(0)
  const [openTasks, setOpenTasks] = useState(0)
  const [tasks, setTasks] = useState<Task[]>([])
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState('')
  const [greeting, setGreeting] = useState('')

  // 👇 GET CURRENT FARM
  const { currentFarm, loading: farmLoading } = useFarm()
  const supabase = createClient()

  // ===== FETCH DASHBOARD DATA =====
  useEffect(() => {
    async function fetchDashboardData() {
      // 👇 CHECK IF FARM IS SELECTED
      if (!currentFarm) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setUser(null)
          setLoading(false)
          return
        }
        
        const displayName = user.user_metadata?.full_name?.trim() || user.email?.split('@')[0] || 'Farmer'
        setUser(user)
        setUserName(displayName)

        // Set seasonal greeting
        const seasonal = getSeasonalGreeting(displayName)
        setGreeting(seasonal.greeting)

        const now = new Date()
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

        const [
          incomeRes,
          expensesRes,
          cropsRes,
          tasksCountRes,
          tasksRes,
          journalRes,
        ] = await Promise.all([
          supabase
            .from('income')
            .select('amount')
            .eq('user_id', user.id)
            .eq('farm_id', currentFarm.id) // 👈 FILTER BY FARM
            .gte('date', firstOfMonth),
          supabase
            .from('expenses')
            .select('amount')
            .eq('user_id', user.id)
            .eq('farm_id', currentFarm.id) // 👈 FILTER BY FARM
            .gte('date', firstOfMonth),
          supabase
            .from('crops')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id)
            .eq('farm_id', currentFarm.id) // 👈 FILTER BY FARM
            .eq('status', 'active'),
          supabase
            .from('tasks')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id)
            .eq('farm_id', currentFarm.id) // 👈 FILTER BY FARM
            .neq('status', 'done'),
          supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .eq('farm_id', currentFarm.id) // 👈 FILTER BY FARM
            .neq('status', 'done')
            .order('due_date', { ascending: true })
            .limit(5),
          supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', user.id)
            .eq('farm_id', currentFarm.id) // 👈 FILTER BY FARM
            .order('created_at', { ascending: false })
            .limit(3),
        ])

        // 👇 Check for errors
        if (incomeRes.error) throw new Error('Failed to fetch income: ' + incomeRes.error.message)
        if (expensesRes.error) throw new Error('Failed to fetch expenses: ' + expensesRes.error.message)
        if (cropsRes.error) throw new Error('Failed to fetch crops: ' + cropsRes.error.message)

        const totalIncome = incomeRes.data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0
        const totalExpenses = expensesRes.data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0

        setIncome(totalIncome)
        setExpenses(totalExpenses)
        setActiveCrops(cropsRes.count || 0)
        setOpenTasks(tasksCountRes.count || 0)
        setTasks(tasksRes.data || [])
        setEntries(journalRes.data || [])

        // Fetch weather using GPS or default to Johannesburg
        if (typeof window !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              try {
                const w = await fetchWeather(pos.coords.latitude, pos.coords.longitude)
                if (w) setWeather(w)
              } catch (weatherErr) {
                console.error('Weather fetch error:', weatherErr)
              }
            },
            async () => {
              try {
                const w = await fetchWeather(-26.2041, 28.0473)
                if (w) setWeather(w)
              } catch (weatherErr) {
                console.error('Weather fetch error:', weatherErr)
              }
            }
          )
        } else {
          try {
            const w = await fetchWeather(-26.2041, 28.0473)
            if (w) setWeather(w)
          } catch (weatherErr) {
            console.error('Weather fetch error:', weatherErr)
          }
        }
        
      } catch (err) {
        console.error('Dashboard fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load dashboard. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [currentFarm]) // 👈 REFETCH WHEN FARM CHANGES

  const net = income - expenses
  const isProfit = net >= 0

  const PRIORITY_COLOURS: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-blue-100 text-blue-700',
    low: 'bg-gray-100 text-gray-600',
  }

  const ENTRY_TYPE_COLOURS: Record<string, string> = {
    General: 'bg-gray-100 text-gray-600',
    Spraying: 'bg-blue-100 text-blue-700',
    Fertilising: 'bg-green-100 text-green-700',
    Irrigation: 'bg-cyan-100 text-cyan-700',
    Harvesting: 'bg-purple-100 text-purple-700',
    Planting: 'bg-lime-100 text-lime-700',
    Scouting: 'bg-orange-100 text-orange-700',
    Maintenance: 'bg-yellow-100 text-yellow-700',
    Weather: 'bg-sky-100 text-sky-700',
    Other: 'bg-gray-100 text-gray-500',
  }

  // ===== LOADING STATE =====
  if (farmLoading || loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse mb-3" />
              <div className="h-8 w-28 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4" />
              {[1,2,3].map(j => (
                <div key={j} className="h-4 w-full bg-gray-100 rounded animate-pulse mb-2" />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ===== NOT LOGGED IN =====
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">Please Log In</h2>
        <p className="text-sm text-gray-500">You need to be logged in to see your dashboard.</p>
        <Link href="/login">
          <Button className="mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            Go to Login
          </Button>
        </Link>
      </div>
    )
  }

  // ===== NO FARM SELECTED =====
  if (!currentFarm) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">🏠</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">No Farm Selected</h2>
        <p className="text-sm text-gray-500">Please select or create a farm to view your dashboard.</p>
        <Link href="/settings">
          <Button className="mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            Go to Settings
          </Button>
        </Link>
      </div>
    )
  }

  // ===== ERROR STATE =====
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#1B4332]">Farm Dashboard</h1>
          <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
            🌱 {currentFarm.name}
          </Badge>
        </div>
        <Card className="shadow-sm border-red-200 bg-red-50">
          <CardContent className="py-4 px-6 flex items-center justify-between">
            <p className="text-sm text-red-700">❌ {error}</p>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.location.reload()}
              className="text-red-700 hover:bg-red-100"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ===== ACTUAL PAGE =====
  return (
    <div className="space-y-6">
      {/* Header with greeting */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-[#1B4332]">Farm Dashboard</h1>
          <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
            🌱 {currentFarm.name}
          </Badge>
        </div>
        <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
          <span>{greeting || 'Welcome to RootBase'}</span>
          <span className="text-base">{getSeasonalGreeting(userName || 'Farmer').emoji}</span>
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="shadow-sm border-0 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Income</CardTitle>
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp size={16} className="text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R{income.toFixed(2)}</div>
            <p className="text-xs text-gray-400 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Expenses</CardTitle>
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <TrendingDown size={16} className="text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">R{expenses.toFixed(2)}</div>
            <p className="text-xs text-gray-400 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className={`shadow-sm border-0 bg-gradient-to-br ${isProfit ? 'from-[#D8F3DC] to-white' : 'from-red-50 to-white'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Net {isProfit ? 'Profit' : 'Loss'}</CardTitle>
            <div className={`w-8 h-8 rounded-full ${isProfit ? 'bg-[#D8F3DC]' : 'bg-red-100'} flex items-center justify-center`}>
              <DollarSign size={16} className={isProfit ? 'text-[#2D6A4F]' : 'text-red-500'} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isProfit ? 'text-[#2D6A4F]' : 'text-red-500'}`}>R{Math.abs(net).toFixed(2)}</div>
            <p className="text-xs text-gray-400 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Crops</CardTitle>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Leaf size={16} className="text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeCrops}</div>
            <p className="text-xs text-gray-400 mt-1">In the ground</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Open Tasks', value: openTasks, icon: CheckSquare, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Profit Margin', value: income > 0 ? ((net / income) * 100).toFixed(1) + '%' : '0%', icon: TrendingUp, color: 'text-[#2D6A4F]', bg: 'bg-[#D8F3DC]' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-xl p-3 border border-gray-100 ${bg}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-medium text-gray-500">{label}</p>
              <Icon size={14} className={color} />
            </div>
            <p className={`text-lg font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Weather widget */}
      {weather && (
        <Card className="shadow-sm bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white overflow-hidden relative">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5"></div>
          <CardContent className="py-4 relative z-10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-4xl font-bold">{weather.temp}°C</p>
                  <p className="text-[#D8F3DC] text-sm capitalize mt-0.5">{weather.description}</p>
                </div>
                <div className="text-4xl">{getWeatherEmoji(weather.description)}</div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-[#D8F3DC] text-xs">Humidity</p>
                  <p className="font-semibold">{weather.humidity}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[#D8F3DC] text-xs">Wind</p>
                  <p className="font-semibold">{weather.windSpeed} km/h</p>
                </div>
                <div className="text-center">
                  <p className="text-[#D8F3DC] text-xs">Feels like</p>
                  <p className="font-semibold">{weather.feelsLike}°C</p>
                </div>
                <div className="text-center">
                  <p className="text-[#D8F3DC] text-xs">Location</p>
                  <p className="font-semibold">{weather.city}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {weather.forecast.slice(1, 4).map((day) => (
                  <div key={day.date} className="text-center bg-white/10 rounded-lg px-3 py-2">
                    <p className="text-xs text-[#D8F3DC]">{day.dayName}</p>
                    <p className="text-lg my-1">{getWeatherEmoji(day.description)}</p>
                    <p className="text-xs font-medium">{day.tempMax}°/{day.tempMin}°</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks and Journal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                <CheckSquare size={14} className="text-orange-500" />
              </div>
              Today's Tasks
            </CardTitle>
            <span className="text-xs text-gray-400">{openTasks} open</span>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <CheckSquare size={24} className="opacity-30" />
                </div>
                <p className="text-sm font-medium text-gray-600">No open tasks</p>
                <p className="text-xs text-gray-400 mt-1">You're all caught up! 🎉</p>
                <Link href="/tasks" className="mt-3 text-sm text-[#2D6A4F] hover:underline">Add a task →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        task.priority === 'urgent' ? 'bg-red-500' :
                        task.priority === 'high' ? 'bg-orange-500' :
                        task.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-300'
                      }`} />
                      <p className="text-sm text-gray-700 truncate">{task.title}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_COLOURS[task.priority] || 'bg-gray-100 text-gray-600'}`}>
                        {task.priority}
                      </span>
                      {task.due_date && <span className="text-xs text-gray-400">{task.due_date}</span>}
                    </div>
                  </div>
                ))}
                <Link href="/tasks" className="block text-center text-xs text-[#2D6A4F] hover:underline pt-2">View all tasks →</Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                <BookOpen size={14} className="text-purple-500" />
              </div>
              Recent Journal Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <BookOpen size={24} className="opacity-30" />
                </div>
                <p className="text-sm font-medium text-gray-600">No journal entries yet</p>
                <p className="text-xs text-gray-400 mt-1">Start recording your farm's story</p>
                <Link href="/journal" className="mt-3 text-sm text-[#2D6A4F] hover:underline">Write your first entry →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <div key={entry.id} className="border-b border-gray-50 last:border-0 pb-3 last:pb-0 hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${ENTRY_TYPE_COLOURS[entry.entry_type] || 'bg-gray-100 text-gray-600'}`}>
                        {entry.entry_type}
                      </span>
                      <span className="text-xs text-gray-400">{entry.entry_date}</span>
                    </div>
                    {entry.title && <p className="text-sm font-medium text-gray-700">{entry.title}</p>}
                    <p className="text-xs text-gray-500 truncate mt-0.5">{entry.content}</p>
                  </div>
                ))}
                <Link href="/journal" className="block text-center text-xs text-[#2D6A4F] hover:underline pt-1">View all entries →</Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Add Expense', href: '/finances/expenses', color: 'bg-red-50 text-red-700 hover:bg-red-100', icon: '💰' },
          { label: 'Add Income', href: '/finances/income', color: 'bg-green-50 text-green-700 hover:bg-green-100', icon: '💵' },
          { label: 'Add Crop', href: '/crops', color: 'bg-[#D8F3DC] text-[#1B4332] hover:bg-[#52B788]/20', icon: '🌱' },
          { label: 'New Journal Entry', href: '/journal', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100', icon: '📝' },
        ].map(({ label, href, color, icon }) => (
          <Link key={href} href={href}>
            <div className={`rounded-lg px-4 py-3 text-center text-sm font-medium transition-colors cursor-pointer ${color}`}>
              <div className="text-lg mb-0.5">{icon}</div>
              {label}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}