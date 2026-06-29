'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

const CATEGORIES = [
  'Crop Sales', 'Livestock Sales', 'Wool / Fibre', 'Eggs / Dairy',
  'Contract Work', 'Government Grant', 'Insurance Payout', 'Other',
]

type Income = {
  id: string
  category: string
  description: string
  amount: number
  date: string
  buyer_name: string
  created_at: string
}

export default function IncomePage() {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [buyerName, setBuyerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const supabase = createClient()

  async function fetchIncome() {
    setFetching(true)
    const { data, error } = await supabase
      .from('income')
      .select('*')
      .order('date', { ascending: false })

    if (!error && data) setIncomes(data)
    setFetching(false)
  }

  useEffect(() => {
    fetchIncome()
  }, [])

  const total = incomes.reduce((sum, i) => sum + Number(i.amount), 0)

  async function handleAdd() {
    if (!category || !description || !amount || !date) return
    setLoading(true)

    const { data, error } = await supabase
      .from('income')
      .insert([{
        category,
        description,
        amount: parseFloat(amount),
        date,
        buyer_name: buyerName,
      }])
      .select()
      .single()

    if (!error && data) {
      setIncomes((prev) => [data, ...prev])
      setCategory('')
      setDescription('')
      setAmount('')
      setDate(new Date().toISOString().split('T')[0])
      setBuyerName('')
      setOpen(false)
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('income').delete().eq('id', id)
    if (!error) setIncomes((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332]">Income</h1>
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

      {fetching ? (
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-center py-16 text-gray-400">
            <p className="text-sm">Loading income records...</p>
          </CardContent>
        </Card>
      ) : incomes.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <TrendingUp size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No income recorded yet</p>
            <p className="text-xs mt-1">Click "Add Income" to record your first sale</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
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
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
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
                      className="text-gray-300 hover:text-red-400 transition-colors"
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