'use client'

import { useState, useEffect } from 'react'
import { BarChart2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

type ExpenseRow = { amount: number; category: string; description: string; date: string }
type IncomeRow = { amount: number; category: string; description: string; date: string; buyer_name: string }

export default function ReportsPage() {
  const [income, setIncome] = useState<IncomeRow[]>([])
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])

  const supabase = createClient()

  async function fetchReport() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const [incomeRes, expensesRes] = await Promise.all([
        supabase
          .from('income')
          .select('*')
          .eq('user_id', user?.id)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false }),
        supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user?.id)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false }),
      ])
      if (incomeRes.data) setIncome(incomeRes.data)
      if (expensesRes.data) setExpenses(expensesRes.data)
    } catch (err) {
      console.error('Report error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport() }, [])

  const totalIncome = income.reduce((sum, r) => sum + Number(r.amount), 0)
  const totalExpenses = expenses.reduce((sum, r) => sum + Number(r.amount), 0)
  const net = totalIncome - totalExpenses
  const isProfit = net >= 0

  const expensesByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount)
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332]">Financial Report</h1>
          <p className="text-gray-500 text-sm mt-1">Income statement for selected period</p>
        </div>
      </div>

      {/* Date range filter */}
      <Card className="shadow-sm">
        <CardContent className="pt-4">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input type="date" value={startDate}
                onChange={(e) => setStartDate((e.target as HTMLInputElement).value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input type="date" value={endDate}
                onChange={(e) => setEndDate((e.target as HTMLInputElement).value)} />
            </div>
            <Button className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white" onClick={fetchReport}>
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
              <TrendingUp size={16} className="text-green-500" /> Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">R{totalIncome.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">{income.length} transaction{income.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
              <TrendingDown size={16} className="text-red-400" /> Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">R{totalExpenses.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">{expenses.length} transaction{expenses.length !== 1 ? 's' : ''}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
              <DollarSign size={16} className="text-[#2D6A4F]" /> Net {isProfit ? 'Profit' : 'Loss'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${isProfit ? 'text-[#2D6A4F]' : 'text-red-500'}`}>
              R{Math.abs(net).toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Margin: {totalIncome > 0 ? Math.round((net / totalIncome) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Income statement */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart2 size={18} className="text-[#2D6A4F]" /> Income Statement
          </CardTitle>
          <p className="text-xs text-gray-400">{startDate} to {endDate}</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading report...</p>
          ) : (
            <div className="space-y-4">

              {/* Income section */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Income</p>
                {income.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">No income recorded for this period</p>
                ) : (
                  <div className="space-y-1">
                    {income.map((item, i) => (
                      <div key={i} className="flex justify-between py-1.5 border-b border-gray-50">
                        <div>
                          <p className="text-sm text-gray-700">{item.description}</p>
                          <p className="text-xs text-gray-400">{item.category}{item.buyer_name ? ` · ${item.buyer_name}` : ''} · {item.date}</p>
                        </div>
                        <p className="text-sm font-medium text-green-600">+R{Number(item.amount).toFixed(2)}</p>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 font-semibold">
                      <p className="text-sm text-gray-700">Total Income</p>
                      <p className="text-sm text-green-600">R{totalIncome.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200" />

              {/* Expenses by category */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Expenses by Category</p>
                {expenses.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">No expenses recorded for this period</p>
                ) : (
                  <div className="space-y-1">
                    {Object.entries(expensesByCategory)
                      .sort((a, b) => b[1] - a[1])
                      .map(([cat, amount]) => (
                        <div key={cat} className="flex justify-between py-1.5 border-b border-gray-50">
                          <p className="text-sm text-gray-700">{cat}</p>
                          <p className="text-sm font-medium text-red-500">−R{amount.toFixed(2)}</p>
                        </div>
                      ))}
                    <div className="flex justify-between py-2 font-semibold">
                      <p className="text-sm text-gray-700">Total Expenses</p>
                      <p className="text-sm text-red-500">R{totalExpenses.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t-2 border-gray-300" />

              {/* Net */}
              <div className="flex justify-between py-2">
                <p className="text-base font-bold text-gray-800">Net {isProfit ? 'Profit' : 'Loss'}</p>
                <p className={`text-base font-bold ${isProfit ? 'text-[#2D6A4F]' : 'text-red-500'}`}>
                  R{Math.abs(net).toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense detail */}
      {expenses.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Expense Detail</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {expenses.map((item, i) => (
                <div key={i} className="flex justify-between px-6 py-3">
                  <div>
                    <p className="text-sm text-gray-700">{item.description}</p>
                    <p className="text-xs text-gray-400">{item.category} · {item.date}</p>
                  </div>
                  <p className="text-sm font-medium text-red-500">−R{Number(item.amount).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}