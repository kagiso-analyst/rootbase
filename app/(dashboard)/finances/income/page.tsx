// app/(dashboard)/finances/income/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, TrendingUp, Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { cn, formatCurrency } from '@/lib/utils'
import Link from 'next/link'

const CATEGORIES = [
  'Crop Sales', 'Livestock Sales', 'Wool / Fibre', 'Eggs / Dairy',
  'Contract Work', 'Government Grant', 'Insurance Payout', 'Other',
]

type Income = {
  id: string
  category: string
  description: string | null
  amount: number
  date: string
  buyer_name: string | null
  created_at: string | null
  user_id: string
  farm_id: string | null
}

export default function IncomePage() {
  // ===== AUTH STATE =====
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const supabase = createClient()

  // ===== FARM CONTEXT =====
  const { currentFarm, loading: farmLoading } = useFarm()

  // ===== DATA STATE =====
  const [incomes, setIncomes] = useState<Income[]>([])
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [buyerName, setBuyerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ===== CHECK AUTH =====
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (err) {
        console.error('Auth check error:', err)
        setAuthError('Failed to authenticate. Please refresh the page.')
      } finally {
        setAuthChecked(true)
      }
    }
    checkAuth()
  }, [supabase])

  // ===== FETCH INCOME =====
  const fetchIncome = useCallback(async () => {
    if (!currentFarm || !user) {
      setIncomes([])
      setFetching(false)
      return
    }

    setFetching(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('income')
        .select('*')
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)
        .order('date', { ascending: false })

      if (error) throw new Error('Failed to fetch income: ' + error.message)
      if (data) {
        const mappedIncome = data.map((item: any) => ({
          ...item,
          amount: Number(item.amount) || 0,
          description: item.description ?? '',
          buyer_name: item.buyer_name ?? '',
          created_at: item.created_at ?? '',
        })) as Income[]
        setIncomes(mappedIncome)
      }
      
    } catch (err) {
      console.error('Income fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load income records. Please refresh the page.')
    } finally {
      setFetching(false)
    }
  }, [currentFarm, user, supabase])

  useEffect(() => {
    if (authChecked && user) {
      fetchIncome()
    }
  }, [authChecked, user, fetchIncome])

  const total = incomes.reduce((sum, i) => sum + Number(i.amount), 0)

  // ===== ADD INCOME =====
  async function handleAdd() {
    if (!category || !description || !amount || !date) return
    if (!currentFarm || !user) {
      setError('Please select a farm first')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('income')
        .insert([{
          category,
          description,
          amount: parseFloat(amount),
          date,
          buyer_name: buyerName || null,
          user_id: user.id,
          farm_id: currentFarm.id
        }])
        .select()
        .single()

      if (error) throw new Error('Failed to save income: ' + error.message)

      if (data) {
        setIncomes((prev) => [data, ...prev])
        setCategory('')
        setDescription('')
        setAmount('')
        setDate(new Date().toISOString().split('T')[0])
        setBuyerName('')
        setOpen(false)
      }
      
    } catch (err) {
      console.error('Income save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save income. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ===== DELETE INCOME =====
  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this income record?')) return
    if (!currentFarm || !user) return
    
    try {
      const { error } = await supabase
        .from('income')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)

      if (error) throw new Error('Failed to delete income: ' + error.message)

      setIncomes((prev) => prev.filter((i) => i.id !== id))
      
    } catch (err) {
      console.error('Delete error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete income record')
    }
  }

  // ===== LOADING STATE =====
  if (!authChecked || farmLoading || fetching) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">
            {!authChecked ? 'Checking authentication...' : 
             farmLoading ? 'Loading farms...' : 'Loading income records...'}
          </p>
        </div>
      </div>
    )
  }

  // ===== NOT LOGGED IN =====
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">Please Log In</h2>
        <p className="text-sm text-gray-500">You need to be logged in to manage your income.</p>
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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">🏠</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">No Farm Selected</h2>
        <p className="text-sm text-gray-500">Please select a farm to manage your income.</p>
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1B4332]">Income</h1>
            <p className="text-gray-500 text-sm mt-1">Track your farm income</p>
          </div>
        </div>
        <Card className="shadow-sm border-red-200 bg-red-50">
          <CardContent className="py-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-500 text-lg">⚠️</span>
              </div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                setError(null)
                fetchIncome()
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
      {/* Error message inline */}
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

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#1B4332]">Income</h1>
            <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
              💵 {currentFarm.name}
            </Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Total:{' '}
            <span className="font-semibold text-green-600">R{total.toFixed(2)}</span>
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <Button
            className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
            onClick={() => setOpen(true)}
          >
            <Plus size={16} className="mr-2" /> Add Income
          </Button>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Income</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(val) => setCategory(val ?? '')}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="e.g. 500kg tomatoes to Shoprite"
                  value={description}
                  onChange={(e) => setDescription((e.target as HTMLInputElement).value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Buyer / Source</Label>
                <Input
                  placeholder="e.g. Shoprite"
                  value={buyerName}
                  onChange={(e) => setBuyerName((e.target as HTMLInputElement).value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Amount (ZAR)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount((e.target as HTMLInputElement).value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate((e.target as HTMLInputElement).value)}
                />
              </div>
              <Button
                className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                onClick={handleAdd}
                disabled={loading || !category || !description || !amount}
              >
                {loading ? 'Saving...' : 'Save Income'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {incomes.length === 0 ? (
        <Card className="shadow-sm border-0 bg-gradient-to-br from-[#D8F3DC]/20 to-white">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-[#D8F3DC] flex items-center justify-center mb-4">
              <TrendingUp size={32} className="text-[#2D6A4F] opacity-30" />
            </div>
            <p className="text-sm font-medium text-gray-600">No income recorded yet</p>
            <p className="text-xs text-gray-400 mt-1">Click "Add Income" to record your first sale</p>
            <Button 
              variant="outline" 
              className="mt-4 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
              onClick={() => setOpen(true)}
            >
              <Plus size={14} className="mr-2" /> Record Your First Income
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">
              {incomes.length} income record{incomes.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {incomes.map((income) => (
                <div
                  key={income.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                      <TrendingUp size={16} className="text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{income.description}</p>
                      <p className="text-xs text-gray-400">
                        {income.category}
                        {income.buyer_name ? ` · ${income.buyer_name}` : ''}
                        {` · ${income.date}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-green-600">
                      +R{Number(income.amount).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleDelete(income.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}