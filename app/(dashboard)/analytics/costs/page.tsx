'use client'

import { useState, useEffect } from 'react'
import { Calculator, TrendingDown, Leaf, Wrench, Save, History } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'

type CostSnapshot = {
  id: string
  week_start: string
  infrastructure_total: number
  production_total: number
  estimated_total: number
  actual_income: number
  actual_expenses: number
  created_at: string
}

export default function CostCalculatorPage() {
  const [weeklyInfra, setWeeklyInfra] = useState({
    electricity: '',
    water: '',
    fuel: '',
    labour: '',
    insurance: '',
    rent: '',
    other: '',
  })

  const [weeklyProduction, setWeeklyProduction] = useState({
    seeds: '',
    fertiliser: '',
    chemicals: '',
    packaging: '',
    transport: '',
    other: '',
  })

  const [actualExpenses, setActualExpenses] = useState(0)
  const [actualIncome, setActualIncome] = useState(0)
  const [history, setHistory] = useState<CostSnapshot[]>([])
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const getWeekStart = () => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    const weekStart = new Date(today.setDate(diff))
    return weekStart.toISOString().split('T')[0]
  }

  useEffect(() => {
    async function fetchThisWeek() {
      const today = new Date()
      const weekAgo = new Date(today)
      weekAgo.setDate(today.getDate() - 7)
      const from = weekAgo.toISOString().split('T')[0]
      const to = today.toISOString().split('T')[0]

      const [expRes, incRes] = await Promise.all([
        supabase.from('expenses').select('amount').gte('date', from).lte('date', to),
        supabase.from('income').select('amount').gte('date', from).lte('date', to),
      ])

      const totalExp = expRes.data?.reduce((s, r) => s + Number(r.amount), 0) || 0
      const totalInc = incRes.data?.reduce((s, r) => s + Number(r.amount), 0) || 0
      setActualExpenses(totalExp)
      setActualIncome(totalInc)

      // Fetch history
      const histRes = await supabase
        .from('cost_snapshots')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(12)
      if (histRes.data) setHistory(histRes.data as CostSnapshot[])
    }
    fetchThisWeek()
  }, [])

  const infraTotal = Object.values(weeklyInfra).reduce((s, v) => s + (parseFloat(v) || 0), 0)
  const productionTotal = Object.values(weeklyProduction).reduce((s, v) => s + (parseFloat(v) || 0), 0)
  const estimatedTotal = infraTotal + productionTotal
  const estimatedMonthly = estimatedTotal * 4.33
  const estimatedAnnual = estimatedTotal * 52

  async function saveEstimate() {
    if (estimatedTotal === 0) {
      alert('Please enter at least one cost before saving')
      return
    }
    setSaving(true)
    try {
      const { error, data } = await supabase.from('cost_snapshots').insert([{
        week_start: getWeekStart(),
        infrastructure_total: infraTotal,
        production_total: productionTotal,
        estimated_total: estimatedTotal,
        actual_income: actualIncome,
        actual_expenses: actualExpenses,
      }])
      if (error) {
        console.error('Save error:', error)
        alert(`Failed to save estimate: ${error.message || 'Unknown error. Make sure the cost_snapshots table exists in Supabase.'}`)
      } else {
        alert('Weekly estimate saved successfully!')
        // Refresh history
        const histRes = await supabase
          .from('cost_snapshots')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(12)
        if (histRes.data) setHistory(histRes.data as CostSnapshot[])
      }
    } catch (err) {
      console.error('Save crash:', err)
    } finally {
      setSaving(false)
    }
  }

  const INFRA_FIELDS = [
    { key: 'electricity', label: 'Electricity' },
    { key: 'water', label: 'Water / Irrigation' },
    { key: 'fuel', label: 'Fuel / Diesel' },
    { key: 'labour', label: 'Labour / Wages' },
    { key: 'insurance', label: 'Insurance' },
    { key: 'rent', label: 'Land Rent / Bond' },
    { key: 'other', label: 'Other Infrastructure' },
  ]

  const PRODUCTION_FIELDS = [
    { key: 'seeds', label: 'Seeds / Seedlings' },
    { key: 'fertiliser', label: 'Fertiliser' },
    { key: 'chemicals', label: 'Chemicals / Sprays' },
    { key: 'packaging', label: 'Packaging' },
    { key: 'transport', label: 'Transport / Delivery' },
    { key: 'other', label: 'Other Production' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332]">Weekly Cost Calculator</h1>
          <p className="text-gray-500 text-sm mt-1">
            Estimate your weekly infrastructure and production costs
          </p>
        </div>
      </div>

      <Tabs defaultValue="calculator" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          {/* This week from Supabase */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="shadow-sm border-green-100">
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-xs text-gray-400 mb-1">Actual Income This Week</p>
                <p className="text-2xl font-bold text-green-600">R{actualIncome.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">From your records</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-red-100">
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-xs text-gray-400 mb-1">Actual Expenses This Week</p>
                <p className="text-2xl font-bold text-red-500">R{actualExpenses.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">From your records</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Infrastructure costs */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wrench size={16} className="text-[#2D6A4F]" />
                  Weekly Infrastructure Costs
                </CardTitle>
                <p className="text-xs text-gray-400">Fixed/overhead costs per week</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {INFRA_FIELDS.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <Label className="w-40 text-sm text-gray-600 flex-shrink-0">{label}</Label>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">R</span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="pl-7"
                        value={weeklyInfra[key as keyof typeof weeklyInfra]}
                        onChange={(e) => setWeeklyInfra(prev => ({
                          ...prev,
                          [key]: (e.target as HTMLInputElement).value
                        }))}
                      />
                    </div>
                  </div>
                ))}
                <div className="border-t pt-3 flex justify-between">
                  <p className="text-sm font-semibold text-gray-700">Infrastructure Total</p>
                  <p className="text-sm font-bold text-[#2D6A4F]">R{infraTotal.toFixed(2)}/week</p>
                </div>
              </CardContent>
            </Card>

            {/* Production costs */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Leaf size={16} className="text-[#2D6A4F]" />
                  Weekly Production Costs
                </CardTitle>
                <p className="text-xs text-gray-400">Variable/input costs per week</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {PRODUCTION_FIELDS.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <Label className="w-40 text-sm text-gray-600 flex-shrink-0">{label}</Label>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">R</span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="pl-7"
                        value={weeklyProduction[key as keyof typeof weeklyProduction]}
                        onChange={(e) => setWeeklyProduction(prev => ({
                          ...prev,
                          [key]: (e.target as HTMLInputElement).value
                        }))}
                      />
                    </div>
                  </div>
                ))}
                <div className="border-t pt-3 flex justify-between">
                  <p className="text-sm font-semibold text-gray-700">Production Total</p>
                  <p className="text-sm font-bold text-[#2D6A4F]">R{productionTotal.toFixed(2)}/week</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <Card className="shadow-sm bg-[#D8F3DC] border-[#52B788]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-[#1B4332]">
                <Calculator size={18} /> Cost Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">Weekly Total</p>
                  <p className="text-2xl font-bold text-[#1B4332]">R{estimatedTotal.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Infra: R{infraTotal.toFixed(0)} + Production: R{productionTotal.toFixed(0)}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">Monthly Estimate</p>
                  <p className="text-2xl font-bold text-[#2D6A4F]">R{estimatedMonthly.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-1">Weekly × 4.33</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">Annual Estimate</p>
                  <p className="text-2xl font-bold text-[#2D6A4F]">R{estimatedAnnual.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-1">Weekly × 52</p>
                </div>
              </div>

              {estimatedTotal > 0 && actualIncome > 0 && (
                <div className={`mt-4 p-3 rounded-lg ${actualIncome >= estimatedTotal ? 'bg-green-100' : 'bg-red-100'}`}>
                  <p className={`text-sm font-medium text-center ${actualIncome >= estimatedTotal ? 'text-green-700' : 'text-red-700'}`}>
                    {actualIncome >= estimatedTotal
                      ? ` This week's income (R${actualIncome.toFixed(0)}) covers your estimated costs (R${estimatedTotal.toFixed(0)})`
                      : ` This week's income (R${actualIncome.toFixed(0)}) is below your estimated costs (R${estimatedTotal.toFixed(0)}) — shortfall of R${(estimatedTotal - actualIncome).toFixed(0)}`
                    }
                  </p>
                </div>
              )}

              <Button
                className="w-full mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                onClick={saveEstimate}
                disabled={saving}
              >
                <Save size={16} className="mr-2" />
                {saving ? 'Saving...' : 'Save This Week\'s Estimate'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History size={18} className="text-[#2D6A4F]" /> Cost History
              </CardTitle>
              <p className="text-xs text-gray-400">Your saved weekly cost estimates</p>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400">No saved estimates yet. Start by calculating your costs above!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((snapshot) => (
                    <div key={snapshot.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Week of {snapshot.week_start}</p>
                          <p className="text-xs text-gray-400">Saved {new Date(snapshot.created_at).toLocaleDateString()}</p>
                        </div>
                        <p className="text-sm font-bold text-[#2D6A4F]">R{snapshot.estimated_total.toFixed(2)}</p>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div>
                          <p className="text-gray-400">Infrastructure</p>
                          <p className="font-semibold text-gray-700">R{snapshot.infrastructure_total.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Production</p>
                          <p className="font-semibold text-gray-700">R{snapshot.production_total.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Actual Income</p>
                          <p className="font-semibold text-green-600">R{snapshot.actual_income.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Actual Expenses</p>
                          <p className="font-semibold text-red-500">R{snapshot.actual_expenses.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
