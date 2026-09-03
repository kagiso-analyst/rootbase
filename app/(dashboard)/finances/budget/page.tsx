// app/(dashboard)/finances/budget/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Plus, Trash2, Edit, TrendingUp, TrendingDown, 
  AlertCircle, CheckCircle, Calendar, Target 
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context'
import Link from 'next/link'

const CATEGORIES = [
  'Seed', 'Fertiliser', 'Chemicals / Sprays', 'Labour', 'Fuel',
  'Equipment', 'Transport', 'Irrigation', 'Packaging',
  'Veterinary', 'Feed', 'Repairs', 'Insurance', 'Other',
  'Crop Sales', 'Livestock Sales', 'Wool / Fibre', 'Eggs / Dairy',
  'Contract Work', 'Government Grant', 'Insurance Payout'
]

type Budget = {
  id: string
  category: string
  amount: number
  budget_amount: number  // Added for consistency
  period: 'monthly' | 'quarterly' | 'yearly'
  month: number | null
  year: number
  notes: string | null
  spent_amount: number
  remaining: number
  spent_percentage: number
}

export default function BudgetPage() {
  // ===== AUTH STATE =====
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const supabase = createClient()

  // ===== FARM CONTEXT =====
  const { currentFarm, loading: farmLoading } = useFarm()

  // ===== DATA STATE =====
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Budget | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Form state
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')
  const [notes, setNotes] = useState('')

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

  // ===== FETCH BUDGETS =====
  const fetchBudgets = useCallback(async () => {
    if (!currentFarm || !user) {
      setBudgets([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Fetch budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)
        .eq('year', selectedYear)
        .eq('month', selectedMonth)
        .order('category')

      if (budgetsError) throw budgetsError

      if (!budgetsData || budgetsData.length === 0) {
        setBudgets([])
        setLoading(false)
        return
      }

      // Get start and end dates for the month
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate()
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      // Fetch all expenses for this month once
      const { data: allExpenses } = await supabase
        .from('expenses')
        .select('category, amount')
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)
        .gte('date', startDate)
        .lte('date', endDate)

      // Group expenses by category
      const expenseMap: Record<string, number> = {}
      allExpenses?.forEach(e => {
        expenseMap[e.category] = (expenseMap[e.category] || 0) + Number(e.amount)
      })

      // Build the budget data with spent amounts
      const budgetsWithSpent = budgetsData.map((budget: any) => {
        const spent = expenseMap[budget.category] || 0
        const budgetAmount = Number(budget.amount)
        
        return {
          ...budget,
          budget_amount: budgetAmount,
          spent_amount: spent,
          remaining: budgetAmount - spent,
          spent_percentage: budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0,
        }
      })

      setBudgets(budgetsWithSpent)
    } catch (err) {
      console.error('Budget fetch error:', err)
      setError('Failed to load budgets')
    } finally {
      setLoading(false)
    }
  }, [currentFarm, user, supabase, selectedMonth, selectedYear])

  useEffect(() => {
    if (authChecked && user) {
      fetchBudgets()
    }
  }, [authChecked, user, fetchBudgets])

  // ===== ADD/UPDATE BUDGET =====
  async function handleSave() {
    if (!category || !amount || !currentFarm || !user) {
      setError('Please fill in all required fields')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const budgetData = {
        user_id: user.id,
        farm_id: currentFarm.id,
        category,
        amount: parseFloat(amount),
        period,
        month: selectedMonth,
        year: selectedYear,
        notes: notes || null,
      }

      let result
      if (editing) {
        result = await supabase
          .from('budgets')
          .update(budgetData)
          .eq('id', editing.id)
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
      } else {
        result = await supabase
          .from('budgets')
          .insert([budgetData])
      }

      if (result.error) throw result.error

      setOpen(false)
      setEditing(null)
      resetForm()
      fetchBudgets()
    } catch (err) {
      console.error('Budget save error:', err)
      setError('Failed to save budget')
    } finally {
      setSaving(false)
    }
  }

  // ===== DELETE BUDGET =====
  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this budget?')) return
    if (!user || !currentFarm) return

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)

      if (error) throw error
      fetchBudgets()
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete budget')
    }
  }

  function resetForm() {
    setCategory('')
    setAmount('')
    setPeriod('monthly')
    setNotes('')
  }

  function editBudget(budget: Budget) {
    setEditing(budget)
    setCategory(budget.category)
    setAmount(String(budget.amount))
    setPeriod(budget.period)
    setNotes(budget.notes || '')
    setOpen(true)
  }

  const totalBudget = budgets.reduce((sum, b) => sum + b.budget_amount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent_amount, 0)
  const totalRemaining = totalBudget - totalSpent

  // ===== LOADING STATE =====
  if (!authChecked || farmLoading || loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Loading budget data...</p>
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
        <p className="text-sm text-gray-500">You need to be logged in to manage budgets.</p>
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
        <p className="text-sm text-gray-500">Please select a farm to manage budgets.</p>
        <Link href="/settings">
          <Button className="mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            Go to Settings
          </Button>
        </Link>
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
            <h1 className="text-2xl font-bold text-[#1B4332]">Budget Planning</h1>
            <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
              {currentFarm.name}
            </Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Plan and track your farm spending against budgets
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Month/Year selector */}
          <Select value={String(selectedMonth)} onValueChange={(val) => setSelectedMonth(parseInt(val || '1'))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(parseInt(val || '2026'))}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <Button
              className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
              onClick={() => {
                setEditing(null)
                resetForm()
                setOpen(true)
              }}
            >
              <Plus size={16} className="mr-2" /> Add Budget
            </Button>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Budget' : 'Create Budget'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(val) => setCategory(val || '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Budget Amount (ZAR)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Period</Label>
                  <Select value={period} onValueChange={(val) => setPeriod((val || 'monthly') as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes <span className="text-gray-400">(optional)</span></Label>
                  <Input
                    placeholder="Any notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                  onClick={handleSave}
                  disabled={saving || !category || !amount}
                >
                  {saving ? 'Saving...' : editing ? 'Update Budget' : 'Create Budget'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <Card className="shadow-sm border-red-200 bg-red-50">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <p className="text-sm text-red-700">❌ {error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="text-red-700 hover:bg-red-100"
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-sm border-0 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-gray-400 font-medium">Total Budget</p>
            <p className="text-2xl font-bold text-blue-600">R{totalBudget.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-gray-400 font-medium">Total Spent</p>
            <p className="text-2xl font-bold text-orange-600">R{totalSpent.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className={`shadow-sm border-0 bg-gradient-to-br ${totalRemaining >= 0 ? 'from-green-50 to-white' : 'from-red-50 to-white'}`}>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-gray-400 font-medium">Remaining</p>
            <p className={`text-2xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              R{totalRemaining.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget List */}
      {budgets.length === 0 ? (
        <Card className="shadow-sm border-0 bg-gradient-to-br from-[#D8F3DC]/20 to-white">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Target size={48} className="text-[#2D6A4F] opacity-30 mb-4" />
            <p className="text-sm font-medium text-gray-600">No budgets set for this month</p>
            <p className="text-xs text-gray-400 mt-1">Click "Add Budget" to start planning</p>
            <Button
              variant="outline"
              className="mt-4 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
              onClick={() => {
                setEditing(null)
                resetForm()
                setOpen(true)
              }}
            >
              <Plus size={14} className="mr-2" /> Create Your First Budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget) => {
            const isOverBudget = budget.spent_percentage > 100
            const isCloseToBudget = budget.spent_percentage >= 80 && budget.spent_percentage <= 100

            return (
              <Card key={budget.id} className="shadow-sm border-0 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-800">{budget.category}</h3>
                        <Badge className="text-xs bg-gray-100 text-gray-600">{budget.period}</Badge>
                        {isOverBudget && (
                          <Badge className="text-xs bg-red-100 text-red-700">⚠️ Over Budget</Badge>
                        )}
                        {isCloseToBudget && !isOverBudget && (
                          <Badge className="text-xs bg-orange-100 text-orange-700">⚠️ Approaching Limit</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">Budget: <span className="font-medium text-gray-700">R{budget.budget_amount.toFixed(2)}</span></span>
                        <span className="text-gray-500">Spent: <span className={`font-medium ${isOverBudget ? 'text-red-500' : 'text-gray-700'}`}>R{budget.spent_amount.toFixed(2)}</span></span>
                        <span className={`font-medium ${isOverBudget ? 'text-red-500' : 'text-green-600'}`}>
                          {isOverBudget ? '-' : '+'}R{Math.abs(budget.remaining).toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-2 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            isOverBudget ? 'bg-red-500' :
                            isCloseToBudget ? 'bg-orange-500' :
                            'bg-[#52B788]'
                          }`}
                          style={{ width: `${Math.min(budget.spent_percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => editBudget(budget)}
                        className="text-gray-400 hover:text-[#2D6A4F] transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(budget.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}