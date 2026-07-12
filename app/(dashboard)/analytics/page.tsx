'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Calculator, TrendingDown, Leaf, Wrench, Save,
  History, ChevronDown, ChevronUp, Trash2,
  ArrowUpRight, ArrowDownRight, AlertCircle, CheckCircle2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

type Snapshot = {
  id: string
  week_start: string
  infra_total: number
  production_total: number
  weekly_total: number
  monthly_estimate: number
  annual_estimate: number
  infra_electricity: number
  infra_water: number
  infra_fuel: number
  infra_labour: number
  infra_insurance: number
  infra_rent: number
  infra_other: number
  prod_seeds: number
  prod_fertiliser: number
  prod_chemicals: number
  prod_packaging: number
  prod_transport: number
  prod_other: number
  created_at: string
}

const fmt = (n: number) => `R${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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
  const [expenseBreakdown, setExpenseBreakdown] = useState<Record<string, number>>({})
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [saving, setSaving] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [expandedSnapshot, setExpandedSnapshot] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [weekLabel, setWeekLabel] = useState('')

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const today = new Date()
    const weekAgo = new Date(today)
    weekAgo.setDate(today.getDate() - 7)
    const from = weekAgo.toISOString().split('T')[0]
    const to = today.toISOString().split('T')[0]

    // Set week label
    setWeekLabel(`${weekAgo.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} – ${today.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}`)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [expRes, incRes, snapshotRes] = await Promise.all([
      supabase.from('expenses').select('amount, category').gte('date', from).lte('date', to).eq('user_id', user.id),
      supabase.from('income').select('amount').gte('date', from).lte('date', to).eq('user_id', user.id),
      supabase.from('cost_snapshots').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    ])

    const totalExp = expRes.data?.reduce((s, r) => s + (parseFloat(String(r.amount)) || 0), 0) || 0
    const totalInc = incRes.data?.reduce((s, r) => s + (parseFloat(String(r.amount)) || 0), 0) || 0

    // Build expense breakdown by category
    const breakdown: Record<string, number> = {}
    expRes.data?.forEach(r => {
      breakdown[r.category] = (breakdown[r.category] || 0) + (parseFloat(String(r.amount)) || 0)
    })

    setActualExpenses(totalExp)
    setActualIncome(totalInc)
    setExpenseBreakdown(breakdown)
    if (snapshotRes.data) setSnapshots(snapshotRes.data)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const infraTotal = Object.values(weeklyInfra).reduce((s, v) => s + (parseFloat(v) || 0), 0)
  const productionTotal = Object.values(weeklyProduction).reduce((s, v) => s + (parseFloat(v) || 0), 0)
  const estimatedTotal = infraTotal + productionTotal
  const estimatedMonthly = estimatedTotal * 4.33
  const estimatedAnnual = estimatedTotal * 52
  const variance = actualExpenses - estimatedTotal
  const variancePct = estimatedTotal > 0 ? ((variance / estimatedTotal) * 100).toFixed(1) : '0'

  async function handleSave() {
    if (estimatedTotal === 0) return
    setSaving(true)
    setSaveStatus('idle')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setSaveStatus('error'); setSaving(false); return }

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
        console.error(error)
        setSaveStatus('error')
      } else if (data) {
        setSnapshots(prev => [data, ...prev])
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    } catch (err) {
      setSaveStatus('error')
    }
    setSaving(false)
  }

  async function handleDeleteSnapshot(id: string) {
    const { error } = await supabase.from('cost_snapshots').delete().eq('id', id)
    if (!error) setSnapshots(prev => prev.filter(s => s.id !== id))
  }

  const INFRA_FIELDS = [
    { key: 'electricity', label: 'Electricity', icon: '⚡' },
    { key: 'water', label: 'Water / Irrigation', icon: '💧' },
    { key: 'fuel', label: 'Fuel / Diesel', icon: '⛽' },
    { key: 'labour', label: 'Labour / Wages', icon: '👷' },
    { key: 'insurance', label: 'Insurance', icon: '🛡️' },
    { key: 'rent', label: 'Land Rent / Bond', icon: '🏡' },
    { key: 'other', label: 'Other Infrastructure', icon: '📦' },
  ]

  const PRODUCTION_FIELDS = [
    { key: 'seeds', label: 'Seeds / Seedlings', icon: '🌱' },
    { key: 'fertiliser', label: 'Fertiliser', icon: '🧪' },
    { key: 'chemicals', label: 'Chemicals / Sprays', icon: '🚿' },
    { key: 'packaging', label: 'Packaging', icon: '📦' },
    { key: 'transport', label: 'Transport / Delivery', icon: '🚛' },
    { key: 'other', label: 'Other Production', icon: '🔧' },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332]">Weekly Cost Calculator</h1>
          <p className="text-gray-500 text-sm mt-1">
            Estimate costs · Compare to actuals · Track over time
          </p>
        </div>
        <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs px-3 py-1">
          📅 Week: {weekLabel}
        </Badge>
      </div>

      {/* Actual this week — from Supabase records */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm border-green-100">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Actual Income</p>
              <ArrowUpRight size={16} className="text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">{fmt(actualIncome)}</p>
            <p className="text-xs text-gray-400 mt-1">Recorded this week</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-red-100">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Actual Expenses</p>
              <ArrowDownRight size={16} className="text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-500">{fmt(actualExpenses)}</p>
            <p className="text-xs text-gray-400 mt-1">Recorded this week</p>
            {Object.keys(expenseBreakdown).length > 0 && (
              <div className="mt-3 space-y-1 border-t border-gray-100 pt-2">
                {Object.entries(expenseBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([cat, amt]) => (
                    <div key={cat} className="flex justify-between text-xs">
                      <span className="text-gray-400 truncate">{cat}</span>
                      <span className="text-red-400 font-medium ml-2">{fmt(amt)}</span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={`shadow-sm ${actualIncome - actualExpenses >= 0 ? 'border-[#52B788]' : 'border-red-200'}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Net This Week</p>
              <Calculator size={16} className="text-[#2D6A4F]" />
            </div>
            <p className={`text-2xl font-bold ${actualIncome - actualExpenses >= 0 ? 'text-[#2D6A4F]' : 'text-red-500'}`}>
              {fmt(Math.abs(actualIncome - actualExpenses))}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {actualIncome - actualExpenses >= 0 ? '✅ Profit' : '⚠️ Loss'} from records
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Separator */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Weekly Cost Estimate</p>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Input grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Infrastructure */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
                <Wrench size={14} className="text-orange-500" />
              </div>
              Infrastructure Costs
            </CardTitle>
            <p className="text-xs text-gray-400">Fixed overhead costs per week</p>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {INFRA_FIELDS.map(({ key, label, icon }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-base w-6 flex-shrink-0">{icon}</span>
                <Label className="text-xs text-gray-600 w-36 flex-shrink-0">{label}</Label>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">R</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="pl-7 h-8 text-sm"
                    value={weeklyInfra[key as keyof typeof weeklyInfra]}
                    onChange={(e) => setWeeklyInfra(prev => ({
                      ...prev,
                      [key]: (e.target as HTMLInputElement).value
                    }))}
                  />
                </div>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
              <p className="text-xs font-semibold text-gray-600">Infrastructure Subtotal</p>
              <p className="text-sm font-bold text-orange-600">{fmt(infraTotal)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Production */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="w-7 h-7 bg-[#D8F3DC] rounded-lg flex items-center justify-center">
                <Leaf size={14} className="text-[#2D6A4F]" />
              </div>
              Production Costs
            </CardTitle>
            <p className="text-xs text-gray-400">Variable input costs per week</p>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {PRODUCTION_FIELDS.map(({ key, label, icon }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-base w-6 flex-shrink-0">{icon}</span>
                <Label className="text-xs text-gray-600 w-36 flex-shrink-0">{label}</Label>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">R</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="pl-7 h-8 text-sm"
                    value={weeklyProduction[key as keyof typeof weeklyProduction]}
                    onChange={(e) => setWeeklyProduction(prev => ({
                      ...prev,
                      [key]: (e.target as HTMLInputElement).value
                    }))}
                  />
                </div>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
              <p className="text-xs font-semibold text-gray-600">Production Subtotal</p>
              <p className="text-sm font-bold text-[#2D6A4F]">{fmt(productionTotal)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary card */}
      <Card className="shadow-sm bg-[#1B4332] text-white">
        <CardContent className="pt-6 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="sm:col-span-1">
              <p className="text-xs text-[#52B788] font-semibold uppercase tracking-wide mb-1">Weekly Estimate</p>
              <p className="text-3xl font-bold text-white">{fmt(estimatedTotal)}</p>
              <div className="flex gap-1 mt-2 text-xs text-[#D8F3DC]">
                <span>Infra {fmt(infraTotal)}</span>
                <span>+</span>
                <span>Prod {fmt(productionTotal)}</span>
              </div>
            </div>

            <div>
              <p className="text-xs text-[#52B788] font-semibold uppercase tracking-wide mb-1">Monthly</p>
              <p className="text-2xl font-bold">{fmt(estimatedMonthly)}</p>
              <p className="text-xs text-[#D8F3DC] mt-1">× 4.33 weeks</p>
            </div>

            <div>
              <p className="text-xs text-[#52B788] font-semibold uppercase tracking-wide mb-1">Annual</p>
              <p className="text-2xl font-bold">{fmt(estimatedAnnual)}</p>
              <p className="text-xs text-[#D8F3DC] mt-1">× 52 weeks</p>
            </div>

            <div>
              <p className="text-xs text-[#52B788] font-semibold uppercase tracking-wide mb-1">vs Actual</p>
              {actualExpenses > 0 && estimatedTotal > 0 ? (
                <>
                  <p className={`text-2xl font-bold ${Math.abs(variance) < estimatedTotal * 0.1 ? 'text-[#52B788]' : variance > 0 ? 'text-red-300' : 'text-yellow-300'}`}>
                    {variance > 0 ? '+' : ''}{fmt(variance)}
                  </p>
                  <p className="text-xs text-[#D8F3DC] mt-1">
                    {variance > 0 ? '⚠️ Over estimate' : variance < 0 ? '✅ Under estimate' : '✅ On target'} ({variancePct}%)
                  </p>
                </>
              ) : (
                <p className="text-sm text-[#D8F3DC]">Add expenses this week to compare</p>
              )}
            </div>
          </div>

          {/* Comparison bar */}
          {actualExpenses > 0 && estimatedTotal > 0 && (
            <div className="mt-6 pt-4 border-t border-[#2D6A4F]">
              <div className="flex justify-between text-xs text-[#D8F3DC] mb-2">
                <span>Actual: {fmt(actualExpenses)}</span>
                <span>Estimate: {fmt(estimatedTotal)}</span>
              </div>
              <div className="w-full bg-[#2D6A4F] rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${actualExpenses <= estimatedTotal ? 'bg-[#52B788]' : 'bg-red-400'}`}
                  style={{ width: `${Math.min((actualExpenses / estimatedTotal) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-[#52B788] mt-2 text-center">
                {actualExpenses <= estimatedTotal
                  ? `✅ Actual is ${fmt(estimatedTotal - actualExpenses)} below your estimate`
                  : `⚠️ Actual is ${fmt(actualExpenses - estimatedTotal)} above your estimate`
                }
              </p>
            </div>
          )}

          {/* Save button */}
          <div className="mt-6 flex items-center gap-3">
            <Button
              className={`flex-1 font-semibold transition-all ${
                saveStatus === 'success'
                  ? 'bg-[#52B788] text-white'
                  : saveStatus === 'error'
                  ? 'bg-red-500 text-white'
                  : 'bg-white text-[#1B4332] hover:bg-[#D8F3DC]'
              }`}
              onClick={handleSave}
              disabled={saving || estimatedTotal === 0}
            >
              {saveStatus === 'success' ? (
                <><CheckCircle2 size={16} className="mr-2" /> Estimate Saved!</>
              ) : saveStatus === 'error' ? (
                <><AlertCircle size={16} className="mr-2" /> Save Failed — Try Again</>
              ) : (
                <><Save size={16} className="mr-2" /> {saving ? 'Saving...' : "Save This Week's Estimate"}</>
              )}
            </Button>
          </div>
          <p className="text-xs text-[#52B788] text-center mt-2">
            Estimates are saved separately from your actual expense records
          </p>
        </CardContent>
      </Card>

      {/* History */}
      <Card className="shadow-sm">
        <CardHeader>
          <button
            className="flex items-center justify-between w-full"
            onClick={() => setShowHistory(!showHistory)}
          >
            <CardTitle className="text-base flex items-center gap-2">
              <History size={16} className="text-[#2D6A4F]" />
              Saved Estimates History
              {snapshots.length > 0 && (
                <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs ml-2">
                  {snapshots.length}
                </Badge>
              )}
            </CardTitle>
            {showHistory ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>
        </CardHeader>

        {showHistory && (
          <CardContent className="p-0">
            {snapshots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <History size={32} className="mb-2 opacity-30" />
                <p className="text-sm">No estimates saved yet</p>
                <p className="text-xs mt-1">Fill in the calculator above and save</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {snapshots.map((snap) => (
                  <div key={snap.id}>
                    <div
                      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedSnapshot(expandedSnapshot === snap.id ? null : snap.id)}
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          Week of {new Date(snap.week_start).toLocaleDateString('en-ZA', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-orange-500">
                            Infra: {fmt(Number(snap.infra_total))}
                          </span>
                          <span className="text-xs text-[#2D6A4F]">
                            Prod: {fmt(Number(snap.production_total))}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#1B4332]">{fmt(Number(snap.weekly_total))}/wk</p>
                          <p className="text-xs text-gray-400">{fmt(Number(snap.monthly_estimate))}/mo</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteSnapshot(snap.id) }}
                          className="text-gray-300 hover:text-red-400 transition-colors p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                        {expandedSnapshot === snap.id
                          ? <ChevronUp size={14} className="text-gray-400" />
                          : <ChevronDown size={14} className="text-gray-400" />
                        }
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {expandedSnapshot === snap.id && (
                      <div className="px-6 pb-4 bg-gray-50 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-6 pt-4">
                          <div>
                            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">
                              🔧 Infrastructure
                            </p>
                            {[
                              ['Electricity', snap.infra_electricity],
                              ['Water', snap.infra_water],
                              ['Fuel', snap.infra_fuel],
                              ['Labour', snap.infra_labour],
                              ['Insurance', snap.infra_insurance],
                              ['Rent', snap.infra_rent],
                              ['Other', snap.infra_other],
                            ].filter(([, v]) => Number(v) > 0).map(([label, val]) => (
                              <div key={String(label)} className="flex justify-between text-xs py-1 border-b border-gray-100">
                                <span className="text-gray-500">{label}</span>
                                <span className="font-medium text-gray-700">{fmt(Number(val))}</span>
                              </div>
                            ))}
                            <div className="flex justify-between text-xs py-1 font-semibold mt-1">
                              <span>Subtotal</span>
                              <span className="text-orange-600">{fmt(Number(snap.infra_total))}</span>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-[#2D6A4F] uppercase tracking-wide mb-2">
                              🌱 Production
                            </p>
                            {[
                              ['Seeds', snap.prod_seeds],
                              ['Fertiliser', snap.prod_fertiliser],
                              ['Chemicals', snap.prod_chemicals],
                              ['Packaging', snap.prod_packaging],
                              ['Transport', snap.prod_transport],
                              ['Other', snap.prod_other],
                            ].filter(([, v]) => Number(v) > 0).map(([label, val]) => (
                              <div key={String(label)} className="flex justify-between text-xs py-1 border-b border-gray-100">
                                <span className="text-gray-500">{label}</span>
                                <span className="font-medium text-gray-700">{fmt(Number(val))}</span>
                              </div>
                            ))}
                            <div className="flex justify-between text-xs py-1 font-semibold mt-1">
                              <span>Subtotal</span>
                              <span className="text-[#2D6A4F]">{fmt(Number(snap.production_total))}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 p-3 bg-[#1B4332] rounded-xl">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-xs text-[#52B788]">Weekly</p>
                              <p className="text-sm font-bold text-white">{fmt(Number(snap.weekly_total))}</p>
                            </div>
                            <div>
                              <p className="text-xs text-[#52B788]">Monthly</p>
                              <p className="text-sm font-bold text-white">{fmt(Number(snap.monthly_estimate))}</p>
                            </div>
                            <div>
                              <p className="text-xs text-[#52B788]">Annual</p>
                              <p className="text-sm font-bold text-white">{fmt(Number(snap.annual_estimate))}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Explainer */}
      <Card className="shadow-sm border-blue-100 bg-blue-50">
        <CardContent className="py-4 px-5">
          <p className="text-sm font-semibold text-blue-800 mb-2">
            💡 How this calculator works
          </p>
          <div className="space-y-1 text-xs text-blue-700">
            <p>• <strong>Actual Income/Expenses</strong> — pulled directly from your recorded transactions this week</p>
            <p>• <strong>Weekly Estimate</strong> — your projected costs entered above (not linked to actual records)</p>
            <p>• <strong>vs Actual</strong> — comparison between your estimate and what you actually spent</p>
            <p>• <strong>Saved estimates</strong> are stored separately and do not affect your financial reports</p>
            <p>• To record real expenses, use <a href="/finances/expenses" className="underline font-semibold">Finances → Expenses</a></p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}