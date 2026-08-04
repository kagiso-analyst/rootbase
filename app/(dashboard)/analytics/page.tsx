// app/(dashboard)/analytics/page.tsx

'use client'

import { useEffect, useState, useCallback } from 'react'
import { 
  BarChart2, TrendingUp, TrendingDown, Leaf, Package,
  DollarSign, Calendar, Download, RefreshCw, Sparkles,
  ArrowUpRight, ArrowDownRight, PiggyBank, Tractor,
  Calculator
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line,
  PieChart, Pie, Cell, Legend
} from 'recharts'

type MonthlyData = {
  month: string
  income: number
  expenses: number
  profit: number
}

type CategoryData = {
  category: string
  amount: number
  color?: string
}

const COLORS = ['#52B788', '#2D6A4F', '#1B4332', '#F4A261', '#E76F51', '#2A9D8F', '#E9C46A', '#F4A261']

export default function AnalyticsPage() {
  // ===== STATE =====
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [activeCrops, setActiveCrops] = useState(0)
  const [inventoryItems, setInventoryItems] = useState(0)
  const [livestockCount, setLivestockCount] = useState(0)
  const [openTasks, setOpenTasks] = useState(0)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [expensesByCategory, setExpensesByCategory] = useState<CategoryData[]>([])
  const [incomeByCategory, setIncomeByCategory] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 👇 GET CURRENT FARM
  const { currentFarm, loading: farmLoading } = useFarm()
  const supabase = createClient()

  // ===== FETCH ANALYTICS =====
  const fetchAnalytics = useCallback(async () => {
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
      
      setUser(user)

      const now = new Date()
      const sixMonthsAgo = new Date(now)
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      const startDate = sixMonthsAgo.toISOString().split('T')[0]
      const endDate = now.toISOString().split('T')[0]

      const [incomeRes, expensesRes, cropsRes, inventoryRes, livestockRes, tasksRes] = await Promise.all([
        supabase
          .from('income')
          .select('amount, date, category')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id) // 👈 FILTER BY FARM
          .gte('date', startDate)
          .lte('date', endDate),
        supabase
          .from('expenses')
          .select('amount, date, category')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id) // 👈 FILTER BY FARM
          .gte('date', startDate)
          .lte('date', endDate),
        supabase
          .from('crops')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id) // 👈 FILTER BY FARM
          .eq('status', 'active'),
        supabase
          .from('inventory_items')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id), // 👈 FILTER BY FARM
        supabase
          .from('livestock')
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
      ])

      // 👇 Check for errors
      if (incomeRes.error) throw new Error('Failed to fetch income: ' + incomeRes.error.message)
      if (expensesRes.error) throw new Error('Failed to fetch expenses: ' + expensesRes.error.message)
      if (cropsRes.error) throw new Error('Failed to fetch crops: ' + cropsRes.error.message)

      const incomeData = incomeRes.data || []
      const expensesData = expensesRes.data || []

      const totalInc = incomeData.reduce((sum, r) => sum + Number(r.amount), 0)
      const totalExp = expensesData.reduce((sum, r) => sum + Number(r.amount), 0)

      setTotalIncome(totalInc)
      setTotalExpenses(totalExp)
      setActiveCrops(cropsRes.count || 0)
      setInventoryItems(inventoryRes.count || 0)
      setLivestockCount(livestockRes.count || 0)
      setOpenTasks(tasksRes.count || 0)

      // Build monthly data for last 6 months
      const months: MonthlyData[] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const monthStr = d.toLocaleString('default', { month: 'short' })
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const prefix = `${year}-${month}`

        const monthIncome = incomeData
          .filter(r => r.date?.startsWith(prefix))
          .reduce((sum, r) => sum + Number(r.amount), 0)

        const monthExpenses = expensesData
          .filter(r => r.date?.startsWith(prefix))
          .reduce((sum, r) => sum + Number(r.amount), 0)

        months.push({
          month: monthStr,
          income: monthIncome,
          expenses: monthExpenses,
          profit: monthIncome - monthExpenses,
        })
      }
      setMonthlyData(months)

      // Expenses by category
      const expCatMap: Record<string, number> = {}
      expensesData.forEach(r => {
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
        .slice(0, 8)
      setExpensesByCategory(expCategories)

      // Income by category
      const incCatMap: Record<string, number> = {}
      incomeData.forEach(r => {
        if (r.category) {
          incCatMap[r.category] = (incCatMap[r.category] || 0) + Number(r.amount)
        }
      })
      const incCategories = Object.entries(incCatMap)
        .map(([category, amount], index) => ({ 
          category, 
          amount,
          color: COLORS[index % COLORS.length] 
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 8)
      setIncomeByCategory(incCategories)
      
    } catch (err) {
      console.error('Analytics fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics. Please try again.')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [currentFarm, supabase])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // ===== REFRESH HANDLER =====
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAnalytics()
  }

  const net = totalIncome - totalExpenses
  const isProfit = net >= 0
  const profitMargin = totalIncome > 0 ? ((net / totalIncome) * 100) : 0

  // ===== LOADING STATE =====
  if (farmLoading || (loading && !isRefreshing)) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">{farmLoading ? 'Loading farms...' : 'Loading analytics...'}</p>
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
        <p className="text-sm text-gray-500">You need to be logged in to see your analytics.</p>
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
        <p className="text-sm text-gray-500">Please select a farm to view analytics.</p>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#1B4332]">Analytics</h1>
            <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
              🌱 {currentFarm.name}
            </Badge>
          </div>
        </div>
        <Card className="shadow-sm border-red-200 bg-red-50">
          <CardContent className="py-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-500 text-lg">⚠️</span>
              </div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleRefresh}
            >
              <RefreshCw size={14} className="mr-2" /> Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ===== ACTUAL PAGE =====
  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#1B4332]">Analytics</h1>
          <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
            🌱 {currentFarm.name}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-0 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500">Total Income</p>
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp size={16} className="text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-green-600">R{totalIncome.toFixed(0)}</p>
            <p className="text-xs text-gray-400 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-gradient-to-br from-red-50 to-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500">Total Expenses</p>
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown size={16} className="text-red-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-red-500">R{totalExpenses.toFixed(0)}</p>
            <p className="text-xs text-gray-400 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className={`shadow-sm border-0 bg-gradient-to-br ${isProfit ? 'from-[#D8F3DC] to-white' : 'from-red-50 to-white'}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500">Net {isProfit ? 'Profit' : 'Loss'}</p>
              <div className={`w-8 h-8 rounded-full ${isProfit ? 'bg-[#D8F3DC]' : 'bg-red-100'} flex items-center justify-center`}>
                <DollarSign size={16} className={isProfit ? 'text-[#2D6A4F]' : 'text-red-500'} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${isProfit ? 'text-[#2D6A4F]' : 'text-red-500'}`}>
              {isProfit ? '+' : '-'}R{Math.abs(net).toFixed(0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Margin: {profitMargin.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500">Active Crops</p>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Leaf size={16} className="text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-600">{activeCrops}</p>
            <p className="text-xs text-gray-400 mt-1">In the ground</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Inventory Items', value: inventoryItems, icon: Package, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Livestock', value: livestockCount, icon: Tractor, color: 'text-purple-500', bg: 'bg-purple-50' },
          { label: 'Open Tasks', value: openTasks, icon: BarChart2, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Profit Margin', value: `${profitMargin.toFixed(1)}%`, icon: PiggyBank, color: 'text-[#2D6A4F]', bg: 'bg-[#D8F3DC]' },
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

      {/* Monthly chart */}
      {monthlyData.length > 0 && (
        <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Income vs Expenses — Last 6 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={v => `R${v}`} />
                <Tooltip 
                  formatter={(v) => [`R${Number(v).toFixed(2)}`, '']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#52B788" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#F87171" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Profit trend */}
      {monthlyData.length > 0 && (
        <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Profit / Loss Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={v => `R${v}`} />
                <Tooltip 
                  formatter={(v) => [`R${Number(v).toFixed(2)}`, 'Net Profit']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  name="Net Profit"
                  stroke="#2D6A4F" 
                  strokeWidth={3} 
                  dot={{ fill: '#2D6A4F', r: 4, strokeWidth: 2, stroke: '#fff' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Category breakdowns */}
      {(expensesByCategory.length > 0 || incomeByCategory.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Income by category */}
          {incomeByCategory.length > 0 && (
            <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-green-600 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <TrendingUp size={14} className="text-green-600" />
                  </div>
                  Income by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-56 overflow-y-auto pr-2">
                {incomeByCategory.map(({ category, amount, color }) => {
                  const pct = totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0
                  return (
                    <div key={category} className="group">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 font-medium truncate">{category}</span>
                        <span className="font-medium text-green-600">R{amount.toFixed(0)} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${pct}%`,
                            background: color || '#52B788'
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Expenses by category */}
          {expensesByCategory.length > 0 && (
            <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-red-500 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                    <TrendingDown size={14} className="text-red-500" />
                  </div>
                  Expenses by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-56 overflow-y-auto pr-2">
                {expensesByCategory.map(({ category, amount, color }) => {
                  const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
                  return (
                    <div key={category} className="group">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 font-medium truncate">{category}</span>
                        <span className="font-medium text-red-500">R{amount.toFixed(0)} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${pct}%`,
                            background: color || '#F87171'
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'View Reports', href: '/finances/reports', icon: BarChart2, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
          { label: 'Cost Calculator', href: '/analytics/costs', icon: Calculator, color: 'bg-[#D8F3DC] text-[#1B4332] hover:bg-[#52B788]/20' },
          { label: 'Export Data', href: '#', icon: Download, color: 'bg-gray-50 text-gray-600 hover:bg-gray-100' },
        ].map(({ label, href, icon: Icon, color }) => (
          <Link key={href} href={href}>
            <div className={`rounded-lg px-4 py-3 text-center text-sm font-medium transition-colors cursor-pointer ${color}`}>
              <Icon size={16} className="mx-auto mb-1" />
              {label}
            </div>
          </Link>
        ))}
      </div>

      {/* Insights card */}
      <Card className="shadow-sm border-0 bg-gradient-to-br from-[#D8F3DC]/20 to-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Sparkles size={16} className="text-[#2D6A4F]" />
            Farm Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {net > 0 ? (
              <p className="text-sm text-gray-600">
                ✅ Your farm is <span className="font-semibold text-[#2D6A4F]">profitable</span> with a 
                {' '}<span className="font-semibold">{profitMargin.toFixed(1)}%</span> margin. 
                {activeCrops > 0 && ` You have ${activeCrops} active crops generating value.`}
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                ⚠️ Your farm is currently at a <span className="font-semibold text-red-500">loss</span>. 
                Consider reviewing your expense categories to identify cost-saving opportunities.
              </p>
            )}
            {expensesByCategory.length > 0 && (
              <p className="text-sm text-gray-500">
                💡 Top expense category: <span className="font-medium">{expensesByCategory[0]?.category}</span> 
                {' '}(R{expensesByCategory[0]?.amount.toFixed(0)})
              </p>
            )}
            {incomeByCategory.length > 0 && (
              <p className="text-sm text-gray-500">
                📈 Top income source: <span className="font-medium">{incomeByCategory[0]?.category}</span> 
                {' '}(R{incomeByCategory[0]?.amount.toFixed(0)})
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}