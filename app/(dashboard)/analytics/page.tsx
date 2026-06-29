'use client'

import { useEffect, useState } from 'react'
import { BarChart2, TrendingUp, TrendingDown, Leaf, Package } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
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
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [activeCrops, setActiveCrops] = useState(0)
  const [inventoryItems, setInventoryItems] = useState(0)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [expensesByCategory, setExpensesByCategory] = useState<{category: string, amount: number}[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function fetchAnalytics() {
      const [incomeRes, expensesRes, cropsRes, inventoryRes] = await Promise.all([
        supabase.from('income').select('amount, date'),
        supabase.from('expenses').select('amount, date, category'),
        supabase.from('crops').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('inventory_items').select('id', { count: 'exact' }),
      ])

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
        catMap[r.category] = (catMap[r.category] || 0) + Number(r.amount)
      })
      const catArray = Object.entries(catMap)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6)
      setExpensesByCategory(catArray)

      setLoading(false)
    }

    fetchAnalytics()
  }, [])

  const net = totalIncome - totalExpenses
  const isProfit = net >= 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p className="text-sm">Loading analytics...</p>
      </div>
    )
  }

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