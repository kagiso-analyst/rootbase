'use client'

import { useEffect, useState } from 'react'
import { BarChart2, Leaf, CheckSquare, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { fetchWeather, getWeatherEmoji, type WeatherData } from '@/lib/weather'

type Task = {
  id: string
  title: string
  priority: string
  due_date: string
  status: string
}

type JournalEntry = {
  id: string
  title: string
  content: string
  entry_type: string
  entry_date: string
}

export default function DashboardPage() {
  const [income, setIncome] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [activeCrops, setActiveCrops] = useState(0)
  const [openTasks, setOpenTasks] = useState(0)
  const [tasks, setTasks] = useState<Task[]>([])
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function fetchDashboardData() {
      const now = new Date()
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

      const [
        incomeRes,
        expensesRes,
        cropsRes,
        tasksCountRes,
        tasksRes,
        journalRes,
      ] = await Promise.all([
        supabase.from('income').select('amount').gte('date', firstOfMonth),
        supabase.from('expenses').select('amount').gte('date', firstOfMonth),
        supabase.from('crops').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('tasks').select('id', { count: 'exact' }).neq('status', 'done'),
        supabase.from('tasks').select('*').neq('status', 'done').order('due_date', { ascending: true }).limit(5),
        supabase.from('journal_entries').select('*').order('created_at', { ascending: false }).limit(3),
      ])

      const totalIncome = incomeRes.data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0
      const totalExpenses = expensesRes.data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0

      setIncome(totalIncome)
      setExpenses(totalExpenses)
      setActiveCrops(cropsRes.count || 0)
      setOpenTasks(tasksCountRes.count || 0)
      setTasks(tasksRes.data || [])
      setEntries(journalRes.data || [])

      // Fetch weather using GPS or default to Johannesburg
      if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const w = await fetchWeather(pos.coords.latitude, pos.coords.longitude)
            if (w) setWeather(w)
          },
          async () => {
            const w = await fetchWeather(-26.2041, 28.0473)
            if (w) setWeather(w)
          }
        )
      } else {
        const w = await fetchWeather(-26.2041, 28.0473)
        if (w) setWeather(w)
      }
      setLoading(false)
    }

    fetchDashboardData()
  }, [])

  const net = income - expenses
  const isProfit = net >= 0

  const PRIORITY_COLOURS: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-blue-100 text-blue-700',
    low: 'bg-gray-100 text-gray-600',
  }

  const ENTRY_TYPE_COLOURS: Record<string, string> = {
    General: 'bg-gray-100 text-gray-600',
    Spraying: 'bg-blue-100 text-blue-700',
    Fertilising: 'bg-green-100 text-green-700',
    Irrigation: 'bg-cyan-100 text-cyan-700',
    Harvesting: 'bg-purple-100 text-purple-700',
    Planting: 'bg-lime-100 text-lime-700',
    Scouting: 'bg-orange-100 text-orange-700',
    Maintenance: 'bg-yellow-100 text-yellow-700',
    Weather: 'bg-sky-100 text-sky-700',
    Other: 'bg-gray-100 text-gray-500',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p className="text-sm">Loading your farm dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B4332]">Farm Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome to RootBase — your digital farm HQ</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Income</CardTitle>
            <BarChart2 size={18} className="text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R{income.toFixed(2)}</div>
            <p className="text-xs text-gray-400 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Expenses</CardTitle>
            <BarChart2 size={18} className="text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">R{expenses.toFixed(2)}</div>
            <p className="text-xs text-gray-400 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Net {isProfit ? 'Profit' : 'Loss'}</CardTitle>
            <BarChart2 size={18} className={isProfit ? 'text-[#2D6A4F]' : 'text-red-500'} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isProfit ? 'text-[#2D6A4F]' : 'text-red-500'}`}>R{Math.abs(net).toFixed(2)}</div>
            <p className="text-xs text-gray-400 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Crops</CardTitle>
            <Leaf size={18} className="text-[#2D6A4F]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#2D6A4F]">{activeCrops}</div>
            <p className="text-xs text-gray-400 mt-1">In the ground</p>
          </CardContent>
        </Card>
      </div>

      {/* Weather widget */}
      {weather && (
        <Card className="shadow-sm bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-4xl font-bold">{weather.temp}°C</p>
                  <p className="text-[#D8F3DC] text-sm capitalize mt-0.5">{weather.description}</p>
                </div>
                <div className="text-4xl">{getWeatherEmoji(weather.description)}</div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-[#D8F3DC] text-xs">Humidity</p>
                  <p className="font-semibold">{weather.humidity}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[#D8F3DC] text-xs">Wind</p>
                  <p className="font-semibold">{weather.windSpeed} km/h</p>
                </div>
                <div className="text-center">
                  <p className="text-[#D8F3DC] text-xs">Feels like</p>
                  <p className="font-semibold">{weather.feelsLike}°C</p>
                </div>
                <div className="text-center">
                  <p className="text-[#D8F3DC] text-xs">Location</p>
                  <p className="font-semibold">{weather.city}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {weather.forecast.slice(1, 4).map((day) => (
                  <div key={day.date} className="text-center bg-white/10 rounded-lg px-3 py-2">
                    <p className="text-xs text-[#D8F3DC]">{day.dayName}</p>
                    <p className="text-lg my-1">{getWeatherEmoji(day.description)}</p>
                    <p className="text-xs font-medium">{day.tempMax}°/{day.tempMin}°</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckSquare size={18} className="text-[#2D6A4F]" /> Today's Tasks
            </CardTitle>
            <span className="text-xs text-gray-400">{openTasks} open</span>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <CheckSquare size={32} className="mb-2 opacity-30" />
                <p className="text-sm">No open tasks</p>
                <Link href="/tasks" className="mt-2 text-sm text-[#2D6A4F] hover:underline">Add a task →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        task.priority === 'urgent' ? 'bg-red-500' :
                        task.priority === 'high' ? 'bg-orange-500' :
                        task.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-300'
                      }`} />
                      <p className="text-sm text-gray-700 truncate">{task.title}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_COLOURS[task.priority] || 'bg-gray-100 text-gray-600'}`}>
                        {task.priority}
                      </span>
                      {task.due_date && <span className="text-xs text-gray-400">{task.due_date}</span>}
                    </div>
                  </div>
                ))}
                <Link href="/tasks" className="block text-center text-xs text-[#2D6A4F] hover:underline pt-2">View all tasks →</Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen size={18} className="text-[#2D6A4F]" /> Recent Journal Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <BookOpen size={32} className="mb-2 opacity-30" />
                <p className="text-sm">No journal entries yet</p>
                <Link href="/journal" className="mt-2 text-sm text-[#2D6A4F] hover:underline">Write your first entry →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <div key={entry.id} className="border-b border-gray-50 last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${ENTRY_TYPE_COLOURS[entry.entry_type] || 'bg-gray-100 text-gray-600'}`}>
                        {entry.entry_type}
                      </span>
                      <span className="text-xs text-gray-400">{entry.entry_date}</span>
                    </div>
                    {entry.title && <p className="text-sm font-medium text-gray-700">{entry.title}</p>}
                    <p className="text-xs text-gray-500 truncate mt-0.5">{entry.content}</p>
                  </div>
                ))}
                <Link href="/journal" className="block text-center text-xs text-[#2D6A4F] hover:underline pt-1">View all entries →</Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Add Expense', href: '/finances/expenses', color: 'bg-red-50 text-red-700 hover:bg-red-100' },
          { label: 'Add Income', href: '/finances/income', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
          { label: 'Add Crop', href: '/crops', color: 'bg-[#D8F3DC] text-[#1B4332] hover:bg-[#52B788]/20' },
          { label: 'New Journal Entry', href: '/journal', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
        ].map(({ label, href, color }) => (
          <Link key={href} href={href}>
            <div className={`rounded-lg px-4 py-3 text-center text-sm font-medium transition-colors cursor-pointer ${color}`}>
              {label}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}