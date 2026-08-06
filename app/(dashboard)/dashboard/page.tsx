// app/(dashboard)/dashboard/page.tsx

'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, Leaf, CheckSquare,
  BarChart2, Calendar, ArrowUpRight, ArrowDownRight,
  Bell, Cloud, BookOpen, Package, Wrench, FileText, Plus,
  Sprout, PiggyBank, Truck, Users, ShoppingBag, Briefcase,
  Droplets, Sun, Wind, Thermometer, Clock, AlertCircle,
  LayoutDashboard, Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context'
import { getSeasonalGreeting, cn } from '@/lib/utils'
import Link from 'next/link'
import { fetchWeather, getWeatherEmoji, type WeatherData } from '@/lib/weather'
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
} from 'recharts'

const COLORS = ['#2D6A4F', '#52B788', '#1B4332', '#F4A261', '#E76F51', '#E9C46A', '#2A9D8F', '#F4A261']

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
}

// Transaction icons based on category
const getTransactionIcon = (category: string, type: 'income' | 'expense') => {
  const icons: Record<string, any> = {
    'Crop Sales': Sprout,
    'Livestock Sales': Users,
    'Wool / Fibre': ShoppingBag,
    'Eggs / Dairy': ShoppingBag,
    'Contract Work': Briefcase,
    'Government Grant': PiggyBank,
    'Insurance Payout': PiggyBank,
    'Seed': Sprout,
    'Fertiliser': Droplets,
    'Chemicals / Sprays': Droplets,
    'Labour': Users,
    'Fuel': Truck,
    'Equipment': Wrench,
    'Transport': Truck,
    'Irrigation': Droplets,
    'Packaging': Package,
    'Veterinary': Briefcase,
    'Feed': ShoppingBag,
    'Repairs': Wrench,
    'Insurance': PiggyBank,
  }
  return icons[category] || (type === 'income' ? TrendingUp : TrendingDown)
}

