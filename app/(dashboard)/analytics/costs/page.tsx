'use client'

import { useState, useEffect } from 'react'
import { Calculator, TrendingDown, Leaf, Wrench, Save, History } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'


type Snapshot = {
  id: string
  week_start: string
  infra_total: number
  production_total: number
  weekly_total: number
  monthly_estimate: number
  annual_estimate: number
  created_at: string
}

export default function CostCalculatorPage() {
  const [weeklyInfra, setWeeklyInfra] = useState({
    electricity: '', water: '', fuel: '', labour: '',
    insurance: '', rent: '', other: '',
  })
  const [weeklyProduction, setWeeklyProduction] = useState({
    seeds: '', fertiliser: '', chemicals: '',
    packaging: '', transport: '', other: '',
  })
  const [actualExpenses, setActualExpenses] = useState(0)
  const [actualIncome, setActualIncome] = useState(0)
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [saving, setSaving] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const today = new Date()
      const weekAgo = new Date(today)
      weekAgo.setDate(today.getDate() - 7)
      const from = weekAgo.toISOString().split('T')[0]
      const to = today.toISOString().split('T')[0]

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [expRes, incRes, snapshotRes] = await Promise.all([
        supabase.from('expenses').select('amount').gte('date', from).lte('date', to).eq('user_id', user.id),
        supabase.from('income').select('amount').gte('date', from).lte('date', to).eq('user_id', user.id),
        supabase.from('cost_snapshots').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      ])

      setActualExpenses(expRes.data?.reduce((s, r) => s + Number(r.amount), 0) || 0)
      setActualIncome(incRes.data?.reduce((s, r) => s + Number(r.amount), 0) || 0)
      if (snapshotRes.data) setSnapshots(snapshotRes.data)
    }
    fetchData()
  }, [])

  const infraTotal = Object.values(weeklyInfra).reduce((s, v) => s + (parseFloat(v) || 0), 0)
  const productionTotal = Object.values(weeklyProduction).reduce((s, v) => s + (parseFloat(v) || 0), 0)
  const estimatedTotal = infraTotal + productionTotal
  const estimatedMonthly = estimatedTotal * 4.33
  const estimatedAnnual = estimatedTotal * 52

  async function handleSave() {
    if (estimatedTotal === 0) {
      setSaveMessage('Please enter some costs before saving.')
      return
    }
    setSaving(true)
    setSaveMessage('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setSaveMessage('Not logged in.')
        setSaving(false)
        return
      }

      const { data, error } = await supabase.from('cost_snapshots').insert([{
        user_id: user.id,
        week_start: new Date().toISOString().split('T')[0],
        infra_electricity: parseFloat(weeklyInfra.electricity) || 0,
        infra_water: parseFloat(weeklyInfra.water) || 0,
        infra_fuel: parseFloat(weeklyInfra.fuel) || 0,
        infra_labour: parseFloat(weeklyInfra.labour) || 0,
        infra_insurance: parseFloat(weeklyInfra.insurance) || 0,
        infra_rent: parseFloat(weeklyInfra.rent) || 0,
        infra_other: parseFloat(weeklyInfra.other) || 0,
        infra_total: infraTotal,
        prod_seeds: parseFloat(weeklyProduction.seeds) || 0,
        prod_fertiliser: parseFloat(weeklyProduction.fertiliser) || 0,
        prod_chemicals: parseFloat(weeklyProduction.chemicals) || 0,
        prod_packaging: parseFloat(weeklyProduction.packaging) || 0,
        prod_transport: parseFloat(weeklyProduction.transport) || 0,
        prod_other: parseFloat(weeklyProduction.other) || 0,
        production_total: productionTotal,
        weekly_total: estimatedTotal,
        monthly_estimate: estimatedMonthly,
        annual_estimate: estimatedAnnual,
      }]).select().single()

      if (error) {
        setSaveMessage('Error: ' + error.message)
      } else if (data) {
        setSnapshots((prev) => [data, ...prev])
        setSaveMessage('✅ Estimate saved successfully!')
        setTimeout(() => setSaveMessage(''), 3000)
      }
    } catch (err) {
      setSaveMessage('Unexpected error. Try again.')
    }
    setSaving(false)
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
        <Button
          variant="outline"
          className="border-[#2D6A4F] text-[#2D6A4F]"
          onClick={() => setShowHistory(!showHistory)}
        >
          <History size={16} className="mr-2" />
          {showHistory ? 'Hide History' : 'View History'}
        </Button>
      </div>

      {/* This week actual from Supabase */}
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

      {/* History */}
      {showHistory && snapshots.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Previous Estimates</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {snapshots.map((snap) => (
                <div key={snap.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Week of {snap.week_start}</p>
                    <p className="text-xs text-gray-400">
                      Infra: R{Number(snap.infra_total).toFixed(0)} +
                      Production: R{Number(snap.production_total).toFixed(0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#1B4332]">R{Number(snap.weekly_total).toFixed(0)}/week</p>
                    <p className="text-xs text-gray-400">R{Number(snap.monthly_estimate).toFixed(0)}/month</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showHistory && snapshots.length === 0 && (
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-center py-8 text-gray-400">
            <p className="text-sm">No saved estimates yet</p>
          </CardContent>
        </Card>
      )}

      {/* Input grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Weekly Total</p>
              <p className="text-2xl font-bold text-[#1B4332]">R{estimatedTotal.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-1">
                Infra: R{infraTotal.toFixed(0)} + Prod: R{productionTotal.toFixed(0)}
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
            <div className={`p-3 rounded-lg ${actualIncome >= estimatedTotal ? 'bg-green-100' : 'bg-red-100'}`}>
              <p className={`text-sm font-medium text-center ${actualIncome >= estimatedTotal ? 'text-green-700' : 'text-red-700'}`}>
                {actualIncome >= estimatedTotal
                  ? `✅ Income (R${actualIncome.toFixed(0)}) covers estimated costs (R${estimatedTotal.toFixed(0)})`
                  : `⚠️ Income (R${actualIncome.toFixed(0)}) is below estimated costs (R${estimatedTotal.toFixed(0)}) — shortfall of R${(estimatedTotal - actualIncome).toFixed(0)}`
                }
              </p>
            </div>
          )}

          {saveMessage && (
            <p className={`text-sm text-center font-medium ${saveMessage.includes('✅') ? 'text-green-700' : 'text-red-600'}`}>
              {saveMessage}
            </p>
          )}

          <Button
            className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
            onClick={handleSave}
            disabled={saving || estimatedTotal === 0}
          >
            <Save size={16} className="mr-2" />
            {saving ? 'Saving...' : 'Save This Week\'s Estimate'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}