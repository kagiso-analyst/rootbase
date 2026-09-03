// app/(dashboard)/ai-assistant/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Sparkles, Send, Bot, TrendingUp, AlertCircle, Lightbulb, 
  Leaf, DollarSign, Calendar, RefreshCw, X,
  Loader2, MessageSquare, CheckCircle, Package, Users,
  TrendingDown, Cloud, HelpCircle, Target, PieChart
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context'
import Link from 'next/link'

// ✅ FIX: Define proper types
type Insight = {
  id: string
  type: 'insight' | 'recommendation' | 'alert'
  title: string
  description: string
  icon: React.ReactNode
  created_at: string
}

// ✅ FIX: Define database types
type IncomeRecord = {
  amount: number
  category: string
}

type ExpenseRecord = {
  amount: number
  category: string
}

type CropRecord = {
  status: string
  crop_name: string
}

type TaskRecord = {
  status: string
  priority: string
  due_date: string
}

type InventoryRecord = {
  name: string
  current_quantity: number
  reorder_level: number
}

// ✅ FIX: Define farm data type
type FarmData = {
  income: number
  expenses: number
  net: number
  activeCrops: number
  overdueTasks: number
  lowStockItems: number
  totalTasks: number
  farmName: string
}

type ChatHistory = {
  question: string
  answer: string
}

const ICON_MAP = {
  profit: <DollarSign className="text-green-500" size={20} />,
  loss: <AlertCircle className="text-red-500" size={20} />,
  crop: <Leaf className="text-emerald-500" size={20} />,
  task: <CheckCircle className="text-orange-500" size={20} />,
  inventory: <Package className="text-blue-500" size={20} />,
  insight: <Lightbulb className="text-yellow-500" size={20} />,
  alert: <AlertCircle className="text-red-500" size={20} />,
  recommendation: <Target className="text-green-500" size={20} />,
  general: <Sparkles className="text-purple-500" size={20} />,
}

