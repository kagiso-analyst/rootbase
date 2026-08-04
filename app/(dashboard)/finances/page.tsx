// app/(dashboard)/finances/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { BarChart2, TrendingUp, TrendingDown, DollarSign, RefreshCw, Sparkles } from 'lucide-react' // 👈 ADD Sparkles
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge' // 👈 ADD THIS
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context' // 👈 ADD THIS
import Link from 'next/link'

const sections = [
  {
    title: 'Expenses',
    description: 'Track everything you spend on your farm',
    href: '/finances/expenses',
    icon: TrendingDown,
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'hover:border-red-200',
  },
  {
    title: 'Income',
    description: 'Record your sales and other farm income',
    href: '/finances/income',
    icon: TrendingUp,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'hover:border-green-200',
  },
  {
    title: 'Reports',
    description: 'View your profit and loss, export CSV',
    href: '/finances/reports',
    icon: BarChart2,
    color: 'text-[#2D6A4F]',
    bg: 'bg-[#D8F3DC]',
    border: 'hover:border-[#52B788]',
  },
]

export default function FinancesPage() {
  // ===== STATE =====
  const [income, setIncome] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 👇 GET CURRENT FARM
  const { currentFarm, loading: farmLoading } = useFarm()

  const supabase = createClient()

  // ===== FETCH DATA =====
  async function fetchMonthData() {
    // 👇 CHECK IF FARM IS SELECTED
    if (!currentFarm) {
      setIncome(0)
      setExpenses(0)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUser(null)
        setIncome(0)
        setExpenses(0)
        setLoading(false)
        return
      }
      
      setUser(user)

      const now = new Date()
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      const [incomeRes, expensesRes] = await Promise.all([
        supabase
          .from('income')
          .select('amount')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id) // 👈 FILTER BY FARM
          .gte('date', firstOfMonth)
          .lte('date', endOfMonth),
        supabase
          .from('expenses')
          .select('amount')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id) // 👈 FILTER BY FARM
          .gte('date', firstOfMonth)
          .lte('date', endOfMonth),
      ])

      if (incomeRes.error) throw new Error('Failed to fetch income: ' + incomeRes.error.message)
      if (expensesRes.error) throw new Error('Failed to fetch expenses: ' + expensesRes.error.message)

      const totalInc = incomeRes.data?.reduce((s, r) => s + Number(r.amount), 0) || 0
      const totalExp = expensesRes.data?.reduce((s, r) => s + Number(r.amount), 0) || 0
      setIncome(totalInc)
      setExpenses(totalExp)
      
    } catch (err) {
      console.error('Month data fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load financial data. Please refresh the page.')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchMonthData()
  }, [currentFarm]) // 👈 REFETCH WHEN FARM CHANGES

  // ===== REFRESH HANDLER =====
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchMonthData()
  }

  const net = income - expenses
  const isProfit = net >= 0

  // ===== LOADING STATE =====
  if (farmLoading || (loading && !isRefreshing)) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">{farmLoading ? 'Loading farms...' : 'Loading finances...'}</p>
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
        <p className="text-sm text-gray-500">You need to be logged in to manage your finances.</p>
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
        <p className="text-sm text-gray-500">Please select a farm to manage your finances.</p>
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
          <div>
            <h1 className="text-2xl font-bold text-[#1B4332]">Finances</h1>
            <p className="text-gray-500 text-sm mt-1">Track every rand in and out of your farm</p>
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
      {/* Header with refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#1B4332]">Finances</h1>
            <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
              💰 {currentFarm.name}
            </Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Track every rand in and out of your farm
          </p>
        </div>
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

      {/* Navigation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {sections.map(({ title, description, href, icon: Icon, color, bg, border }) => (
          <Link key={href} href={href}>
            <Card className={`shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer h-full border-2 border-transparent ${border} hover:border-opacity-100`}>
              <CardHeader className="pb-2">
                <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-2 transition-transform group-hover:scale-105`}>
                  <Icon size={22} className={color} />
                </div>
                <CardTitle className="text-base font-semibold text-gray-800">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">{description}</p>
                <div className="mt-2 text-xs font-medium text-[#2D6A4F] opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to view →
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Monthly summary */}
      <Card className="shadow-sm border-0 bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-700">
            <div className="w-8 h-8 rounded-full bg-[#D8F3DC] flex items-center justify-center">
              <DollarSign size={16} className="text-[#2D6A4F]" />
            </div>
            This Month at a Glance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
              <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Income</p>
              <p className="text-2xl font-bold text-green-600">R{income.toFixed(2)}</p>
              <div className="mt-1 w-12 h-0.5 bg-green-200 mx-auto rounded-full"></div>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
              <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Expenses</p>
              <p className="text-2xl font-bold text-red-500">R{expenses.toFixed(2)}</p>
              <div className="mt-1 w-12 h-0.5 bg-red-200 mx-auto rounded-full"></div>
            </div>
            <div className={`bg-white rounded-xl p-4 text-center shadow-sm border ${isProfit ? 'border-green-200' : 'border-red-200'}`}>
              <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Net {isProfit ? 'Profit' : 'Loss'}</p>
              <p className={`text-2xl font-bold ${isProfit ? 'text-[#2D6A4F]' : 'text-red-500'}`}>
                {isProfit ? '+' : '-'}R{Math.abs(net).toFixed(2)}
              </p>
              <div className={`mt-1 w-12 h-0.5 ${isProfit ? 'bg-[#52B788]' : 'bg-red-200'} mx-auto rounded-full`}></div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-center">
            <div className="text-xs text-gray-400">
              <span className="font-medium text-gray-600">Transactions:</span> {income > 0 || expenses > 0 ? 'This month' : 'No transactions yet'}
            </div>
            <div className="text-xs text-gray-400">
              <span className="font-medium text-gray-600">Profit Margin:</span>{' '}
              <span className={`font-semibold ${isProfit ? 'text-[#2D6A4F]' : 'text-red-500'}`}>
                {income > 0 ? ((net / income) * 100).toFixed(1) : '0'}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}