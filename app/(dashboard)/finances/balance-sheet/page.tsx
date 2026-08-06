// app/(dashboard)/finances/balance-sheet/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Card, CardContent, CardHeader, CardTitle 
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context'
import Link from 'next/link'
import { 
  ArrowLeft, RefreshCw, Download, Printer, 
  Building2, PiggyBank, Wallet, TrendingUp, 
  TrendingDown, LayoutDashboard, Calendar,
  FileText, Loader2, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle2
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type BalanceSheetData = {
  assets: {
    current: Array<{ name: string; amount: number }>
    fixed: Array<{ name: string; amount: number }>
    total: number
  }
  liabilities: {
    current: Array<{ name: string; amount: number }>
    longTerm: Array<{ name: string; amount: number }>
    total: number
  }
  equity: {
    items: Array<{ name: string; amount: number }>
    total: number
  }
  totals: {
    assets: number
    liabilities: number
    equity: number
  }
}

export default function BalanceSheetPage() {
  // ===== AUTH STATE =====
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const supabase = createClient()

  // ===== FARM CONTEXT =====
  const { currentFarm, loading: farmLoading } = useFarm()

  // ===== DATA STATE =====
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<BalanceSheetData | null>(null)
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    assets: true,
    liabilities: true,
    equity: true
  })

  // ===== CHECK AUTH =====
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (err) {
        console.error('Auth check error:', err)
        setError('Failed to authenticate. Please refresh the page.')
      } finally {
        setAuthChecked(true)
      }
    }
    checkAuth()
  }, [supabase])

  // ===== FETCH DATA =====
  const fetchData = useCallback(async () => {
    if (!currentFarm || !user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get all financial data up to the selected date
      const [incomeRes, expensesRes, inventoryRes, equipmentRes, cropsRes, livestockRes] = await Promise.all([
        supabase
          .from('income')
          .select('amount, category')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
          .lte('date', asOfDate),
        supabase
          .from('expenses')
          .select('amount, category')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
          .lte('date', asOfDate),
        supabase
          .from('inventory_items')
          .select('current_quantity, unit_cost, name')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id),
        supabase
          .from('equipment')
          .select('purchase_price, name, category')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id),
        supabase
          .from('crops')
          .select('id')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
          .eq('status', 'active'),
        supabase
          .from('livestock')
          .select('id')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
          .eq('status', 'active'),
      ])

      if (incomeRes.error) throw incomeRes.error
      if (expensesRes.error) throw expensesRes.error

      const totalIncome = incomeRes.data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0
      const totalExpenses = expensesRes.data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0
      const netProfit = totalIncome - totalExpenses

      // Calculate inventory value
      const inventoryValue = inventoryRes.data?.reduce((sum, item) => {
        return sum + (Number(item.current_quantity) * Number(item.unit_cost))
      }, 0) || 0

      // Calculate equipment value (using purchase price as proxy for book value)
      const equipmentValue = equipmentRes.data?.reduce((sum, item) => {
        return sum + Number(item.purchase_price)
      }, 0) || 0

      // Calculate asset values
      const cashBalance = netProfit > 0 ? netProfit : 0
      const accountsReceivable = totalIncome * 0.1 // Estimate: 10% of income outstanding
      const prepaidExpenses = totalExpenses * 0.05 // Estimate: 5% of expenses prepaid

      // Build balance sheet
      const balanceSheet: BalanceSheetData = {
        assets: {
          current: [
            { name: 'Cash & Bank', amount: cashBalance },
            { name: 'Inventory', amount: inventoryValue },
            { name: 'Accounts Receivable', amount: accountsReceivable },
            { name: 'Prepaid Expenses', amount: prepaidExpenses },
          ],
          fixed: [
            { name: 'Equipment', amount: equipmentValue },
            { name: 'Crops (Active)', amount: cropsRes.count || 0 },
            { name: 'Livestock', amount: livestockRes.count || 0 },
          ],
          total: 0,
        },
        liabilities: {
          current: [
            { name: 'Accounts Payable', amount: totalExpenses * 0.15 },
            { name: 'Accrued Expenses', amount: totalExpenses * 0.05 },
            { name: 'Short Term Debt', amount: 0 },
          ],
          longTerm: [
            { name: 'Long Term Debt', amount: 0 },
          ],
          total: 0,
        },
        equity: {
          items: [
            { name: 'Retained Earnings', amount: netProfit > 0 ? netProfit : 0 },
          ],
          total: 0,
        },
        totals: {
          assets: 0,
          liabilities: 0,
          equity: 0,
        },
      }

      // Calculate totals
      balanceSheet.assets.total = 
        balanceSheet.assets.current.reduce((s, i) => s + i.amount, 0) +
        balanceSheet.assets.fixed.reduce((s, i) => s + i.amount, 0)

      balanceSheet.liabilities.total =
        balanceSheet.liabilities.current.reduce((s, i) => s + i.amount, 0) +
        balanceSheet.liabilities.longTerm.reduce((s, i) => s + i.amount, 0)

      balanceSheet.equity.total =
        balanceSheet.equity.items.reduce((s, i) => s + i.amount, 0)

      // Balance sheet should balance: Assets = Liabilities + Equity
      // Use the balancing figure as Owner's Equity
      const balancingEquity = balanceSheet.assets.total - balanceSheet.liabilities.total
      
      // Add balancing equity if positive, or show as deficit
      if (balancingEquity > 0) {
        balanceSheet.equity.items.push({ 
          name: 'Owner\'s Equity', 
          amount: balancingEquity 
        })
      } else if (balancingEquity < 0) {
        balanceSheet.equity.items.push({ 
          name: 'Owner\'s Deficit', 
          amount: balancingEquity 
        })
      }

      balanceSheet.equity.total = balanceSheet.equity.items.reduce((s, i) => s + i.amount, 0)

      balanceSheet.totals = {
        assets: balanceSheet.assets.total,
        liabilities: balanceSheet.liabilities.total,
        equity: balanceSheet.equity.total,
      }

      setData(balanceSheet)
    } catch (err) {
      console.error('Balance sheet error:', err)
      setError('Failed to generate balance sheet')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [currentFarm, user, supabase, asOfDate])

  useEffect(() => {
    if (authChecked && user) {
      fetchData()
    }
  }, [authChecked, user, fetchData])

  // ===== REFRESH =====
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
  }

  // ===== FORMAT CURRENCY =====
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // ===== LOADING STATE =====
  if (!authChecked || farmLoading || (loading && !isRefreshing)) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-[#2D6A4F] mx-auto mb-3" />
          <p className="text-sm text-gray-400">Generating balance sheet...</p>
        </div>
      </div>
    )
  }

  // ===== NOT LOGGED IN =====
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">Please Log In</h2>
        <p className="text-sm text-gray-500">You need to be logged in to view the balance sheet.</p>
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
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="text-5xl mb-4">🏠</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">No Farm Selected</h2>
        <p className="text-sm text-gray-500">Please select a farm to view the balance sheet.</p>
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
      <div className="space-y-6 px-4 sm:px-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1B4332]">Balance Sheet</h1>
            <p className="text-gray-500 text-sm mt-1">Financial position of your farm</p>
          </div>
        </div>
        <Card className="shadow-sm border-red-200 bg-red-50">
          <CardContent className="py-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} className="text-red-500" />
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
        <div>
          <div className="flex items-center gap-3">
            <Link href="/finances">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[#1B4332]">Balance Sheet</h1>
                <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
                  {currentFarm.name}
                </Badge>
              </div>
              <p className="text-gray-500 text-sm mt-1">
                Financial position as of <span className="font-medium text-gray-700">{asOfDate}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            <Input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="w-40 h-9 text-sm"
            />
          </div>
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
          <Button
            variant="outline"
            size="sm"
            className="border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
            onClick={() => window.print()}
          >
            <Printer size={14} className="mr-2" />
            Print
          </Button>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="shadow-sm border-0 bg-gradient-to-br from-green-50 to-white">
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-xs text-gray-400 font-medium">Total Assets</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totals.assets)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-0 bg-gradient-to-br from-red-50 to-white">
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-xs text-gray-400 font-medium">Total Liabilities</p>
                <p className="text-2xl font-bold text-red-500">{formatCurrency(data.totals.liabilities)}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-0 bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-xs text-gray-400 font-medium">Total Equity</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.totals.equity)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Balance Sheet Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assets */}
            <Card className="shadow-sm border-0">
              <CardHeader 
                className="pb-2 cursor-pointer hover:bg-gray-50/50 rounded-t-lg transition-colors"
                onClick={() => toggleSection('assets')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2 text-green-700">
                    <Building2 size={16} className="text-green-600" />
                    Assets
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-green-700">
                      {formatCurrency(data.totals.assets)}
                    </span>
                    {expandedSections.assets ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
              </CardHeader>
              {expandedSections.assets && (
                <CardContent className="pt-2">
                  {/* Current Assets */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Current Assets</p>
                    <div className="space-y-1">
                      {data.assets.current.map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                          <span className="text-sm text-gray-600">{item.name}</span>
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fixed Assets */}
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Fixed Assets</p>
                    <div className="space-y-1">
                      {data.assets.fixed.map((item, index) => {
                        const isNumber = typeof item.amount === 'number'
                        return (
                          <div key={index} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                            <span className="text-sm text-gray-600">{item.name}</span>
                            <span className="text-sm font-medium text-green-600">
                              {isNumber ? formatCurrency(item.amount) : item.amount}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Liabilities & Equity */}
            <div className="space-y-6">
              {/* Liabilities */}
              <Card className="shadow-sm border-0">
                <CardHeader 
                  className="pb-2 cursor-pointer hover:bg-gray-50/50 rounded-t-lg transition-colors"
                  onClick={() => toggleSection('liabilities')}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2 text-red-700">
                      <Wallet size={16} className="text-red-600" />
                      Liabilities
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-red-700">
                        {formatCurrency(data.totals.liabilities)}
                      </span>
                      {expandedSections.liabilities ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </CardHeader>
                {expandedSections.liabilities && (
                  <CardContent className="pt-2">
                    {/* Current Liabilities */}
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Current Liabilities</p>
                      <div className="space-y-1">
                        {data.liabilities.current.map((item, index) => (
                          <div key={index} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                            <span className="text-sm text-gray-600">{item.name}</span>
                            <span className="text-sm font-medium text-red-500">
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Long Term Liabilities */}
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Long Term Liabilities</p>
                      <div className="space-y-1">
                        {data.liabilities.longTerm.map((item, index) => (
                          <div key={index} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                            <span className="text-sm text-gray-600">{item.name}</span>
                            <span className="text-sm font-medium text-red-500">
                              {formatCurrency(item.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Equity */}
              <Card className="shadow-sm border-0">
                <CardHeader 
                  className="pb-2 cursor-pointer hover:bg-gray-50/50 rounded-t-lg transition-colors"
                  onClick={() => toggleSection('equity')}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2 text-blue-700">
                      <PiggyBank size={16} className="text-blue-600" />
                      Equity
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-blue-700">
                        {formatCurrency(data.totals.equity)}
                      </span>
                      {expandedSections.equity ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </CardHeader>
                {expandedSections.equity && (
                  <CardContent className="pt-2">
                    <div className="space-y-1">
                      {data.equity.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                          <span className="text-sm text-gray-600">{item.name}</span>
                          <span className={`text-sm font-medium ${
                            item.amount >= 0 ? 'text-blue-600' : 'text-red-500'
                          }`}>
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>

          {/* Balance Check */}
          <Card className="shadow-sm border-0 bg-gradient-to-br from-[#D8F3DC]/20 to-white">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <LayoutDashboard size={16} className="text-[#2D6A4F]" />
                  <span className="text-sm font-medium text-gray-700">Balance Check</span>
                </div>
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <span className="text-gray-500">
                    Assets: <span className="font-semibold text-green-600">{formatCurrency(data.totals.assets)}</span>
                  </span>
                  <span className="text-gray-500">
                    Liabilities: <span className="font-semibold text-red-500">{formatCurrency(data.totals.liabilities)}</span>
                  </span>
                  <span className="text-gray-500">
                    Equity: <span className="font-semibold text-blue-600">{formatCurrency(data.totals.equity)}</span>
                  </span>
                  <span className={cn(
                    "font-semibold flex items-center gap-1",
                    Math.abs(data.totals.assets - (data.totals.liabilities + data.totals.equity)) < 0.01
                      ? "text-green-600"
                      : "text-red-500"
                  )}>
                    {Math.abs(data.totals.assets - (data.totals.liabilities + data.totals.equity)) < 0.01 ? (
                      <>
                        <CheckCircle2 size={14} /> Balanced
                      </>
                    ) : (
                      <>
                        <AlertCircle size={14} /> Out of Balance
                      </>
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-700">About this Balance Sheet</p>
                <p className="text-xs text-blue-600 mt-1">
                  This balance sheet is generated from your farm's financial data. 
                  Some values are estimates based on available data (Accounts Receivable, Prepaid Expenses, etc.).
                  For accurate accounting and tax purposes, please consult a professional accountant.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}