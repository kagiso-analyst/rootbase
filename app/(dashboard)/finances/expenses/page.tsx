// app/(dashboard)/finances/expenses/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Receipt, Sparkles } from 'lucide-react' // 👈 ADD Sparkles
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge' // 👈 ADD THIS
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
import { useFarm } from '@/lib/farm-context' // 👈 ADD THIS
import { cn, formatCurrency } from '@/lib/utils' // 👈 ADD THIS
import Link from 'next/link'

const CATEGORIES = [
  'Seed', 'Fertiliser', 'Chemicals / Sprays', 'Labour', 'Fuel',
  'Equipment', 'Transport', 'Irrigation', 'Packaging',
  'Veterinary', 'Feed', 'Repairs', 'Insurance', 'Other',
]

type Expense = {
  id: string
  category: string
  description: string | null
  amount: number
  date: string
  created_at: string | null
  user_id: string
  farm_id: string | null
}

export default function ExpensesPage() {
  // ===== STATE =====
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  // 👇 GET CURRENT FARM
  const { currentFarm, loading: farmLoading } = useFarm()

  const supabase = createClient()

  // ===== FETCH EXPENSES =====
  async function fetchExpenses() {
    // 👇 CHECK IF FARM IS SELECTED
    if (!currentFarm) {
      setExpenses([])
      setFetching(false)
      return
    }

    setFetching(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUser(null)
        setExpenses([])
        setFetching(false)
        return
      }
      
      setUser(user)

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id) // 👈 FILTER BY FARM
        .order('date', { ascending: false })

      if (error) throw new Error('Failed to fetch expenses: ' + error.message)
      if (data) {
        const mappedExpenses = (data as Array<Partial<Expense>>).map((item) => ({
          ...item,
          amount: Number(item.amount) || 0,
          description: item.description ?? '',
          created_at: item.created_at ?? '',
        })) as Expense[]
        setExpenses(mappedExpenses)
      }
      
    } catch (err) {
      console.error('Expenses fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load expenses. Please refresh the page.')
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [currentFarm]) // 👈 REFETCH WHEN FARM CHANGES

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  // ===== ADD EXPENSE =====
  async function handleAdd() {
    if (!category || !description || !amount || !date) return
    if (!currentFarm) {
      setError('Please select a farm first')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to add expenses')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('expenses')
        .insert([{ 
          category, 
          description, 
          amount: parseFloat(amount), 
          date,
          user_id: user.id,
          farm_id: currentFarm.id // 👈 ADD farm_id
        }])
        .select()
        .single()

      if (error) throw new Error('Failed to save expense: ' + error.message)

      if (data) {
        setExpenses((prev) => [data, ...prev])
        setCategory('')
        setDescription('')
        setAmount('')
        setDate(new Date().toISOString().split('T')[0])
        setOpen(false)
      }
      
    } catch (err) {
      console.error('Expense save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save expense. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ===== DELETE EXPENSE =====
  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this expense?')) return
    if (!currentFarm) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to delete expenses')
        return
      }

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id) // 👈 FILTER BY FARM

      if (error) throw new Error('Failed to delete expense: ' + error.message)

      setExpenses((prev) => prev.filter((e) => e.id !== id))
      
    } catch (err) {
      console.error('Delete error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete expense')
    }
  }

  // ===== LOADING STATE =====
  if (farmLoading || fetching) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">{farmLoading ? 'Loading farms...' : 'Loading expenses...'}</p>
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
        <p className="text-sm text-gray-500">You need to be logged in to manage your expenses.</p>
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
        <p className="text-sm text-gray-500">Please select a farm to manage your expenses.</p>
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

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#1B4332]">Expenses</h1>
            <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
              💰 {currentFarm.name}
            </Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Total:{' '}
            <span className="font-semibold text-red-500">R{total.toFixed(2)}</span>
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <Button
            className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
            onClick={() => setOpen(true)}
          >
            <Plus size={16} className="mr-2" /> Add Expense
          </Button>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
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
                  placeholder="e.g. 50kg LAN fertiliser"
                  value={description}
                  onChange={(e) => setDescription((e.target as HTMLInputElement).value)}
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
                {loading ? 'Saving...' : 'Save Expense'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {expenses.length === 0 ? (
        <Card className="shadow-sm border-0 bg-gradient-to-br from-[#D8F3DC]/20 to-white">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-[#D8F3DC] flex items-center justify-center mb-4">
              <Receipt size={32} className="text-[#2D6A4F] opacity-30" />
            </div>
            <p className="text-sm font-medium text-gray-600">No expenses yet</p>
            <p className="text-xs text-gray-400 mt-1">Click "Add Expense" to record your first one</p>
            <Button 
              variant="outline" 
              className="mt-4 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
              onClick={() => setOpen(true)}
            >
              <Plus size={14} className="mr-2" /> Record Your First Expense
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-sm text-gray-500">
              {expenses.length} expense{expenses.length !== 1 ? 's' : ''} recorded
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                      <Receipt size={16} className="text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{expense.description}</p>
                      <p className="text-xs text-gray-400">
                        {expense.category} · {expense.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-red-500">
                      −R{Number(expense.amount).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleDelete(expense.id)}
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