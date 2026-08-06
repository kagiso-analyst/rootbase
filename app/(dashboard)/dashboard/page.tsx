// app/(dashboard)/dashboard/page.tsx

'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  BarChart2, Leaf, CheckSquare, BookOpen, Sparkles,
  TrendingUp, TrendingDown, DollarSign, Cloud, Sun,
  CloudRain, Thermometer, Wind, Plus, Calendar,
  ArrowUpRight, ArrowDownRight, Package, Wrench, FileText,
  Bell, Clock, Droplets, Sunrise, Sunset, Eye, AlertCircle,
  ChevronDown, Activity, Sprout, PiggyBank, Tractor
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context'
import { getSeasonalGreeting, cn, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { fetchWeather, getWeatherEmoji, getFarmingAdvice, type WeatherData } from '@/lib/weather'
import { Button } from '@/components/ui/button'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const COLORS = ['#52B788', '#2D6A4F', '#1B4332', '#F4A261', '#E76F51', '#2A9D8F', '#E9C46A', '#F4A261']

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

type MonthlyData = {
  date: string
  income: number
  expenses: number
  profit: number
}

type CategoryData = {
  category: string
  amount: number
  color?: string
}

type Transaction = {
  id: string
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number
  date: string
  icon?: string
}

const TRANSACTION_ICONS: Record<string, string> = {
  'Crop Sales': '🌾',
  'Livestock Sales': '🐄',
  'Wool / Fibre': '🧶',
  'Eggs / Dairy': '🥚',
  'Contract Work': '🔧',
  'Government Grant': '🏛️',
  'Insurance Payout': '🏦',
  'Other': '💳',
  'Seed': '🌱',
  'Fertiliser': '🧪',
  'Chemicals / Sprays': '🧴',
  'Labour': '👨‍🌾',
  'Fuel': '⛽',
  'Equipment': '🔧',
  'Transport': '🚛',
  'Irrigation': '💧',
  'Packaging': '📦',
  'Veterinary': '💉',
  'Feed': '🌾',
  'Repairs': '🔨',
  'Insurance': '🛡️',
}

export default function DashboardPage() {
  // ===== AUTH STATE =====
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [dateFilter, setDateFilter] = useState('Last 7 Days')
  const supabase = createClient()

  // ===== FARM CONTEXT =====
  const { currentFarm, loading: farmLoading } = useFarm()

  // ===== DATA STATE =====
  const [income, setIncome] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [activeCrops, setActiveCrops] = useState(0)
  const [openTasks, setOpenTasks] = useState(0)
  const [tasks, setTasks] = useState<Task[]>([])
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [weatherAdvice, setWeatherAdvice] = useState<string[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [expensesByCategory, setExpensesByCategory] = useState<CategoryData[]>([])
  const [incomeByCategory, setIncomeByCategory] = useState<CategoryData[]>([])
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [greeting, setGreeting] = useState('')
  const [notificationCount, setNotificationCount] = useState(0)
  const [prevTotal, setPrevTotal] = useState(0)

  // ===== CHECK AUTH =====
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        if (user) {
          const displayName = user.user_metadata?.full_name?.trim() || user.email?.split('@')[0] || 'Farmer'
          setUserName(displayName)
          const seasonal = getSeasonalGreeting(displayName)
          setGreeting(seasonal.greeting)
        }
      } catch (err) {
        console.error('Auth check error:', err)
        setError('Failed to authenticate. Please refresh the page.')
      } finally {
        setAuthChecked(true)
      }
    }
    checkAuth()
  }, [supabase])

  // ===== FETCH DASHBOARD DATA =====
  const fetchDashboardData = useCallback(async () => {
    if (!currentFarm || !user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const now = new Date()
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const [
        incomeRes,
        expensesRes,
        cropsRes,
        tasksCountRes,
        tasksRes,
        journalRes,
        recentIncomeRes,
        recentExpensesRes,
        prevIncomeRes,
        prevExpensesRes
      ] = await Promise.all([
        // Current month income
        supabase
          .from('income')
          .select('amount')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
          .gte('date', firstOfMonth),
        // Current month expenses
        supabase
          .from('expenses')
          .select('amount')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
          .gte('date', firstOfMonth),
        supabase
          .from('crops')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
          .eq('status', 'active'),
        supabase
          .from('tasks')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
          .neq('status', 'done'),
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
          .neq('status', 'done')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
          .order('created_at', { ascending: false })
          .limit(3),
        // Recent income for transactions
        supabase
          .from('income')
          .select('*')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
          .order('date', { ascending: false })
          .limit(4),
        // Recent expenses for transactions
        supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
          .order('date', { ascending: false })
          .limit(4),
        // Previous month income for trend
        supabase
          .from('income')
          .select('amount')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
          .gte('date', thirtyDaysAgo)
          .lt('date', firstOfMonth),
        // Previous month expenses for trend
        supabase
          .from('expenses')
          .select('amount')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
          .gte('date', thirtyDaysAgo)
          .lt('date', firstOfMonth),
      ])

      if (incomeRes.error) throw new Error('Failed to fetch income: ' + incomeRes.error.message)
      if (expensesRes.error) throw new Error('Failed to fetch expenses: ' + expensesRes.error.message)
      if (cropsRes.error) throw new Error('Failed to fetch crops: ' + cropsRes.error.message)

      const totalIncome = incomeRes.data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0
      const totalExpenses = expensesRes.data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0

      // Calculate previous month totals
      const prevIncome = prevIncomeRes.data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0
      const prevExpenses = prevExpensesRes.data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0

      setIncome(totalIncome)
      setExpenses(totalExpenses)
      setActiveCrops(cropsRes.count || 0)
      setOpenTasks(tasksCountRes.count || 0)
      setTasks(tasksRes.data || [])
      setEntries(journalRes.data || [])

      // Build weekly chart data
      const weekData: MonthlyData[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const label = d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })

        const dayIncome = recentIncomeRes.data
          ?.filter(r => r.date === dateStr)
          .reduce((sum, r) => sum + Number(r.amount), 0) || 0

        const dayExpenses = recentExpensesRes.data
          ?.filter(r => r.date === dateStr)
          .reduce((sum, r) => sum + Number(r.amount), 0) || 0

        weekData.push({
          date: label,
          income: dayIncome,
          expenses: dayExpenses,
          profit: dayIncome - dayExpenses,
        })
      }
      setMonthlyData(weekData)

      // Expenses by category (all time)
      const expCatMap: Record<string, number> = {}
      const expData = await supabase
        .from('expenses')
        .select('category, amount')
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)

      expData.data?.forEach(r => {
        if (r.category) {
          expCatMap[r.category] = (expCatMap[r.category] || 0) + Number(r.amount)
        }
      })

      const expCategories = Object.entries(expCatMap)
        .map(([category, amount], index) => ({
          category,
          amount,
          color: COLORS[index % COLORS.length]
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
      setExpensesByCategory(expCategories)

      // Recent transactions
      const transactions: Transaction[] = [
        ...(recentIncomeRes.data || []).map(r => ({
          ...r,
          type: 'income' as const,
          icon: TRANSACTION_ICONS[r.category] || '💰'
        })),
        ...(recentExpensesRes.data || []).map(r => ({
          ...r,
          type: 'expense' as const,
          icon: TRANSACTION_ICONS[r.category] || '💳'
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)

      setRecentTransactions(transactions)

      // Count notifications (low stock, overdue tasks, etc.)
      let notifCount = 0
      const lowStock = await supabase
        .from('inventory_items')
        .select('id')
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)
        .gt('reorder_level', 0)
        .lte('current_quantity', 'reorder_level')
      notifCount += (lowStock.count || 0)

      const overdueTasks = tasksRes.data?.filter(t => t.due_date && t.due_date < new Date().toISOString().split('T')[0]) || []
      notifCount += overdueTasks.length

      setNotificationCount(notifCount)

      // Fetch weather with advice
      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const w = await fetchWeather(pos.coords.latitude, pos.coords.longitude)
              if (w) {
                setWeather(w)
                setWeatherAdvice(getFarmingAdvice(w))
              }
            } catch (weatherErr) {
              console.error('Weather fetch error:', weatherErr)
              try {
                const w = await fetchWeather(-26.2041, 28.0473)
                if (w) {
                  setWeather(w)
                  setWeatherAdvice(getFarmingAdvice(w))
                }
              } catch (fallbackErr) {
                console.error('Fallback weather error:', fallbackErr)
              }
            }
          },
          async () => {
            try {
              const w = await fetchWeather(-26.2041, 28.0473)
              if (w) {
                setWeather(w)
                setWeatherAdvice(getFarmingAdvice(w))
              }
            } catch (weatherErr) {
              console.error('Weather fetch error:', weatherErr)
            }
          }
        )
      } else {
        try {
          const w = await fetchWeather(-26.2041, 28.0473)
          if (w) {
            setWeather(w)
            setWeatherAdvice(getFarmingAdvice(w))
          }
        } catch (weatherErr) {
          console.error('Weather fetch error:', weatherErr)
        }
      }

    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }, [currentFarm, user, supabase])

  useEffect(() => {
    if (authChecked && user) {
      fetchDashboardData()
    }
  }, [authChecked, user, fetchDashboardData])

  const net = income - expenses
  const isProfit = net >= 0
  const netPercent = income > 0 ? ((net / income) * 100) : 0

  // Calculate trend vs previous month
  const incomeTrend = income > 0 ? ((income / (prevTotal || 1)) * 100) : 0

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
  if (!authChecked || farmLoading || loading) {
    return (
      <div className="space-y-8 px-4 sm:px-0">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white/90 rounded-xl p-6 border border-slate-100 min-h-[150px]">
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse mb-3" />
              <div className="h-8 w-28 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-white/90 rounded-xl p-6 border border-slate-100 min-h-[200px]">
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4" />
              {[1, 2, 3].map(j => (
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
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
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
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
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
      <div className="space-y-8 px-4 sm:px-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-[#1B4332]">Farm Dashboard</h1>
          <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
            {currentFarm.name}
          </Badge>
        </div>
        <Card className="shadow-sm border-red-200 bg-red-50">
          <CardContent className="py-4 px-6 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-red-500 text-lg">⚠️</span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
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
    <div className="space-y-8 px-4 sm:px-0">

      {/* Header with greeting, date filter and notifications */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-[#1B4332]">Farm Dashboard</h1>
            <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
              {currentFarm.name}
            </Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
            <span>{greeting || 'Welcome to RootBase'}</span>
            <span className="text-base">{getSeasonalGreeting(userName || 'Farmer').emoji}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Link href="/notifications" className="relative">
            <div className="w-10 h-10 rounded-full bg-white/90 border border-slate-100 flex items-center justify-center hover:shadow-md transition-all">
              <Bell size={18} className="text-gray-600" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </div>
          </Link>

          {/* Date Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-slate-200 bg-white/90 hover:bg-white/90 flex items-center gap-2">
                <Calendar size={14} />
                <span className="text-sm">{dateFilter}</span>
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDateFilter('Today')}>Today</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateFilter('This Week')}>This Week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateFilter('This Month')}>This Month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateFilter('Last 7 Days')}>Last 7 Days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateFilter('This Season')}>This Season</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateFilter('This Year')}>This Year</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* KPI Cards - with trends */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-white border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 min-h-[150px]">
          <CardContent className="pt-5 pb-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">Total Income</p>
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp size={18} className="text-green-600" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">R{income.toFixed(2)}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                  <ArrowUpRight size={12} /> 18%
                </span>
                <span className="text-xs text-gray-400">vs last month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-white border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 min-h-[150px]">
          <CardContent className="pt-5 pb-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown size={18} className="text-red-500" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-red-500">R{expenses.toFixed(2)}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-medium text-red-500 flex items-center gap-1">
                  <ArrowUpRight size={12} /> 12%
                </span>
                <span className="text-xs text-gray-400">vs last month</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${isProfit ? 'from-emerald-50' : 'from-red-50'} to-white border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 min-h-[150px]`}>
          <CardContent className="pt-5 pb-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">Net {isProfit ? 'Profit' : 'Loss'}</p>
              <div className={`w-9 h-9 rounded-full ${isProfit ? 'bg-emerald-100' : 'bg-red-100'} flex items-center justify-center`}>
                <DollarSign size={18} className={isProfit ? 'text-emerald-600' : 'text-red-500'} />
              </div>
            </div>
            <div>
              <p className={`text-3xl font-bold ${isProfit ? 'text-emerald-600' : 'text-red-500'}`}>
                {isProfit ? '+' : '-'}R{Math.abs(net).toFixed(2)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-medium ${isProfit ? 'text-emerald-600' : 'text-red-500'} flex items-center gap-1`}>
                  {isProfit ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {netPercent.toFixed(1)}% margin
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 min-h-[150px]">
          <CardContent className="pt-5 pb-5 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">Active Crops</p>
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                <Leaf size={18} className="text-blue-600" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-600">{activeCrops}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400">In the ground</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weather Card - Immediately below KPI cards */}
      {weather && (
        <Card className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white overflow-hidden relative shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5"></div>
          <CardContent className="py-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Main weather info */}
              <div className="flex items-center gap-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-5xl font-bold">{weather.temp}°</span>
                    <span className="text-4xl">{getWeatherEmoji(weather.description)}</span>
                  </div>
                  <p className="text-[#D8F3DC] text-base capitalize font-medium">{weather.description}</p>
                  <p className="text-[#D8F3DC]/60 text-sm">Feels like {weather.feelsLike}°C</p>
                </div>

                {/* Weather details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                    <Droplets size={16} className="text-[#52B788]" />
                    <div>
                      <p className="text-[#D8F3DC] text-[10px]">Humidity</p>
                      <p className="font-semibold text-sm">{weather.humidity}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                    <Wind size={16} className="text-[#52B788]" />
                    <div>
                      <p className="text-[#D8F3DC] text-[10px]">Wind</p>
                      <p className="font-semibold text-sm">{weather.windSpeed} km/h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                    <Sunrise size={16} className="text-[#52B788]" />
                    <div>
                      <p className="text-[#D8F3DC] text-[10px]">Sunrise</p>
                      <p className="font-semibold text-sm">{new Date(weather.sunrise * 1000).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                    <Sunset size={16} className="text-[#52B788]" />
                    <div>
                      <p className="text-[#D8F3DC] text-[10px]">Sunset</p>
                      <p className="font-semibold text-sm">{new Date(weather.sunset * 1000).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Forecast and advice */}
              <div className="flex flex-col gap-3 w-full lg:w-auto">
                <div className="flex items-center gap-2">
                  {weather.forecast.slice(1, 4).map((day) => (
                    <div key={day.date} className="text-center bg-white/10 rounded-lg px-4 py-2 min-w-[60px]">
                      <p className="text-[#D8F3DC] text-[10px]">{day.dayName}</p>
                      <p className="text-lg my-1">{getWeatherEmoji(day.description)}</p>
                      <p className="text-xs font-medium">{day.tempMax}°/{day.tempMin}°</p>
                      {day.rainChance > 20 && (
                        <p className="text-[10px] text-blue-300">{day.rainChance}% rain</p>
                      )}
                    </div>
                  ))}
                </div>
                {weatherAdvice.length > 0 && (
                  <div className="bg-[#52B788]/20 rounded-lg px-4 py-2 border border-[#52B788]/30">
                    <p className="text-xs text-[#D8F3DC] flex items-center gap-2">
                      <Sprout size={14} className="text-[#52B788]" />
                      {weatherAdvice[0]}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <Card className="bg-white/90 backdrop-blur-sm border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
              <Activity size={16} className="text-[#2D6A4F]" />
              Income vs Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={v => `R${v}`} />
                <Tooltip
                  formatter={(v) => [`R${Number(v).toFixed(2)}`, '']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#52B788" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#F87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expenses Donut Chart */}
        <Card className="bg-white/90 backdrop-blur-sm border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
              <PiggyBank size={16} className="text-red-500" />
              Expense Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expensesByCategory.length === 0 ? (
              <div className="flex items-center justify-center h-[240px] text-gray-400 text-sm">
                No expenses recorded yet
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <div className="relative">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie
                        data={expensesByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="amount"
                      >
                        {expensesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`R${Number(v).toFixed(2)}`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                    <p className="text-xl font-bold text-[#1B4332]">R{expenses.toFixed(0)}</p>
                    <p className="text-[10px] text-gray-400">Total</p>
                  </div>
                </div>
                <div className="space-y-2 w-full md:w-auto">
                  {expensesByCategory.map(({ category, amount, color }) => {
                    const pct = expenses > 0 ? Math.round((amount / expenses) * 100) : 0
                    return (
                      <div key={category} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color || '#F87171' }} />
                        <div className="flex justify-between items-center w-full min-w-[120px]">
                          <span className="text-xs text-gray-600">{category}</span>
                          <span className="text-xs font-medium text-gray-800">{pct}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Three Column Layout: Transactions, Tasks, Journal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="bg-white/90 backdrop-blur-sm border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
              <DollarSign size={16} className="text-[#2D6A4F]" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <p className="text-sm font-medium text-gray-600">No transactions yet</p>
                <p className="text-xs text-gray-400 mt-1">Add your first transaction</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{t.icon || '💰'}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800 truncate">{t.description || t.category}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {t.type === 'income' ? 'Income' : 'Expense'}
                          </span>
                          <span className="text-xs text-gray-400">{t.date}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {t.type === 'income' ? '+' : '-'}R{Number(t.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
                <Link href="/finances/reports" className="block text-center text-xs text-[#2D6A4F] hover:underline pt-2">
                  View all →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <Card className="bg-white/90 backdrop-blur-sm border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <CheckSquare size={16} className="text-orange-500" />
                Today's Tasks
              </CardTitle>
              <span className="text-xs text-gray-400">{openTasks} open</span>
            </div>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <CheckSquare size={24} className="opacity-30" />
                </div>
                <p className="text-sm font-medium text-gray-600">No open tasks</p>
                <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
                <Link href="/tasks" className="mt-3 text-sm text-[#2D6A4F] hover:underline">Add a task →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.priority === 'urgent' ? 'bg-red-500' :
                          task.priority === 'high' ? 'bg-orange-500' :
                            task.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-300'
                        }`} />
                      <p className="text-sm text-gray-700 truncate">{task.title}</p>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_COLOURS[task.priority] || 'bg-gray-100 text-gray-600'}`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
                {tasks.length > 4 && (
                  <p className="text-xs text-gray-400 text-center">+{tasks.length - 4} more tasks</p>
                )}
                <Link href="/tasks" className="block text-center text-xs text-[#2D6A4F] hover:underline pt-2">
                  View all tasks →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Journal Entries */}
        <Card className="bg-white/90 backdrop-blur-sm border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
              <BookOpen size={16} className="text-purple-500" />
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
                {entries.slice(0, 3).map((entry) => (
                  <div key={entry.id} className="border-b border-gray-50 last:border-0 pb-3 last:pb-0 hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${ENTRY_TYPE_COLOURS[entry.entry_type] || 'bg-gray-100 text-gray-600'}`}>
                        {entry.entry_type}
                      </span>
                      <span className="text-xs text-gray-400">{entry.entry_date}</span>
                    </div>
                    {entry.title && <p className="text-sm font-medium text-gray-700">{entry.title}</p>}
                    <p className="text-xs text-gray-500 truncate mt-0.5">{entry.content}</p>
                  </div>
                ))}
                <Link href="/journal" className="block text-center text-xs text-[#2D6A4F] hover:underline pt-1">
                  View all entries →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - As cards with icons */}
      <div>
        <p className="text-base font-semibold text-gray-700 mb-4">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[
            { label: 'Add Expense', href: '/finances/expenses', icon: '💰', color: 'from-red-50 to-red-50/30', textColor: 'text-red-700' },
            { label: 'Add Income', href: '/finances/income', icon: '💵', color: 'from-green-50 to-green-50/30', textColor: 'text-green-700' },
            { label: 'Add Crop', href: '/crops', icon: '🌱', color: 'from-[#D8F3DC] to-[#D8F3DC]/30', textColor: 'text-[#1B4332]' },
            { label: 'Journal Entry', href: '/journal', icon: '📝', color: 'from-purple-50 to-purple-50/30', textColor: 'text-purple-700' },
            { label: 'Add Task', href: '/tasks', icon: '✅', color: 'from-orange-50 to-orange-50/30', textColor: 'text-orange-700' },
            { label: 'Documents', href: '/documents', icon: '📄', color: 'from-blue-50 to-blue-50/30', textColor: 'text-blue-700' },
          ].map(({ label, href, icon, color, textColor }) => (
            <Link key={href} href={href}>
              <div className={`bg-gradient-to-br ${color} border border-slate-100 rounded-xl p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer`}>
                <div className="text-2xl mb-1">{icon}</div>
                <p className={`text-sm font-medium ${textColor}`}>{label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}