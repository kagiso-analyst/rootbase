// app/(dashboard)/analytics/costs/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Leaf, Wrench, Save, History,
  ChevronDown, ChevronUp, Trash2, AlertCircle, CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context'
import Link from 'next/link'

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
  const [expenseBreakdown, setExpenseBreakdown] = useState<Record<string, number>>({})
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [saving, setSaving] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [expandedSnapshot, setExpandedSnapshot] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [weekLabel, setWeekLabel] = useState('')
  const [loading, setLoading] = useState(true)

  const { currentFarm } = useFarm()
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    if (!currentFarm) {
      setLoading(false)
      return
    }

    const today = new Date()
    const weekAgo = new Date(today)
    weekAgo.setDate(today.getDate() - 7)
    const from = weekAgo.toISOString().split('T')[0]
    const to = today.toISOString().split('T')[0]

    setWeekLabel(`${weekAgo.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} - ${today.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}`)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const [expRes, snapshotRes] = await Promise.all([
      supabase.from('expenses')
        .select('amount, category')
        .gte('date', from)
        .lte('date', to)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id),
      supabase.from('cost_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    const totalExp = expRes.data?.reduce((s, r) => s + (parseFloat(String(r.amount)) || 0), 0) || 0

    const breakdown: Record<string, number> = {}
    expRes.data?.forEach(r => {
      breakdown[r.category] = (breakdown[r.category] || 0) + (parseFloat(String(r.amount)) || 0)
    })

    setActualExpenses(totalExp)
    setExpenseBreakdown(breakdown)
    if (snapshotRes.data) setSnapshots(snapshotRes.data)
    setLoading(false)
  }, [currentFarm, supabase])

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
    if (!currentFarm) return

    setSaving(true)
    setSaveStatus('idle')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setSaveStatus('error'); setSaving(false); return }

      const { data, error } = await supabase.from('cost_snapshots').insert([{
        user_id: user.id,
        farm_id: currentFarm.id,
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
    const { error } = await supabase.from('cost_snapshots')
      .delete()
      .eq('id', id)
      .eq('farm_id', currentFarm?.id)
    if (!error) setSnapshots(prev => prev.filter(s => s.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Loading your cost data...</p>
        </div>
      </div>
    )
  }

  if (!currentFarm) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">🏠</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">No Farm Selected</h2>
        <p className="text-sm text-gray-500">Please select a farm to view and manage costs.</p>
        <Link href="/settings">
          <Button className="mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            Go to Settings
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1B4332]">Weekly Cost Calculator</h1>
            <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs">
              🌱 {currentFarm.name}
            </Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Estimate costs - Compare to actuals - Track over time
          </p>
        </div>
        <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs px-3 py-1 whitespace-nowrap">
          📅 {weekLabel}
        </Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-sm border-0 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-medium text-gray-500">Est. Weekly</p>
            <p className="text-xl sm:text-2xl font-bold text-[#2D6A4F]">{fmt(estimatedTotal)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-medium text-gray-500">Est. Monthly</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{fmt(estimatedMonthly)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-medium text-gray-500">Est. Annual</p>
            <p className="text-xl sm:text-2xl font-bold text-purple-600">{fmt(estimatedAnnual)}</p>
          </CardContent>
        </Card>
        <Card className={`shadow-sm border-0 bg-gradient-to-br ${variance >= 0 ? 'from-red-50 to-white' : 'from-green-50 to-white'}`}>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs font-medium text-gray-500">Variance</p>
            <p className={`text-xl sm:text-2xl font-bold ${variance >= 0 ? 'text-red-500' : 'text-[#2D6A4F]'}`}>
              {variance >= 0 ? '+' : ''}{fmt(variance)}
            </p>
            <p className="text-xs text-gray-400">{variancePct}% vs estimate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-sm border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-700">
              <Wrench size={16} className="text-blue-500" />
              Infrastructure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(weeklyInfra).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs capitalize text-gray-500">{key}</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={value}
                  onChange={(e) => setWeeklyInfra(prev => ({ ...prev, [key]: e.target.value }))}
                  className="h-9 text-sm border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
                />
              </div>
            ))}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Total: {fmt(infraTotal)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-700">
              <Leaf size={16} className="text-green-500" />
              Production
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(weeklyProduction).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs capitalize text-gray-500">{key}</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={value}
                  onChange={(e) => setWeeklyProduction(prev => ({ ...prev, [key]: e.target.value }))}
                  className="h-9 text-sm border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
                />
              </div>
            ))}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Total: {fmt(productionTotal)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
          onClick={handleSave}
          disabled={saving || estimatedTotal === 0}
        >
          <Save size={16} className="mr-2" />
          {saving ? 'Saving...' : 'Save Snapshot'}
        </Button>
        {saveStatus === 'success' && (
          <span className="flex items-center text-sm text-green-600">
            <CheckCircle2 size={16} className="mr-1" /> Saved!
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="flex items-center text-sm text-red-600">
            <AlertCircle size={16} className="mr-1" /> Error saving
          </span>
        )}
        <Button
          variant="outline"
          className="border-[#2D6A4F] text-[#2D6A4F]"
          onClick={() => setShowHistory(!showHistory)}
        >
          <History size={16} className="mr-2" />
          History ({snapshots.length})
        </Button>
      </div>

      {showHistory && (
        <Card className="shadow-sm border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Saved Snapshots</CardTitle>
          </CardHeader>
          <CardContent>
            {snapshots.length === 0 ? (
              <p className="text-sm text-gray-400">No snapshots saved yet.</p>
            ) : (
              <div className="space-y-3">
                {snapshots.map((s) => (
                  <div key={s.id} className="border border-gray-100 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          Week of {new Date(s.week_start).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-400">
                          Total: {fmt(s.weekly_total)} - Monthly: {fmt(s.monthly_estimate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedSnapshot(expandedSnapshot === s.id ? null : s.id)}
                          className="text-[#2D6A4F]"
                        >
                          {expandedSnapshot === s.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSnapshot(s.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                    {expandedSnapshot === s.id && (
                      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div><span className="text-gray-400">Infra:</span> {fmt(s.infra_total)}</div>
                        <div><span className="text-gray-400">Production:</span> {fmt(s.production_total)}</div>
                        <div><span className="text-gray-400">Weekly:</span> {fmt(s.weekly_total)}</div>
                        <div><span className="text-gray-400">Monthly:</span> {fmt(s.monthly_estimate)}</div>
                        <div><span className="text-gray-400">Annual:</span> {fmt(s.annual_estimate)}</div>
                        <div><span className="text-gray-400">Saved:</span> {new Date(s.created_at).toLocaleDateString()}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}