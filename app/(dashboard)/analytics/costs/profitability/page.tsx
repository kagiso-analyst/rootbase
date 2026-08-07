// app/(dashboard)/analytics/profitability/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Leaf,
  RefreshCw,
  Download,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft
} from 'lucide-react'
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
  Legend
} from 'recharts'

const COLORS = ['#52B788', '#2D6A4F', '#1B4332', '#F4A261', '#E76F51', '#2A9D8F']

type CropProfitability = {
  crop_name: string
  total_income: number
  total_expenses: number
  profit: number
  margin: number
  area_planted_ha: number
  yield_kg: number
}

export default function ProfitabilityPage() {
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<CropProfitability[]>([])
  const [totalProfit, setTotalProfit] = useState(0)
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const supabase = createClient()
  const { currentFarm, loading: farmLoading } = useFarm()

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setAuthChecked(true)
    }
    checkAuth()
  }, [supabase])

  const fetchData = useCallback(async () => {
    if (!currentFarm || !user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Fetch all crops
      const { data: crops, error: cropsError } = await supabase
        .from('crops')
        .select('*')
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)

      if (cropsError) throw cropsError

      const profitability: CropProfitability[] = []

      for (const crop of crops || []) {
        // Fetch income for this crop (if we have crop_name in income)
        const { data: incomeData } = await supabase
          .from('income')
          .select('amount')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
          .ilike('description', `%${crop.crop_name}%`)

        // Fetch expenses for this crop (if we have crop_name in expenses)
        const { data: expenseData } = await supabase
          .from('expenses')
          .select('amount')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
          .ilike('description', `%${crop.crop_name}%`)

        const totalIncome = incomeData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0
        const totalExpenses = expenseData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0
        const profit = totalIncome - totalExpenses

        profitability.push({
          crop_name: crop.crop_name,
          total_income: totalIncome,
          total_expenses: totalExpenses,
          profit: profit,
          margin: totalIncome > 0 ? (profit / totalIncome) * 100 : 0,
          area_planted_ha: crop.area_planted_ha || 0,
          yield_kg: crop.actual_yield_kg || 0,
        })
      }

      // Sort by profit descending
      profitability.sort((a, b) => b.profit - a.profit)

      setData(profitability)
      setTotalProfit(profitability.reduce((sum, c) => sum + c.profit, 0))
      setTotalIncome(profitability.reduce((sum, c) => sum + c.total_income, 0))
      setTotalExpenses(profitability.reduce((sum, c) => sum + c.total_expenses, 0))
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to load profitability data')
    } finally {
      setLoading(false)
    }
  }, [currentFarm, user, supabase])

  useEffect(() => {
    if (authChecked && user) {
      fetchData()
    }
  }, [authChecked, user, fetchData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (!authChecked || farmLoading || loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Loading profitability data...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">Please Log In</h2>
        <p className="text-sm text-gray-500">You need to be logged in to view profitability.</p>
        <Link href="/login">
          <Button className="mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            Go to Login
          </Button>
        </Link>
      </div>
    )
  }

  if (!currentFarm) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="text-5xl mb-4">🏠</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">No Farm Selected</h2>
        <p className="text-sm text-gray-500">Please select a farm to view profitability.</p>
        <Link href="/settings">
          <Button className="mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            Go to Settings
          </Button>
        </Link>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 px-4 sm:px-0">
        <div className="flex items-center gap-3">
          <Link href="/analytics">
            <Button variant="ghost" size="icon">
              <ChevronLeft size={18} />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-[#1B4332]">Crop Profitability</h1>
        </div>
        <Card className="shadow-sm border-red-200 bg-red-50">
          <CardContent className="py-4 px-6 flex items-center justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <Button onClick={fetchData} className="bg-red-600 hover:bg-red-700 text-white">
              <RefreshCw size={14} className="mr-2" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/analytics">
          <Button variant="ghost" size="icon">
            <ChevronLeft size={18} />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-[#1B4332]">Crop Profitability</h1>
            <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
              {currentFarm.name}
            </Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Analyze which crops are making you money
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-sm border-0 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-gray-400 font-medium">Total Profit</p>
            <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {totalProfit >= 0 ? '+' : '-'}{formatCurrency(Math.abs(totalProfit))}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-gray-400 font-medium">Total Income</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 bg-gradient-to-br from-red-50 to-white">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-gray-400 font-medium">Total Expenses</p>
            <p className="text-2xl font-bold text-red-500">{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {data.length > 0 && (
        <Card className="shadow-sm border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Profit by Crop
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="crop_name" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={v => `R${v}`} />
                <Tooltip
                  formatter={(v) => [`R${Number(v).toFixed(0)}`, '']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                />
                <Bar dataKey="profit" name="Profit" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#52B788' : '#F87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      {data.length === 0 ? (
        <Card className="shadow-sm border-0 bg-gradient-to-br from-[#D8F3DC]/20 to-white">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <BarChart3 size={48} className="text-[#2D6A4F] opacity-30 mb-4" />
            <p className="text-sm font-medium text-gray-600">No crop data available</p>
            <p className="text-xs text-gray-400 mt-1">Add crops and financial data to see profitability</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-0">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                      Crop
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                      Income
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                      Expenses
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                      Profit
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                      Margin
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                      Area (ha)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((crop, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        <div className="flex items-center gap-2">
                          <Leaf size={14} className="text-[#2D6A4F]" />
                          {crop.crop_name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-green-600">
                        {formatCurrency(crop.total_income)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-500">
                        {formatCurrency(crop.total_expenses)}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right font-semibold ${crop.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {crop.profit >= 0 ? '+' : '-'}{formatCurrency(Math.abs(crop.profit))}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${crop.margin >= 20 ? 'text-green-600' : crop.margin >= 0 ? 'text-orange-500' : 'text-red-500'}`}>
                        {crop.margin.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500">
                        {crop.area_planted_ha || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}