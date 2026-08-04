// app/(dashboard)/analytics/costs/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Calculator, TrendingDown, Leaf, Wrench, Save, History,
  ChevronDown, ChevronUp, Trash2, AlertCircle, CheckCircle2,
  Sparkles, TrendingUp, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context'
import { cn, formatCurrency } from '@/lib/utils'
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
  // ===== STATE =====
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
  const [loading, setLoading] = useState(true)

  // 👇 GET CURRENT FARM
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

    setWeekLabel(`${weekAgo.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} – ${today.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}`)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const [expRes, incRes, snapshotRes] = await Promise.all([
      supabase.from('expenses')
        .select('amount, category')
        .gte('date', from)
        .lte('date', to)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id), // 👈 FILTER BY FARM
      supabase.from('income')
        .select('amount')
        .gte('date', from)
        .lte('date', to)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id), // 👈 FILTER BY FARM
      supabase.from('cost_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id) // 👈 FILTER BY FARM
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    const totalExp = expRes.data?.reduce((s, r) => s + (parseFloat(String(r.amount)) || 0), 0) || 0
    const totalInc = incRes.data?.reduce((s, r) => s + (parseFloat(String(r.amount)) || 0), 0) || 0

    const breakdown: Record<string, number> = {}
    expRes.data?.forEach(r => {
      breakdown[r.category] = (breakdown[r.category] || 0) + (parseFloat(String(r.amount)) || 0)
    })

    setActualExpenses(totalExp)
    setActualIncome(totalInc)
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
        farm_id: currentFarm.id, // 👈 ADD farm_id
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

  // ===== LOADING STATE =====
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

  // ===== NO FARM SELECTED =====
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

  // ===== REST OF YOUR UI (with farm name badge) =====
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header with farm badge */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#1B4332]">Weekly Cost Calculator</h1>
            <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs">
              🌱 {currentFarm.name}
            </Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Estimate costs · Compare to actuals · Track over time
          </p>
        </div>
        <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs px-3 py-1">
          📅 Week: {weekLabel}
        </Badge>
      </div>

      {/* ... rest of your existing UI remains the same ... */}
      
      {/* ⚠️ Note: The rest of the component is the same as before */}
      {/* You can keep the exact same JSX from your original component */}
      {/* Just make sure to add farm_id to all Supabase queries */}
    </div>
  )
}