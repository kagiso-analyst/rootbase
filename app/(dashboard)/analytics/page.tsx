'use client'

import { useEffect, useState } from 'react'
import { BarChart2, TrendingUp, TrendingDown, Leaf, Package } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button' // 👈 ADD THIS
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link' // 👈 ADD THIS
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from 'recharts'

type MonthlyData = {
  month: string
  income: number
  expenses: number
  profit: number
}

export default function AnalyticsPage() {
  // ===== STATE =====
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [activeCrops, setActiveCrops] = useState(0)
  const [inventoryItems, setInventoryItems] = useState(0)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [expensesByCategory, setExpensesByCategory] = useState<{category: string, amount: number}[]>([])
  const [loading, setLoading] = useState(true) // ✅ Already have this
  const [error, setError] = useState<string | null>(null) // 👈 ADD THIS
  const [user, setUser] = useState<any>(null) // 👈 ADD THIS

  const supabase = createClient()

  // ===== FETCH FUNCTION WITH PROPER ERROR HANDLING =====
  async function fetchAnalytics() {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUser(null)
        setLoading(false)
        return
      }
      
      setUser(user) // ✅ Save user

      const [incomeRes, expensesRes, cropsRes, inventoryRes] = await Promise.all([
        supabase
          .from('income')
          .select('amount, date')
          .eq('user_id', user.id),
        supabase
          .from('expenses')
          .select('amount, date, category')
          .eq('user_id', user.id),
        supabase
          .from('crops')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('status', 'active'),
        supabase
          .from('inventory_items')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id),
      ])

      // ✅ Check for errors
      if (incomeRes.error) throw new Error('Failed to fetch income: ' + incomeRes.error.message)
      if (expensesRes.error) throw new Error('Failed to fetch expenses: ' + expensesRes.error.message)
      if (cropsRes.error) throw new Error('Failed to fetch crops: ' + cropsRes.error.message)
      if (inventoryRes.error) throw new Error('Failed to fetch inventory: ' + inventoryRes.error.message)

      const incomeData = incomeRes.data || []
      const expensesData = expensesRes.data || []

      const totalInc = incomeData.reduce((sum, r) => sum + Number(r.amount), 0)
      const totalExp = expensesData.reduce((sum, r) => sum + Number(r.amount), 0)

      setTotalIncome(totalInc)
      setTotalExpenses(totalExp)
      setActiveCrops(cropsRes.count || 0)
      setInventoryItems(inventoryRes.count || 0)

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
      const catMap: Record<string, number> = {}
      expensesData.forEach(r => {
        if (r.category) {
          catMap[r.category] = (catMap[r.category] || 0) + Number(r.amount)
        }
      })
      const catArray = Object.entries(catMap)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6)
      setExpensesByCategory(catArray)
      
    } catch (err) {
      console.error('Analytics fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const net = totalIncome - totalExpenses
  const isProfit = net >= 0

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Loading analytics...</p>
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

  // ===== ERROR STATE =====
  if (error) {
    return (
      <Card className="shadow-sm border-red-200 bg-red-50">
        <CardContent className="py-4 px-6">
          <p className="text-sm text-red-700">❌ {error}</p>
          <Button 
            className="mt-3 bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
            onClick={() => fetchAnalytics()}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  // ===== ACTUAL PAGE CONTENT =====
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B4332]">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Farm performance overview</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-gray-500 flex items-center gap-2">
              <TrendingUp size={14} className="text-green-500" /> Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">R{totalIncome.toFixed(0)}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-gray-500 flex items-center gap-2">
              <TrendingDown size={14} className="text-red-500" /> Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">R{totalExpenses.toFixed(0)}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-gray-500 flex items-center gap-2">
              <BarChart2 size={14} className="text-[#2D6A4F]" /> Net {isProfit ? 'Profit' : 'Loss'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${isProfit ? 'text-[#2D6A4F]' : 'text-red-500'}`}>
              R{Math.abs(net).toFixed(0)}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-gray-500 flex items-center gap-2">
              <Leaf size={14} className="text-[#2D6A4F]" /> Active Crops
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[#2D6A4F]">{activeCrops}</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly income vs expenses chart */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Income vs Expenses — Last 6 Months</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.every(d => d.income === 0 && d.expenses === 0) ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <BarChart2 size={36} className="mb-3 opacity-30" />
              <p className="text-sm">Add income and expenses to see your chart</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(v) => `R${v}`} />
                <Tooltip formatter={(value) => [`R${Number(value).toFixed(2)}`, '']} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#52B788" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#F87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Profit trend */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Profit Trend — Last 6 Months</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.every(d => d.profit === 0) ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <TrendingUp size={36} className="mb-3 opacity-30" />
              <p className="text-sm">Add income and expenses to see your profit trend</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(v) => `R${v}`} />
                <Tooltip formatter={(value) => [`R${Number(value).toFixed(2)}`, 'Net Profit']} />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Net Profit"
                  stroke="#2D6A4F"
                  strokeWidth={2}
                  dot={{ fill: '#2D6A4F', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Expenses by category */}
      {expensesByCategory.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Top Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expensesByCategory.map(({ category, amount }) => {
                const percent = totalExpenses > 0
                  ? Math.round((amount / totalExpenses) * 100)
                  : 0
                return (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">{category}</span>
                      <span className="text-gray-500">R{amount.toFixed(0)} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-[#52B788] h-2 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Farm summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-4 text-center">
            <Leaf size={24} className="text-[#2D6A4F] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#2D6A4F]">{activeCrops}</p>
            <p className="text-xs text-gray-400 mt-1">Active Crops</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-4 text-center">
            <Package size={24} className="text-[#2D6A4F] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#2D6A4F]">{inventoryItems}</p>
            <p className="text-xs text-gray-400 mt-1">Inventory Items</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}