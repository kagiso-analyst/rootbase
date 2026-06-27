'use client'

import { BarChart2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ReportsPage() {
  const income = 0
  const expenses = 0
  const net = income - expenses
  const isProfit = net >= 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332]">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">
            Your farm financial summary
          </p>
        </div>
        <Button
          className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
          onClick={() => alert('PDF export coming soon!')}
        >
          Export PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
              <TrendingUp size={16} className="text-green-500" /> Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">R{income.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-red-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
              <TrendingDown size={16} className="text-red-400" /> Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">R{expenses.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className={`shadow-sm ${isProfit ? 'border-[#52B788]' : 'border-red-200'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
              <DollarSign size={16} className="text-[#2D6A4F]" /> Net {isProfit ? 'Profit' : 'Loss'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${isProfit ? 'text-[#2D6A4F]' : 'text-red-500'}`}>
              R{Math.abs(net).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart2 size={18} className="text-[#2D6A4F]" />
            Income Statement
          </CardTitle>
          <p className="text-xs text-gray-400">Add income and expenses to see your statement</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Gross Income</span>
              <span className="text-sm font-semibold text-green-600">R{income.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Total Expenses</span>
              <span className="text-sm font-semibold text-red-500">R{expenses.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-base font-bold text-gray-800">Net {isProfit ? 'Profit' : 'Loss'}</span>
              <span className={`text-base font-bold ${isProfit ? 'text-[#2D6A4F]' : 'text-red-500'}`}>
                R{Math.abs(net).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}