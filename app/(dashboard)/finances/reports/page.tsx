'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, BarChart2,
  ArrowUpRight, ArrowDownRight, Calendar, Filter
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts'

type Transaction = {
  id: string
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number
  date: string
  buyer_name?: string
}

type MonthlySummary = {
  month: string
  income: number
  expenses: number
  profit: number
}

export default function FinancialReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 3)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([])

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [incomeRes, expensesRes] = await Promise.all([
        supabase.from('income').select('*').gte('date', startDate).lte('date', endDate).order('date', { ascending: false }),
        supabase.from('expenses').select('*').gte('date', startDate).lte('date', endDate).order('date', { ascending: false }),
      ])

      const incomeData: Transaction[] = (incomeRes.data || []).map(r => ({
        id: r.id,
        type: 'income' as const,
        category: r.category,
        description: r.description,
        amount: parseFloat(String(r.amount)) || 0,
        date: r.date,
        buyer_name: r.buyer_name,
      }))

      const expenseData: Transaction[] = (expensesRes.data || []).map(r => ({
        id: r.id,
        type: 'expense' as const,
        category: r.category,
        description: r.description,
        amount: parseFloat(String(r.amount)) || 0,
        date: r.date,
      }))

      const all = [...incomeData, ...expenseData].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      setTransactions(all)

      // Build monthly summary
      const monthMap: Record<string, { income: number; expenses: number }> = {}
      all.forEach(t => {
        const month = t.date.slice(0, 7)
        if (!monthMap[month]) monthMap[month] = { income: 0, expenses: 0 }
        if (t.type === 'income') monthMap[month].income += t.amount
        else monthMap[month].expenses += t.amount
      })

      const summary = Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({
          month: new Date(month + '-01').toLocaleString('default', { month: 'short', year: '2-digit' }),
          income: data.income,
          expenses: data.expenses,
          profit: data.income - data.expenses,
        }))

      setMonthlySummary(summary)
    } catch (err) {
      console.error('Finance error:', err)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => { fetchData() }, [fetchData])

  const income = transactions.filter(t => t.type === 'income')
  const expenses = transactions.filter(t => t.type === 'expense')
  const totalIncome = income.reduce((s, t) => s + t.amount, 0)
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0)
  const netProfit = totalIncome - totalExpenses
  const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0'
  const isProfit = netProfit >= 0

  const expensesByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {} as Record<string, number>)

  const incomeByCategory = income.reduce((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + i.amount
    return acc
  }, {} as Record<string, number>)

  const filtered = transactions.filter(t =>
    activeFilter === 'all' ? true : t.type === activeFilter
  )

  const PRESET_RANGES = [
    { label: 'This Month', days: 0, type: 'month' },
    { label: 'Last 3 Months', days: 90 },
    { label: 'Last 6 Months', days: 180 },
    { label: 'This Year', days: 0, type: 'year' },
    { label: 'All Time', days: 0, type: 'all' },
  ]

  function applyPreset(preset: typeof PRESET_RANGES[0]) {
    const today = new Date()
    const end = today.toISOString().split('T')[0]
    let start = ''

    if (preset.type === 'month') {
      start = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
    } else if (preset.type === 'year') {
      start = `${today.getFullYear()}-01-01`
    } else if (preset.type === 'all') {
      start = '2020-01-01'
    } else {
      const d = new Date()
      d.setDate(d.getDate() - (preset.days || 90))
      start = d.toISOString().split('T')[0]
    }

    setStartDate(start)
    setEndDate(end)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B4332]">Financial Reports</h1>
        <p className="text-gray-500 text-sm mt-1">
          Complete financial overview — all transactions, summaries and trends
        </p>
      </div>

      {/* Date range */}
      <Card className="shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">From</Label>
              <Input type="date" value={startDate}
                onChange={(e) => setStartDate((e.target as HTMLInputElement).value)}
                className="w-36" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">To</Label>
              <Input type="date" value={endDate}
                onChange={(e) => setEndDate((e.target as HTMLInputElement).value)}
                className="w-36" />
            </div>
            <Button className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white h-9" onClick={fetchData}>
              <Filter size={14} className="mr-1" /> Apply
            </Button>
            <div className="flex gap-2 flex-wrap">
              {PRESET_RANGES.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-[#2D6A4F] hover:text-[#2D6A4F] transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">Total Income</p>
              <ArrowUpRight size={16} className="text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">R{totalIncome.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">{income.length} transactions</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">Total Expenses</p>
              <ArrowDownRight size={16} className="text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-500">R{totalExpenses.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">{expenses.length} transactions</p>
          </CardContent>
        </Card>
        <Card className={`shadow-sm ${isProfit ? 'border-[#52B788]' : 'border-red-300'}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">Net {isProfit ? 'Profit' : 'Loss'}</p>
              <DollarSign size={16} className={isProfit ? 'text-[#2D6A4F]' : 'text-red-500'} />
            </div>
            <p className={`text-2xl font-bold ${isProfit ? 'text-[#2D6A4F]' : 'text-red-500'}`}>
              {isProfit ? '+' : '-'}R{Math.abs(netProfit).toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Margin: {profitMargin}%</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">Avg Monthly</p>
              <BarChart2 size={16} className="text-[#2D6A4F]" />
            </div>
            <p className="text-2xl font-bold text-[#1B4332]">
              R{monthlySummary.length > 0
                ? (netProfit / monthlySummary.length).toFixed(0)
                : '0'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Net profit/month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {monthlySummary.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Income vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlySummary}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R${v}`} />
                  <Tooltip formatter={(v) => `R${Number(v).toFixed(2)}`} />
                  <Bar dataKey="income" name="Income" fill="#52B788" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#F87171" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Profit / Loss Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlySummary}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R${v}`} />
                  <Tooltip formatter={(v) => `R${Number(v).toFixed(2)}`} />
                  <Line type="monotone" dataKey="profit" name="Net Profit"
                    stroke="#2D6A4F" strokeWidth={2} dot={{ fill: '#2D6A4F', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category breakdowns */}
      {(Object.keys(expensesByCategory).length > 0 || Object.keys(incomeByCategory).length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Object.keys(incomeByCategory).length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-600 flex items-center gap-2">
                  <TrendingUp size={14} /> Income by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(incomeByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amount]) => {
                    const pct = totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">{cat}</span>
                          <span className="font-medium text-green-600">R{amount.toFixed(2)} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="bg-green-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
              </CardContent>
            </Card>
          )}

          {Object.keys(expensesByCategory).length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-500 flex items-center gap-2">
                  <TrendingDown size={14} /> Expenses by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(expensesByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amount]) => {
                    const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">{cat}</span>
                          <span className="font-medium text-red-500">R{amount.toFixed(2)} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Transaction ledger */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar size={16} className="text-[#2D6A4F]" />
              Transaction Ledger
            </CardTitle>
            <div className="flex gap-2">
              {(['all', 'income', 'expense'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
                    activeFilter === f
                      ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                      : 'border-gray-200 text-gray-500 hover:border-[#2D6A4F]'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'income' ? 'Income' : 'Expenses'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <p className="text-sm">Loading transactions...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <BarChart2 size={36} className="mb-3 opacity-30" />
              <p className="text-sm">No transactions found for this period</p>
              <p className="text-xs mt-1">Try selecting a wider date range</p>
            </div>
          ) : (
            <>
              {/* Running balance header */}
              <div className="grid grid-cols-4 px-6 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <span>Date</span>
                <span className="col-span-2">Description</span>
                <span className="text-right">Amount</span>
              </div>

              {/* Calculate running balance */}
              {(() => {
                let balance = 0
                const withBalance = filtered.map(t => {
                  if (t.type === 'income') balance += t.amount
                  else balance -= t.amount
                  return { ...t, runningBalance: balance }
                }).reverse()

                return withBalance.reverse().map((t) => (
                  <div
                    key={t.id}
                    className={`grid grid-cols-4 px-6 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors text-sm`}
                  >
                    <div className="text-xs text-gray-400 self-center">{t.date}</div>
                    <div className="col-span-2 self-center">
                      <p className="font-medium text-gray-800 truncate">{t.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={`text-xs ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {t.category}
                        </Badge>
                        {t.buyer_name && (
                          <span className="text-xs text-gray-400">{t.buyer_name}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right self-center">
                      <p className={`font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                        {t.type === 'income' ? '+' : '-'}R{t.amount.toFixed(2)}
                      </p>
                      <p className={`text-xs mt-0.5 ${t.runningBalance >= 0 ? 'text-gray-400' : 'text-red-400'}`}>
                        Bal: R{t.runningBalance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              })()}

              {/* Totals footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-400">Total Income</p>
                    <p className="text-sm font-bold text-green-600">+R{totalIncome.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Total Expenses</p>
                    <p className="text-sm font-bold text-red-500">-R{totalExpenses.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Net {isProfit ? 'Profit' : 'Loss'}</p>
                    <p className={`text-sm font-bold ${isProfit ? 'text-[#2D6A4F]' : 'text-red-500'}`}>
                      {isProfit ? '+' : '-'}R{Math.abs(netProfit).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Income statement */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Income Statement</CardTitle>
          <p className="text-xs text-gray-400">{startDate} to {endDate}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">INCOME</span>
            </div>
            {Object.entries(incomeByCategory).sort((a,b) => b[1]-a[1]).map(([cat, amt]) => (
              <div key={cat} className="flex justify-between py-1.5 pl-4">
                <span className="text-sm text-gray-600">{cat}</span>
                <span className="text-sm text-green-600 font-medium">R{amt.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 border-t border-gray-200 font-semibold">
              <span className="text-sm">Total Income</span>
              <span className="text-sm text-green-600">R{totalIncome.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100 mt-3">
              <span className="text-sm font-semibold text-gray-700">EXPENSES</span>
            </div>
            {Object.entries(expensesByCategory).sort((a,b) => b[1]-a[1]).map(([cat, amt]) => (
              <div key={cat} className="flex justify-between py-1.5 pl-4">
                <span className="text-sm text-gray-600">{cat}</span>
                <span className="text-sm text-red-500 font-medium">R{amt.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 border-t border-gray-200 font-semibold">
              <span className="text-sm">Total Expenses</span>
              <span className="text-sm text-red-500">R{totalExpenses.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-3 border-t-2 border-gray-800 mt-2">
              <span className="text-base font-bold text-gray-800">NET {isProfit ? 'PROFIT' : 'LOSS'}</span>
              <span className={`text-base font-bold ${isProfit ? 'text-[#2D6A4F]' : 'text-red-500'}`}>
                R{Math.abs(netProfit).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-xs text-gray-400">Profit Margin</span>
              <span className={`text-xs font-semibold ${isProfit ? 'text-[#2D6A4F]' : 'text-red-500'}`}>
                {profitMargin}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}