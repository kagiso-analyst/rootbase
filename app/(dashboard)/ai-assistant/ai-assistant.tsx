// app/(dashboard)/ai-assistant/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Sparkles, Send, Bot, TrendingUp, AlertCircle, Lightbulb, 
  Leaf, DollarSign, Calendar, RefreshCw, X 
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context'
import Link from 'next/link'

type Insight = {
  id: string
  type: 'insight' | 'recommendation' | 'alert'
  title: string
  description: string
  icon: string
  created_at: string
}

export default function AIAssistantPage() {
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState<Insight[]>([])
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [chatHistory, setChatHistory] = useState<{ question: string; answer: string }[]>([])
  const supabase = createClient()
  const { currentFarm, loading: farmLoading } = useFarm()

  // Store fetched data for use in chat
  const [farmData, setFarmData] = useState<any>({
    income: 0,
    expenses: 0,
    net: 0,
    activeCrops: 0,
    overdueTasks: 0,
    lowStockItems: 0,
    totalTasks: 0,
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
      // Fetch farm data for insights
      const [incomeRes, expensesRes, cropsRes, tasksRes, inventoryRes] = await Promise.all([
        supabase.from('income').select('amount, category').eq('user_id', user.id).eq('farm_id', currentFarm.id),
        supabase.from('expenses').select('amount, category').eq('user_id', user.id).eq('farm_id', currentFarm.id),
        supabase.from('crops').select('status, crop_name').eq('user_id', user.id).eq('farm_id', currentFarm.id),
        supabase.from('tasks').select('status, priority, due_date').eq('user_id', user.id).eq('farm_id', currentFarm.id),
        supabase.from('inventory_items').select('name, current_quantity, reorder_level').eq('user_id', user.id).eq('farm_id', currentFarm.id),
      ])

      const totalIncome = incomeRes.data?.reduce((s, r) => s + Number(r.amount), 0) || 0
      const totalExpenses = expensesRes.data?.reduce((s, r) => s + Number(r.amount), 0) || 0
      const net = totalIncome - totalExpenses
      const activeCrops = cropsRes.data?.filter(c => c.status === 'active') || []
      const overdueTasks = tasksRes.data?.filter(t => t.status !== 'done' && new Date(t.due_date) < new Date()) || []
      const lowStockItems = inventoryRes.data?.filter(i => i.reorder_level > 0 && i.current_quantity <= i.reorder_level) || []

      // Store data for chat
      setFarmData({
        income: totalIncome,
        expenses: totalExpenses,
        net: net,
        activeCrops: activeCrops.length,
        overdueTasks: overdueTasks.length,
        lowStockItems: lowStockItems.length,
        totalTasks: tasksRes.data?.length || 0,
      })

      const generatedInsights: Insight[] = []

      // Financial insights
      if (net > 5000) {
        generatedInsights.push({
          id: 'profit-insight',
          type: 'insight',
          title: 'Strong Profitability',
          description: `Your farm has generated R${net.toFixed(2)} in profit. Consider reinvesting in high-performing crops or equipment.`,
          icon: '💰',
          created_at: new Date().toISOString(),
        })
      } else if (net < 0) {
        generatedInsights.push({
          id: 'loss-insight',
          type: 'alert',
          title: 'Operating at a Loss',
          description: `Your farm is R${Math.abs(net).toFixed(2)} in the red. Review your expense categories and consider cost-cutting measures.`,
          icon: '⚠️',
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
          icon: '🌱',
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
          icon: '📋',
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
          icon: '📦',
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
          icon: '✅',
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

    // In production, this would call an AI API (OpenAI, Claude, etc.)
    // For now, we'll use smart responses based on keywords
    const lowerQuestion = question.toLowerCase()
    let answer = ''

    await new Promise(resolve => setTimeout(resolve, 1500))

    if (lowerQuestion.includes('profit') || lowerQuestion.includes('money') || lowerQuestion.includes('income')) {
      answer = `Based on your farm data, your current net profit is R${farmData.net.toFixed(2)}. Your top income sources are likely your most profitable crops. I recommend focusing on high-margin crops and tracking expenses closely.`
    } else if (lowerQuestion.includes('crop') || lowerQuestion.includes('plant') || lowerQuestion.includes('harvest')) {
      answer = `You have ${farmData.activeCrops} active crops. I recommend checking your planting schedule and ensuring you're rotating crops between fields to maintain soil health. Consider diversifying if you're relying on a single crop.`
    } else if (lowerQuestion.includes('task') || lowerQuestion.includes('todo') || lowerQuestion.includes('reminder')) {
      answer = `You have ${farmData.overdueTasks} overdue tasks out of ${farmData.totalTasks} total tasks. I recommend prioritizing urgent tasks first, then tackling high-priority items. Would you like me to help you organize your task list?`
    } else if (lowerQuestion.includes('weather') || lowerQuestion.includes('rain') || lowerQuestion.includes('sun')) {
      answer = `Weather plays a crucial role in farming. I recommend checking the weather forecast daily for your area. For optimal results, plan spraying and harvesting during dry conditions, and irrigation during dry spells.`
    } else if (lowerQuestion.includes('inventory') || lowerQuestion.includes('stock') || lowerQuestion.includes('supply')) {
      answer = `You have ${farmData.lowStockItems} items that need reordering. I recommend reviewing your inventory weekly and setting up automatic reordering for critical supplies like seed and fertiliser.`
    } else if (lowerQuestion.includes('help') || lowerQuestion.includes('what can') || lowerQuestion.includes('how to')) {
      answer = `I can help you with: farm finances, crop management, livestock care, task organization, inventory tracking, and weather planning. Just ask me anything about your farm!`
    } else {
      answer = `That's a great question! Based on your farm data, I recommend analyzing your current operations and focusing on what's working best. Would you like me to provide more specific insights about a particular area?`
    }

    setResponse(answer)
    setChatHistory(prev => [...prev, { question, answer }])
    setIsAsking(false)
  }

  const clearChat = () => {
    setChatHistory([])
    setResponse('')
    setQuestion('')
  }

  if (!authChecked || farmLoading || loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
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
                  <div className="text-2xl">{insight.icon}</div>
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
          <div className="flex gap-2">
            <Input
              placeholder="Ask anything about your farm..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askQuestion()}
              className="flex-1"
            />
            <Button
              className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
              onClick={askQuestion}
              disabled={!question.trim() || isAsking}
            >
              {isAsking ? (
                <><RefreshCw size={16} className="mr-2 animate-spin" /> Thinking...</>
              ) : (
                <><Send size={16} className="mr-2" /> Ask</>
              )}
            </Button>
          </div>

          {/* Chat History */}
          {chatHistory.length > 0 && (
            <div className="mt-4 space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {chatHistory.map((chat, index) => (
                <div key={index}>
                  <div className="bg-gray-50 rounded-lg p-3 mb-1">
                    <p className="text-xs text-gray-400 mb-1">You</p>
                    <p className="text-sm text-gray-800">{chat.question}</p>
                  </div>
                  <div className="bg-[#D8F3DC]/20 rounded-lg p-3 border border-[#D8F3DC]/30">
                    <p className="text-xs text-[#2D6A4F] mb-1">AI Assistant</p>
                    <p className="text-sm text-gray-700">{chat.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {response && chatHistory.length === 0 && (
            <div className="mt-4 p-4 bg-[#D8F3DC]/30 rounded-lg border border-[#D8F3DC]">
              <div className="flex items-start gap-3">
                <Bot size={18} className="text-[#2D6A4F] mt-0.5" />
                <p className="text-sm text-gray-700">{response}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}