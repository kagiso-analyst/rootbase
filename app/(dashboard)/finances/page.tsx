'use client'

import { useState, useEffect } from 'react'
import { BarChart2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const sections = [
  {
    title: 'Expenses',
    description: 'Track everything you spend on your farm',
    href: '/finances/expenses',
    icon: TrendingDown,
    color: 'text-red-500',
    bg: 'bg-red-50',
  },
  {
    title: 'Income',
    description: 'Record your sales and other farm income',
    href: '/finances/income',
    icon: TrendingUp,
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    title: 'Reports',
    description: 'View your profit and loss, export PDF',
    href: '/finances/reports',
    icon: BarChart2,
    color: 'text-[#2D6A4F]',
    bg: 'bg-[#D8F3DC]',
  },
]

export default function FinancesPage() {
  const [income, setIncome] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchMonthData() {
      const now = new Date()
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      const [incomeRes, expensesRes] = await Promise.all([
        supabase.from('income').select('amount').gte('date', firstOfMonth).lte('date', endOfMonth),
        supabase.from('expenses').select('amount').gte('date', firstOfMonth).lte('date', endOfMonth),
      ])

      const totalInc = incomeRes.data?.reduce((s, r) => s + Number(r.amount), 0) || 0
      const totalExp = expensesRes.data?.reduce((s, r) => s + Number(r.amount), 0) || 0
      setIncome(totalInc)
      setExpenses(totalExp)
      setLoading(false)
    }
    fetchMonthData()
  }, [])

  const net = income - expenses
  const isProfit = net >= 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B4332]">Finances</h1>
        <p className="text-gray-500 text-sm mt-1">
          Track every rand in and out of your farm
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {sections.map(({ title, description, href, icon: Icon, color, bg }) => (
          <Link key={href} href={href}>
            <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                  <Icon size={20} className={color} />
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">{description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign size={18} className="text-[#2D6A4F]" />
            This Month at a Glance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-sm text-gray-400">Loading...</div>
          ) : (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-400 mb-1">Income</p>
                <p className="text-xl font-bold text-green-600">R{income.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Expenses</p>
                <p className="text-xl font-bold text-red-500">R{expenses.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Net {isProfit ? 'Profit' : 'Loss'}</p>
                <p className={`text-xl font-bold ${isProfit ? 'text-[#2D6A4F]' : 'text-red-500'}`}>R{Math.abs(net).toFixed(2)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}