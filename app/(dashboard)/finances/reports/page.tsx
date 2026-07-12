'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, BarChart2,
  ArrowUpRight, ArrowDownRight, Calendar, Filter,
  Download, RefreshCw // 👈 ADD THESE
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link' // 👈 ADD THIS
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
  // ===== STATE =====
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null) // 👈 ADD THIS
  const [user, setUser] = useState<any>(null) // 👈 ADD THIS
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 3)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false) // 👈 ADD THIS

  const supabase = createClient()

  // ===== FETCH DATA =====
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUser(null)
        setTransactions([])
        setMonthlySummary([])
        setLoading(false)
        return
      }
      
      setUser(user)

      const [incomeRes, expensesRes] = await Promise.all([
        supabase
          .from('income')
          .select('*')
          .eq('user_id', user.id) // 👈 ADD USER CHECK!
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false }),
        supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id) // 👈 ADD USER CHECK!
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false }),
      ])

      // 👇 Check for errors
      if (incomeRes.error) throw new Error('Failed to fetch income: ' + incomeRes.error.message)
      if (expensesRes.error) throw new Error('Failed to fetch expenses: ' + expensesRes.error.message)

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
      setError(err instanceof Error ? err.message : 'Failed to load financial data. Please try again.')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [startDate, endDate, supabase])

  useEffect(() => { 
    fetchData() 
  }, [fetchData])

  // ===== REFRESH HANDLER =====
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
  }

  // ===== CALCULATIONS =====
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

  // ===== EXPORT CSV =====
  const handleExportCSV = () => {
    if (transactions.length === 0) return
    
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Buyer']
    const rows = filtered.map(t => [
      t.date,
      t.type,
      t.category,
      t.description,
      t.type === 'income' ? t.amount : -t.amount,
      t.buyer_name || ''
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financial_report_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // ===== LOADING STATE =====
  if (loading && !isRefreshing) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Loading financial data...</p>
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
        <p className="text-sm text-gray-500">You need to be logged in to view financial reports.</p>
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1B4332]">Financial Reports</h1>
            <p className="text-gray-500 text-sm mt-1">Complete financial overview</p>
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
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332]">Financial Reports</h1>
          <p className="text-gray-500 text-sm mt-1">
            Complete financial overview — all transactions, summaries and trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
            onClick={handleExportCSV}
            disabled={transactions.length === 0}
          >
            <Download size={14} className="mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            className="border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Date range */}
      <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500 font-medium">From</Label>
              <Input type="date" value={startDate}
                onChange={(e) => setStartDate((e.target as HTMLInputElement).value)}
                className="w-36 border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500 font-medium">To</Label>
              <Input type="date" value={endDate}
                onChange={(e) => setEndDate((e.target as HTMLInputElement).value)}
                className="w-36 border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]" />
            </div>
            <Button className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white h-9 shadow-sm" onClick={handleRefresh}>
              <Filter size={14} className="mr-1" /> Apply
            </Button>
            <div className="flex gap-2 flex-wrap">
              {PRESET_RANGES.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-[#2D6A4F] hover:text-[#2D6A4F] hover:bg-[#D8F3DC]/20 transition-all duration-200"
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
        <Card className="shadow-sm border-0 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500">Total Income</p>
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <ArrowUpRight size={16} className="text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-green-600">R{totalIncome.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">{income.length} transactions</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 bg-gradient-to-br from-red-50 to-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500">Total Expenses</p>
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <ArrowDownRight size={16} className="text-red-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-red-500">R{totalExpenses.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">{expenses.length} transactions</p>
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
              {isProfit ? '+' : '-'}R{Math.abs(netProfit).toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Margin: {profitMargin}%</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500">Avg Monthly</p>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <BarChart2 size={16} className="text-blue-600" />
              </div>
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
          <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Income vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlySummary}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={v => `R${v}`} />
                  <Tooltip 
                    formatter={(v) => [`R${Number(v).toFixed(2)}`, '']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                  />
                  <Bar dataKey="income" name="Income" fill="#52B788" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#F87171" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Profit / Loss Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlySummary}>
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
        </div>
      )}

      {/* Category breakdowns */}
      {(Object.keys(expensesByCategory).length > 0 || Object.keys(incomeByCategory).length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Object.keys(incomeByCategory).length > 0 && (
            <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-green-600 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <TrendingUp size={14} className="text-green-600" />
                  </div>
                  Income by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(incomeByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amount]) => {
                    const pct = totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0
                    return (
                      <div key={cat} className="group">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 font-medium">{cat}</span>
                          <span className="font-medium text-green-600">R{amount.toFixed(2)} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-green-500 h-1.5 rounded-full transition-all duration-500 group-hover:opacity-80" 
                            style={{ width: `${pct}%` }} 
                          />
                        </div>
                      </div>
                    )
                  })}
              </CardContent>
            </Card>
          )}

          {Object.keys(expensesByCategory).length > 0 && (
            <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-red-500 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                    <TrendingDown size={14} className="text-red-500" />
                  </div>
                  Expenses by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(expensesByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amount]) => {
                    const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
                    return (
                      <div key={cat} className="group">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 font-medium">{cat}</span>
                          <span className="font-medium text-red-500">R{amount.toFixed(2)} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-red-400 to-red-500 h-1.5 rounded-full transition-all duration-500 group-hover:opacity-80" 
                            style={{ width: `${pct}%` }} 
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

      {/* Transaction ledger */}
      <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-700">
              <Calendar size={16} className="text-[#2D6A4F]" />
              Transaction Ledger
              <Badge variant="outline" className="text-xs font-normal">
                {filtered.length} records
              </Badge>
            </CardTitle>
            <div className="flex gap-1 p-1 bg-gray-50 rounded-lg">
              {(['all', 'income', 'expense'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`text-xs px-3 py-1.5 rounded-md transition-all capitalize font-medium ${
                    activeFilter === f
                      ? 'bg-[#2D6A4F] text-white shadow-sm'
                      : 'text-gray-500 hover:text-[#2D6A4F] hover:bg-white'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'income' ? 'Income' : 'Expenses'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <BarChart2 size={24} className="opacity-30" />
              </div>
              <p className="text-sm font-medium">No transactions found</p>
              <p className="text-xs mt-1">Try selecting a wider date range</p>
            </div>
          ) : (
            <>
              {/* Running balance header */}
              <div className="grid grid-cols-4 px-6 py-2.5 bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                    className={`grid grid-cols-4 px-6 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors text-sm`}
                  >
                    <div className="text-xs text-gray-400 self-center font-mono">{t.date}</div>
                    <div className="col-span-2 self-center">
                      <p className="font-medium text-gray-800 truncate">{t.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={`text-xs font-medium ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {t.category}
                        </Badge>
                        {t.buyer_name && (
                          <span className="text-xs text-gray-400">• {t.buyer_name}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right self-center">
                      <p className={`font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                        {t.type === 'income' ? '+' : '-'}R{t.amount.toFixed(2)}
                      </p>
                      <p className={`text-xs mt-0.5 font-mono ${t.runningBalance >= 0 ? 'text-gray-400' : 'text-red-400'}`}>
                        Bal: R{t.runningBalance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              })()}

              {/* Totals footer */}
              <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center max-w-2xl mx-auto">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-400 font-medium">Total Income</p>
                    <p className="text-sm font-bold text-green-600">+R{totalIncome.toFixed(2)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-400 font-medium">Total Expenses</p>
                    <p className="text-sm font-bold text-red-500">-R{totalExpenses.toFixed(2)}</p>
                  </div>
                  <div className={`bg-white rounded-lg p-3 shadow-sm ${isProfit ? 'border-l-4 border-[#52B788]' : 'border-l-4 border-red-400'}`}>
                    <p className="text-xs text-gray-400 font-medium">Net {isProfit ? 'Profit' : 'Loss'}</p>
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
      <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-base font-semibold text-gray-700">Income Statement</CardTitle>
          <p className="text-xs text-gray-400 font-medium">{startDate} to {endDate}</p>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-1 max-w-2xl mx-auto">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">INCOME</span>
            </div>
            {Object.entries(incomeByCategory).sort((a,b) => b[1]-a[1]).map(([cat, amt]) => (
              <div key={cat} className="flex justify-between py-1.5 pl-4 hover:bg-gray-50 rounded transition-colors">
                <span className="text-sm text-gray-600">{cat}</span>
                <span className="text-sm text-green-600 font-medium">R{amt.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 border-t-2 border-green-200 mt-1 font-semibold">
              <span className="text-sm text-gray-700">Total Income</span>
              <span className="text-sm text-green-600">R{totalIncome.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-200 mt-4">
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">EXPENSES</span>
            </div>
            {Object.entries(expensesByCategory).sort((a,b) => b[1]-a[1]).map(([cat, amt]) => (
              <div key={cat} className="flex justify-between py-1.5 pl-4 hover:bg-gray-50 rounded transition-colors">
                <span className="text-sm text-gray-600">{cat}</span>
                <span className="text-sm text-red-500 font-medium">R{amt.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 border-t-2 border-red-200 mt-1 font-semibold">
              <span className="text-sm text-gray-700">Total Expenses</span>
              <span className="text-sm text-red-500">R{totalExpenses.toFixed(2)}</span>
            </div>

            <div className={`flex justify-between py-3 border-t-2 mt-4 px-4 rounded-lg ${isProfit ? 'bg-[#D8F3DC] border-[#52B788]' : 'bg-red-50 border-red-300'}`}>
              <span className={`text-base font-bold ${isProfit ? 'text-[#1B4332]' : 'text-red-700'}`}>
                NET {isProfit ? 'PROFIT' : 'LOSS'}
              </span>
              <span className={`text-base font-bold ${isProfit ? 'text-[#2D6A4F]' : 'text-red-500'}`}>
                R{Math.abs(netProfit).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between py-1 px-4">
              <span className="text-xs text-gray-400 font-medium">Profit Margin</span>
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