export default function DashboardPage() {
  // ===== AUTH STATE =====
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
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
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [expensesByCategory, setExpensesByCategory] = useState<CategoryData[]>([])
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [greeting, setGreeting] = useState('')
  const [userPlan, setUserPlan] = useState('free')
  const [prevIncome, setPrevIncome] = useState(0)
  const [prevExpenses, setPrevExpenses] = useState(0)

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
          
          // Get user plan
          const { data: profile } = await supabase
            .from('profiles')
            .select('plan')
            .eq('user_id', user.id)
            .maybeSingle()
          if (profile) {
            setUserPlan(profile.plan || 'free')
          }
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
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthStart = lastMonth.toISOString().split('T')[0]
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]

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
        // Active crops
        supabase
          .from('crops')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
          .eq('status', 'active'),
        // Open tasks
        supabase
          .from('tasks')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
          .neq('status', 'done'),
        // Tasks list
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
          .neq('status', 'done')
          .order('created_at', { ascending: false })
          .limit(5),
        // Journal entries
        supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
          .order('created_at', { ascending: false })
          .limit(3),
        // Recent income
        supabase
          .from('income')
          .select('*')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
          .order('date', { ascending: false })
          .limit(5),
        // Recent expenses
        supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
          .order('date', { ascending: false })
          .limit(5),
        // Previous month income for trend
        supabase
          .from('income')
          .select('amount')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
          .gte('date', lastMonthStart)
          .lte('date', lastMonthEnd),
        // Previous month expenses for trend
        supabase
          .from('expenses')
          .select('amount')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
          .gte('date', lastMonthStart)
          .lte('date', lastMonthEnd),
      ])

      if (incomeRes.error) throw new Error('Failed to fetch income: ' + incomeRes.error.message)
      if (expensesRes.error) throw new Error('Failed to fetch expenses: ' + expensesRes.error.message)
      if (cropsRes.error) throw new Error('Failed to fetch crops: ' + cropsRes.error.message)

      const totalIncome = incomeRes.data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0
      const totalExpenses = expensesRes.data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0
      const prevIncomeTotal = prevIncomeRes.data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0
      const prevExpensesTotal = prevExpensesRes.data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0

      setIncome(totalIncome)
      setExpenses(totalExpenses)
      setPrevIncome(prevIncomeTotal)
      setPrevExpenses(prevExpensesTotal)
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
        })
      }
      setMonthlyData(weekData)

      // Expenses by category
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
        ...(recentIncomeRes.data || []).map(r => ({ ...r, type: 'income' as const })),
        ...(recentExpensesRes.data || []).map(r => ({ ...r, type: 'expense' as const })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)

      setRecentTransactions(transactions)

      // Fetch weather
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
  const incomeGrowth = prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : 0
  const expenseGrowth = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0
  const prevNet = prevIncome - prevExpenses
  const netGrowth = prevNet !== 0 ? ((net - prevNet) / Math.abs(prevNet)) * 100 : 0

  function getPlanBadge(plan: string) {
    const badges: Record<string, { label: string; color: string }> = {
      free: { label: 'Free Plan', color: 'bg-gray-100 text-gray-600' },
      starter: { label: 'Starter', color: 'bg-blue-100 text-blue-700' },
      pro: { label: 'Pro', color: 'bg-purple-100 text-purple-700' },
      business: { label: 'Business', color: 'bg-amber-100 text-amber-700' },
    }
    return badges[plan] || badges.free
  }

  const planBadge = getPlanBadge(userPlan)

  // ===== LOADING STATE =====
  if (!authChecked || farmLoading || loading) {
    return (
      <div className="space-y-6 px-4 sm:px-0">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse mb-3" />
              <div className="h-8 w-28 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-xl p-6 border border-gray-100">
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
      <div className="space-y-6 px-4 sm:px-0">
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
    <div className="space-y-6 px-4 sm:px-0">

      {/* Header with plan badge */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-[#1B4332]">Farm Dashboard</h1>
          <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
            {currentFarm.name}
          </Badge>
          <Badge className={cn(
            "text-xs font-medium",
            planBadge.color
          )}>
            {planBadge.label}
          </Badge>
        </div>
        <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
          <span>{greeting || 'Good morning'} 👋</span>
        </p>
        <p className="text-sm text-gray-400">Here's what's happening on your farm today.</p>
      </div>

      {/* KPI Cards - With trend percentages */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-500">Total Income</p>
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp size={16} className="text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-green-600">R{income.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">
              This month {incomeGrowth >= 0 ? '↑' : '↓'} {Math.abs(incomeGrowth).toFixed(1)}% vs last month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown size={16} className="text-red-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-red-500">R{expenses.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">
              This month {expenseGrowth >= 0 ? '↑' : '↓'} {Math.abs(expenseGrowth).toFixed(1)}% vs last month
            </p>
          </CardContent>
        </Card>

        <Card className={`shadow-sm border-0 bg-white hover:shadow-md transition-shadow`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-500">Net {isProfit ? 'Profit' : 'Loss'}</p>
              <div className={`w-8 h-8 rounded-full ${isProfit ? 'bg-[#D8F3DC]' : 'bg-red-100'} flex items-center justify-center`}>
                <DollarSign size={16} className={isProfit ? 'text-[#2D6A4F]' : 'text-red-500'} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${isProfit ? 'text-[#2D6A4F]' : 'text-red-500'}`}>
              {isProfit ? '+' : '-'}R{Math.abs(net).toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              This month {netGrowth >= 0 ? '↑' : '↓'} {Math.abs(netGrowth).toFixed(1)}% vs last month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-500">Active Crops</p>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Leaf size={16} className="text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-600">{activeCrops}</p>
            <p className="text-xs text-gray-400 mt-1">In the ground</p>
          </CardContent>
        </Card>
      </div>

      {/* Open Tasks Card */}
      <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <CheckSquare size={20} className="text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Open Tasks</p>
                <p className="text-2xl font-bold text-[#1B4332]">{openTasks}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{openTasks} tasks pending</span>
              <Link href="/tasks" className="text-sm text-[#2D6A4F] hover:underline">View all →</Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weather Card */}
{weather ? (
  <Card className="shadow-sm bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white overflow-hidden relative">
    <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5"></div>
    <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5"></div>
    <CardContent className="py-4 relative z-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-4xl font-bold">{weather.temp}°C</p>
            <p className="text-[#D8F3DC] text-sm capitalize mt-0.5">{weather.description}</p>
          </div>
          <div className="text-4xl">{getWeatherEmoji(weather.description)}</div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm w-full md:w-auto">
          <div className="text-center bg-white/10 rounded-lg px-3 py-2">
            <p className="text-[#D8F3DC] text-xs">Humidity</p>
            <p className="font-semibold">{weather.humidity}%</p>
          </div>
          <div className="text-center bg-white/10 rounded-lg px-3 py-2">
            <p className="text-[#D8F3DC] text-xs">Wind</p>
            <p className="font-semibold">{weather.windSpeed} km/h</p>
          </div>
          <div className="text-center bg-white/10 rounded-lg px-3 py-2">
            <p className="text-[#D8F3DC] text-xs">Feels like</p>
            <p className="font-semibold">{weather.feelsLike}°C</p>
          </div>
          <div className="text-center bg-white/10 rounded-lg px-3 py-2">
            <p className="text-[#D8F3DC] text-xs">Location</p>
            <p className="font-semibold">{weather.city}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {weather.forecast?.slice(1, 4).map((day) => (
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
) : (
  /* Fallback weather card while loading */
  <Card className="shadow-sm bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white overflow-hidden relative opacity-70">
    <CardContent className="py-4">
      <div className="flex items-center justify-center gap-4">
        <div className="animate-pulse flex items-center gap-4">
          <div className="w-16 h-16 bg-white/10 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-8 w-24 bg-white/10 rounded"></div>
            <div className="h-4 w-32 bg-white/10 rounded"></div>
          </div>
        </div>
        <div className="text-sm text-[#D8F3DC]/60">Loading weather...</div>
      </div>
    </CardContent>
  </Card>
)}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Income vs Expenses Chart */}
        <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
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
                <Bar dataKey="income" name="Income" fill="#52B788" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#F87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expenses Breakdown Pie Chart */}
        <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
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

      {/* Recent Transactions */}
      <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
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
              {recentTransactions.map((t, i) => {
                const Icon = getTransactionIcon(t.category, t.type)
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                        <Icon size={16} className={t.type === 'income' ? 'text-green-600' : 'text-red-500'} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-800">{t.description || t.category}</p>
                          <Badge className={`text-xs ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {t.type === 'income' ? 'Income' : 'Expense'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400">{t.date}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {t.type === 'income' ? '+' : '-'}R{Number(t.amount).toFixed(2)}
                    </span>
                  </div>
                )
              })}
              <Link href="/finances/reports" className="block text-center text-xs text-[#2D6A4F] hover:underline pt-2">
                View all →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two Column: Tasks and Journal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Tasks */}
        <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
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
                {tasks.slice(0, 4).map((task) => {
                  const priorityColors: Record<string, string> = {
                    urgent: 'bg-red-100 text-red-700',
                    high: 'bg-orange-100 text-orange-700',
                    medium: 'bg-blue-100 text-blue-700',
                    low: 'bg-gray-100 text-gray-600',
                  }
                  return (
                    <div key={task.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.priority === 'urgent' ? 'bg-red-500' :
                            task.priority === 'high' ? 'bg-orange-500' :
                              task.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-300'
                          }`} />
                        <p className="text-sm text-gray-700 truncate">{task.title}</p>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${priorityColors[task.priority] || 'bg-gray-100 text-gray-600'}`}>
                        {task.priority}
                      </span>
                    </div>
                  )
                })}
                <Link href="/tasks" className="block text-center text-xs text-[#2D6A4F] hover:underline pt-2">
                  Add new task →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Journal Entries */}
        <Card className="shadow-sm border-0 bg-white hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
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
                {entries.slice(0, 3).map((entry) => {
                  const entryColors: Record<string, string> = {
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
                  return (
                    <div key={entry.id} className="border-b border-gray-50 last:border-0 pb-3 last:pb-0 hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${entryColors[entry.entry_type] || 'bg-gray-100 text-gray-600'}`}>
                          {entry.entry_type}
                        </span>
                        <span className="text-xs text-gray-400">{entry.entry_date}</span>
                      </div>
                      {entry.title && <p className="text-sm font-medium text-gray-700">{entry.title}</p>}
                      <p className="text-xs text-gray-500 truncate mt-0.5">{entry.content}</p>
                    </div>
                  )
                })}
                <Link href="/journal" className="block text-center text-xs text-[#2D6A4F] hover:underline pt-1">
                  View all entries →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { label: 'Add Expense', href: '/finances/expenses', icon: TrendingDown, color: 'bg-red-50 text-red-700 hover:bg-red-100' },
            { label: 'Add Income', href: '/finances/income', icon: TrendingUp, color: 'bg-green-50 text-green-700 hover:bg-green-100' },
            { label: 'Add Crop', href: '/crops', icon: Leaf, color: 'bg-[#D8F3DC] text-[#1B4332] hover:bg-[#52B788]/20' },
            { label: 'Journal Entry', href: '/journal', icon: BookOpen, color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
            { label: 'Add Task', href: '/tasks', icon: CheckSquare, color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
            { label: 'Documents', href: '/documents', icon: FileText, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
          ].map(({ label, href, icon: Icon, color }) => (
            <Link key={href} href={href}>
              <div className={`rounded-lg px-4 py-3 text-center text-sm font-medium transition-colors cursor-pointer ${color}`}>
                <Icon size={16} className="mx-auto mb-1" />
                {label}
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}