// app/(dashboard)/finances/recurring/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Plus, Trash2, Edit, RefreshCw, Calendar, 
  Clock, TrendingUp, TrendingDown, DollarSign,
  AlertCircle, CheckCircle2, Pause, Play,
  ArrowLeft
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

type RecurringTransaction = {
  id: string
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  start_date: string
  end_date: string | null
  next_date: string
  is_active: boolean
  buyer_name: string | null
  notes: string | null
}

const INCOME_CATEGORIES = [
  'Crop Sales', 'Livestock Sales', 'Wool / Fibre', 'Eggs / Dairy',
  'Contract Work', 'Government Grant', 'Insurance Payout', 'Other'
]

const EXPENSE_CATEGORIES = [
  'Seed', 'Fertiliser', 'Chemicals / Sprays', 'Labour', 'Fuel',
  'Equipment', 'Transport', 'Irrigation', 'Packaging',
  'Veterinary', 'Feed', 'Repairs', 'Insurance', 'Other'
]

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

export default function RecurringTransactionsPage() {
  // ===== AUTH STATE =====
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const supabase = createClient()

  // ===== FARM CONTEXT =====
  const { currentFarm, loading: farmLoading } = useFarm()

  // ===== DATA STATE =====
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<RecurringTransaction | null>(null)
  const [saving, setSaving] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')

  // Form state
  const [type, setType] = useState<'income' | 'expense'>('income')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [buyerName, setBuyerName] = useState('')
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

  // ===== FETCH DATA =====
  const fetchTransactions = useCallback(async () => {
    if (!currentFarm || !user) {
      setTransactions([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)
        .order('next_date', { ascending: true })

      if (error) throw error
      setTransactions((data || []) as RecurringTransaction[])
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to load recurring transactions')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [currentFarm, user, supabase])

  useEffect(() => {
    if (authChecked && user) {
      fetchTransactions()
    }
  }, [authChecked, user, fetchTransactions])

  // ===== SAVE TRANSACTION =====
  async function handleSave() {
    if (!category || !description || !amount || !startDate) {
      setError('Please fill in all required fields')
      return
    }

    if (!currentFarm || !user) {
      setError('Please select a farm first')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const data = {
        user_id: user.id,
        farm_id: currentFarm.id,
        type,
        category,
        description,
        amount: parseFloat(amount),
        frequency,
        start_date: startDate,
        end_date: endDate || null,
        next_date: startDate,
        is_active: true,
        buyer_name: buyerName || null,
        notes: notes || null,
      }

      let result
      if (editing) {
        result = await supabase
          .from('recurring_transactions')
          .update(data)
          .eq('id', editing.id)
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
      } else {
        result = await supabase
          .from('recurring_transactions')
          .insert([data])
      }

      if (result.error) throw result.error

      setOpen(false)
      setEditing(null)
      resetForm()
      fetchTransactions()
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save recurring transaction')
    } finally {
      setSaving(false)
    }
  }

  // ===== TOGGLE ACTIVE =====
  async function toggleActive(id: string, currentStatus: boolean) {
    if (!currentFarm || !user) return

    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)

      if (error) throw error
      fetchTransactions()
    } catch (err) {
      console.error('Toggle error:', err)
      setError('Failed to update status')
    }
  }

  // ===== DELETE =====
  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this recurring transaction?')) return
    if (!currentFarm || !user) return

    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)

      if (error) throw error
      fetchTransactions()
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete recurring transaction')
    }
  }

  function resetForm() {
    setType('income')
    setCategory('')
    setDescription('')
    setAmount('')
    setFrequency('monthly')
    setStartDate(new Date().toISOString().split('T')[0])
    setEndDate('')
    setBuyerName('')
    setNotes('')
  }

  function editTransaction(t: RecurringTransaction) {
    setEditing(t)
    setType(t.type)
    setCategory(t.category)
    setDescription(t.description)
    setAmount(String(t.amount))
    setFrequency(t.frequency)
    setStartDate(t.start_date)
    setEndDate(t.end_date || '')
    setBuyerName(t.buyer_name || '')
    setNotes(t.notes || '')
    setOpen(true)
  }

  const filtered = transactions.filter(t => 
    filterType === 'all' ? true : t.type === filterType
  )

  const totalMonthly = transactions
    .filter(t => t.is_active)
    .reduce((sum, t) => {
      const monthlyMultiplier = {
        daily: 30,
        weekly: 4.33,
        monthly: 1,
        quarterly: 0.33,
        yearly: 0.083,
      }
      return sum + (t.amount * (monthlyMultiplier[t.frequency] || 1))
    }, 0)

  // ===== LOADING STATE =====
  if (!authChecked || farmLoading || (loading && !isRefreshing)) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Loading recurring transactions...</p>
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
        <p className="text-sm text-gray-500">You need to be logged in to manage recurring transactions.</p>
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
        <p className="text-sm text-gray-500">Please select a farm to manage recurring transactions.</p>
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
            <div className="flex items-center gap-3">
              <Link href="/finances">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft size={18} />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-[#1B4332]">Recurring Transactions</h1>
            </div>
            <p className="text-gray-500 text-sm mt-1">Automate your regular income and expenses</p>
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
              onClick={() => {
                setError(null)
                fetchTransactions()
              }}
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
                <h1 className="text-2xl font-bold text-[#1B4332]">Recurring Transactions</h1>
                <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
                  {currentFarm.name}
                </Badge>
              </div>
              <p className="text-gray-500 text-sm mt-1">
                Automate your regular income and expenses
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
            onClick={() => {
              setIsRefreshing(true)
              fetchTransactions()
            }}
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <Button
              className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
              onClick={() => {
                setEditing(null)
                resetForm()
                setOpen(true)
              }}
            >
              <Plus size={16} className="mr-2" /> Add Recurring
            </Button>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Recurring Transaction' : 'Add Recurring Transaction'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setType('income')}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 text-center transition-all ${
                        type === 'income'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <TrendingUp size={16} className="mx-auto mb-1" />
                      Income
                    </button>
                    <button
                      onClick={() => setType('expense')}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 text-center transition-all ${
                        type === 'expense'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <TrendingDown size={16} className="mx-auto mb-1" />
                      Expense
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(val) => setCategory(val || '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="e.g. Monthly insurance payment"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Amount (ZAR)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select value={frequency} onValueChange={(val) => setFrequency(val as any || 'monthly')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCIES.map((f) => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date <span className="text-gray-400">(optional)</span></Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                {type === 'income' && (
                  <div className="space-y-2">
                    <Label>Buyer / Source <span className="text-gray-400">(optional)</span></Label>
                    <Input
                      placeholder="e.g. Shoprite"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                    />
                  </div>
                )}

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
                  disabled={saving || !category || !description || !amount}
                >
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-sm border-0 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-gray-400 font-medium">Active Recurring</p>
            <p className="text-2xl font-bold text-green-600">
              {transactions.filter(t => t.is_active).length}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-gray-400 font-medium">Monthly Total</p>
            <p className="text-2xl font-bold text-blue-600">
              R{totalMonthly.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-xs text-gray-400 font-medium">Upcoming</p>
            <p className="text-2xl font-bold text-amber-600">
              {transactions.filter(t => t.is_active && new Date(t.next_date) <= new Date()).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'income', 'expense'].map((f) => (
          <button
            key={f}
            onClick={() => setFilterType(f as any)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
              filterType === f
                ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-sm'
                : 'bg-white text-gray-500 border-gray-200 hover:border-[#2D6A4F] hover:text-[#2D6A4F]'
            }`}
          >
            {f === 'all' ? 'All' : f === 'income' ? 'Income' : 'Expenses'}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      {filtered.length === 0 ? (
        <Card className="shadow-sm border-0 bg-gradient-to-br from-[#D8F3DC]/20 to-white">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Clock size={48} className="text-[#2D6A4F] opacity-30 mb-4" />
            <p className="text-sm font-medium text-gray-600">No recurring transactions set up</p>
            <p className="text-xs text-gray-400 mt-1">Create automated income or expense schedules</p>
            <Button
              variant="outline"
              className="mt-4 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
              onClick={() => {
                setEditing(null)
                resetForm()
                setOpen(true)
              }}
            >
              <Plus size={14} className="mr-2" /> Add Your First Recurring Transaction
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => {
            const isUpcoming = new Date(t.next_date) <= new Date() && t.is_active
            const isExpired = t.end_date && new Date(t.end_date) < new Date()

            return (
              <Card key={t.id} className={`shadow-sm border-0 hover:shadow-md transition-shadow ${
                !t.is_active ? 'opacity-60' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {t.type === 'income' ? (
                          <TrendingUp size={16} className="text-green-600" />
                        ) : (
                          <TrendingDown size={16} className="text-red-500" />
                        )}
                        <h3 className="text-sm font-semibold text-gray-800">{t.description}</h3>
                        <Badge className={`text-xs ${
                          t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {t.type}
                        </Badge>
                        {!t.is_active && (
                          <Badge className="text-xs bg-gray-100 text-gray-600">Paused</Badge>
                        )}
                        {isUpcoming && t.is_active && (
                          <Badge className="text-xs bg-amber-100 text-amber-700">Due Soon</Badge>
                        )}
                        {isExpired && (
                          <Badge className="text-xs bg-red-100 text-red-700">Expired</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <span className="text-gray-500">Category: <span className="font-medium text-gray-700">{t.category}</span></span>
                        <span className="text-gray-500">Amount: <span className={`font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                          {t.type === 'income' ? '+' : '-'}R{t.amount.toFixed(2)}
                        </span></span>
                        <span className="text-gray-500">Frequency: <span className="font-medium text-gray-700">{t.frequency}</span></span>
                        <span className="text-gray-500">Next: <span className="font-medium text-gray-700">{t.next_date}</span></span>
                        {t.buyer_name && (
                          <span className="text-gray-500">Buyer: <span className="font-medium text-gray-700">{t.buyer_name}</span></span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => toggleActive(t.id, t.is_active)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          t.is_active 
                            ? 'text-gray-400 hover:text-amber-500 hover:bg-amber-50' 
                            : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
                        }`}
                        title={t.is_active ? 'Pause' : 'Resume'}
                      >
                        {t.is_active ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <button
                        onClick={() => editTransaction(t)}
                        className="text-gray-400 hover:text-[#2D6A4F] transition-colors p-1.5 hover:bg-[#D8F3DC] rounded-lg"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-lg"
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