export default function AIAssistantPage() {
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState<Insight[]>([])
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  const [showSuggestions, setShowSuggestions] = useState(true)
  const supabase = createClient()
  const { currentFarm, loading: farmLoading } = useFarm()

  // ✅ FIX: Properly typed farm data
  const [farmData, setFarmData] = useState<FarmData>({
    income: 0,
    expenses: 0,
    net: 0,
    activeCrops: 0,
    overdueTasks: 0,
    lowStockItems: 0,
    totalTasks: 0,
    farmName: '',
  })

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setAuthChecked(true)
    }
    checkAuth()
  }, [supabase])

  const fetchInsights = useCallback(async () => {
    if (!currentFarm || !user) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      // ✅ FIX: Add proper type assertions
      const [incomeRes, expensesRes, cropsRes, tasksRes, inventoryRes] = await Promise.all([
        supabase.from('income').select('amount, category').eq('user_id', user.id).eq('farm_id', currentFarm.id),
        supabase.from('expenses').select('amount, category').eq('user_id', user.id).eq('farm_id', currentFarm.id),
        supabase.from('crops').select('status, crop_name').eq('user_id', user.id).eq('farm_id', currentFarm.id),
        supabase.from('tasks').select('status, priority, due_date').eq('user_id', user.id).eq('farm_id', currentFarm.id),
        supabase.from('inventory_items').select('name, current_quantity, reorder_level').eq('user_id', user.id).eq('farm_id', currentFarm.id),
      ])

      // ✅ FIX: Properly type the data
      const incomeData = (incomeRes.data || []) as IncomeRecord[]
      const expensesData = (expensesRes.data || []) as ExpenseRecord[]
      const cropsData = (cropsRes.data || []) as CropRecord[]
      const tasksData = (tasksRes.data || []) as TaskRecord[]
      const inventoryData = (inventoryRes.data || []) as InventoryRecord[]

      const totalIncome = incomeData.reduce((s, r) => s + Number(r.amount), 0)
      const totalExpenses = expensesData.reduce((s, r) => s + Number(r.amount), 0)
      const net = totalIncome - totalExpenses
      const activeCrops = cropsData.filter(c => c.status === 'active')
      const overdueTasks = tasksData.filter(t => t.status !== 'done' && new Date(t.due_date) < new Date())
      const lowStockItems = inventoryData.filter(i => i.reorder_level > 0 && i.current_quantity <= i.reorder_level)

      // Store data for chat
      setFarmData({
        income: totalIncome,
        expenses: totalExpenses,
        net: net,
        activeCrops: activeCrops.length,
        overdueTasks: overdueTasks.length,
        lowStockItems: lowStockItems.length,
        totalTasks: tasksData.length,
        farmName: currentFarm.name,
      })

      const generatedInsights: Insight[] = []

      // Financial insights
      if (net > 5000) {
        generatedInsights.push({
          id: 'profit-insight',
          type: 'insight',
          title: 'Strong Profitability',
          description: `Your farm has generated R${net.toFixed(2)} in profit. Consider reinvesting in high-performing crops or equipment.`,
          icon: ICON_MAP.profit,
          created_at: new Date().toISOString(),
        })
      } else if (net < 0) {
        generatedInsights.push({
          id: 'loss-insight',
          type: 'alert',
          title: 'Operating at a Loss',
          description: `Your farm is R${Math.abs(net).toFixed(2)} in the red. Review your expense categories and consider cost-cutting measures.`,
          icon: ICON_MAP.loss,
          created_at: new Date().toISOString(),
        })
      }

      // Crop insights
      if (activeCrops.length > 0) {
        generatedInsights.push({
          id: 'crop-insight',
          type: 'recommendation',
          title: `${activeCrops.length} Active Crops`,
          description: `You have ${activeCrops.length} crops in the ground. Rotating crops between fields helps maintain soil health.`,
          icon: ICON_MAP.crop,
          created_at: new Date().toISOString(),
        })
      }

      // Task insights
      if (overdueTasks.length > 0) {
        generatedInsights.push({
          id: 'task-insight',
          type: 'alert',
          title: `${overdueTasks.length} Overdue Tasks`,
          description: `You have ${overdueTasks.length} overdue tasks. Prioritize them to avoid further delays.`,
          icon: ICON_MAP.task,
          created_at: new Date().toISOString(),
        })
      }

      // Inventory insights
      if (lowStockItems.length > 0) {
        generatedInsights.push({
          id: 'inventory-insight',
          type: 'alert',
          title: 'Low Stock Alert',
          description: `${lowStockItems.length} items are below reorder level. Review: ${lowStockItems.map(i => i.name).join(', ')}`,
          icon: ICON_MAP.inventory,
          created_at: new Date().toISOString(),
        })
      }

      // General recommendations
      if (generatedInsights.length === 0) {
        generatedInsights.push({
          id: 'general-insight',
          type: 'insight',
          title: 'Your Farm is Running Smoothly',
          description: 'Everything looks good! Continue monitoring your crops, finances, and tasks to maintain this momentum.',
          icon: ICON_MAP.general,
          created_at: new Date().toISOString(),
        })
      }

      setInsights(generatedInsights)
    } catch (err) {
      console.error('Insights error:', err)
    } finally {
      setLoading(false)
    }
  }, [currentFarm, user, supabase])

  useEffect(() => {
    if (authChecked && user) {
      fetchInsights()
    }
  }, [authChecked, user, fetchInsights])

  async function askQuestion() {
    if (!question.trim()) return

    setIsAsking(true)
    setResponse('')
    setShowSuggestions(false)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          farmData: {
            ...farmData,
            farmName: currentFarm?.name,
          }
        }),
      })

      const data = await res.json()
      
      if (data.answer) {
        const answer = data.answer
        setResponse(answer)
        setChatHistory(prev => [...prev, { question: question.trim(), answer }])
      } else if (data.error) {
        setResponse('⚠️ ' + data.error)
      } else {
        setResponse('I couldn\'t process your request. Please try rephrasing your question.')
      }
    } catch (err) {
      console.error('AI error:', err)
      setResponse('Something went wrong. Please try again later.')
    } finally {
      setIsAsking(false)
      setQuestion('')
    }
  }

  const clearChat = () => {
    setChatHistory([])
    setResponse('')
    setQuestion('')
    setShowSuggestions(true)
  }

  const quickQuestions = [
    { icon: <DollarSign size={14} className="text-green-500" />, label: 'Financial health', query: 'How is my farm doing financially?' },
    { icon: <Leaf size={14} className="text-emerald-500" />, label: 'Crop rotation advice', query: 'What crops should I plant next season?' },
    { icon: <CheckCircle size={14} className="text-orange-500" />, label: 'Task management tips', query: 'How can I better manage my farm tasks?' },
    { icon: <Package size={14} className="text-blue-500" />, label: 'Inventory management', query: 'How can I improve my inventory management?' },
  ]

  if (!authChecked || farmLoading || loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-[#2D6A4F] mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading AI Assistant...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">Please Log In</h2>
        <p className="text-sm text-gray-500">You need to be logged in to use the AI Assistant.</p>
        <Link href="/login">
          <Button className="mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            Go to Login
          </Button>
        </Link>
      </div>
    )
  }

  if (!currentFarm) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="text-5xl mb-4">🏠</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">No Farm Selected</h2>
        <p className="text-sm text-gray-500">Please select a farm to use the AI Assistant.</p>
        <Link href="/settings">
          <Button className="mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            Go to Settings
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-[#1B4332]">AI Farm Assistant</h1>
          <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
            {currentFarm.name}
          </Badge>
          <Badge className="bg-purple-100 text-purple-700 text-xs font-medium animate-pulse">
            <Sparkles size={12} className="mr-1" />
            Pro Feature
          </Badge>
        </div>
        <p className="text-gray-500 text-sm mt-1">Get personalized insights and recommendations for your farm</p>
      </div>

      {/* Insights Cards */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight) => (
            <Card key={insight.id} className="shadow-sm border-0 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    {insight.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-800">{insight.title}</h3>
                      <Badge className={`text-xs ${
                        insight.type === 'alert' ? 'bg-red-100 text-red-700' :
                        insight.type === 'insight' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {insight.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI Chat */}
      <Card className="shadow-sm border-0">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot size={18} className="text-[#2D6A4F]" />
            Ask AI Assistant
          </CardTitle>
          {chatHistory.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearChat} className="text-gray-400 hover:text-gray-600">
              <X size={14} className="mr-1" /> Clear
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* Quick Questions */}
          {showSuggestions && chatHistory.length === 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => {
                      setQuestion(q.query)
                      setTimeout(() => askQuestion(), 100)
                    }}
                    className="text-xs bg-gray-50 hover:bg-[#D8F3DC] border border-gray-200 hover:border-[#2D6A4F] rounded-full px-3 py-1.5 transition-colors flex items-center gap-1"
                  >
                    {q.icon}
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Ask anything about your farm..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isAsking && askQuestion()}
              className="flex-1"
              disabled={isAsking}
            />
            <Button
              className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
              onClick={askQuestion}
              disabled={!question.trim() || isAsking}
            >
              {isAsking ? (
                <><Loader2 size={16} className="mr-2 animate-spin" /> Thinking...</>
              ) : (
                <><Send size={16} className="mr-2" /> Ask</>
              )}
            </Button>
          </div>

          {/* Chat History */}
          {chatHistory.length > 0 && (
            <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {chatHistory.map((chat, index) => (
                <div key={index}>
                  <div className="bg-gray-50 rounded-lg p-3 mb-1">
                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                      <MessageSquare size={12} className="text-gray-400" /> You
                    </p>
                    <p className="text-sm text-gray-800">{chat.question}</p>
                  </div>
                  <div className="bg-[#D8F3DC]/20 rounded-lg p-3 border border-[#D8F3DC]/30">
                    <p className="text-xs text-[#2D6A4F] mb-1 flex items-center gap-1">
                      <Bot size={12} className="text-[#2D6A4F]" /> AI Assistant
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{chat.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {response && chatHistory.length === 0 && (
            <div className="mt-4 p-4 bg-[#D8F3DC]/30 rounded-lg border border-[#D8F3DC]">
              <div className="flex items-start gap-3">
                <Bot size={18} className="text-[#2D6A4F] mt-0.5" />
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{response}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}