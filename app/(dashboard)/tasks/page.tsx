'use client'

import { useState, useEffect } from 'react'
import { Plus, CheckSquare, Trash2, Calendar, Flag, RefreshCw } from 'lucide-react' // 👈 ADD RefreshCw
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context' // 👈 ADD THIS
import Link from 'next/link' // 👈 ADD THIS

type Priority = 'low' | 'medium' | 'high' | 'urgent'
type Status = 'todo' | 'done'

type Task = {
  id: string
  title: string
  description: string
  priority: Priority
  status: Status
  due_date: string
  category: string
  created_at: string
  user_id: string
  farm_id: string // 👈 ADD THIS
}

const PRIORITY_STYLES: Record<Priority, string> = {
  low:    'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high:   'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

const PRIORITY_FLAG: Record<Priority, string> = {
  low:    'text-gray-400',
  medium: 'text-blue-500',
  high:   'text-orange-500',
  urgent: 'text-red-500',
}

const CATEGORIES = [
  'Crop Care',
  'Livestock',
  'Irrigation',
  'Equipment',
  'Harvesting',
  'Planting',
  'Spraying',
  'Fertilising',
  'Admin',
  'Maintenance',
  'Labour',
  'Other',
]

function isOverdue(dueDate: string, status: Status): boolean {
  if (status === 'done' || !dueDate) return false
  const today = new Date().toISOString().split('T')[0]
  return dueDate < today
}

export default function TasksPage() {
  // ===== STATE =====
  const [tasks, setTasks] = useState<Task[]>([])
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null) // 👈 ADD THIS
  const [user, setUser] = useState<any>(null) // 👈 ADD THIS
  const [isRefreshing, setIsRefreshing] = useState(false) // 👈 ADD THIS

  // 👇 GET CURRENT FARM
  const { currentFarm, loading: farmLoading } = useFarm()

  const supabase = createClient()

  const todoTasks = tasks.filter(t => t.status === 'todo')
  const doneTasks = tasks.filter(t => t.status === 'done')
  const overdueTasks = todoTasks.filter(t => t.due_date && isOverdue(t.due_date, t.status))
  const urgentCount = todoTasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length

  // ===== FETCH TASKS =====
  async function fetchTasks() {
    // 👇 CHECK IF FARM IS SELECTED
    if (!currentFarm) {
      setTasks([])
      setFetching(false)
      return
    }

    setFetching(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUser(null)
        setTasks([])
        setFetching(false)
        return
      }
      
      setUser(user)

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id) // 👈 FILTER BY FARM!
        .order('created_at', { ascending: false })

      if (error) throw new Error('Failed to fetch tasks: ' + error.message)
      if (data) setTasks(data)
      
    } catch (err) {
      console.error('Tasks error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load tasks. Please refresh the page.')
    } finally {
      setFetching(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [currentFarm]) // 👈 REFETCH WHEN FARM CHANGES!

  // ===== REFRESH HANDLER =====
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchTasks()
  }

  // ===== ADD TASK =====
  async function handleAdd() {
    if (!title) return
    
    // 👇 CHECK IF FARM IS SELECTED
    if (!currentFarm) {
      setError('Please select a farm first')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to add tasks')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert([{ 
          title, 
          description: description || null, 
          priority, 
          status: 'todo', 
          due_date: dueDate || null, 
          category: category || null,
          user_id: user.id,
          farm_id: currentFarm.id // 👈 ALWAYS INCLUDE farm_id!
        }])
        .select()
        .single()

      if (error) throw new Error('Failed to save task: ' + error.message)

      if (data) {
        setTasks((prev) => [data as Task, ...prev])
        setTitle('')
        setDescription('')
        setPriority('medium')
        setDueDate('')
        setCategory('')
        setOpen(false)
      }
      
    } catch (err) {
      console.error('Task save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save task. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ===== TOGGLE TASK DONE =====
  async function toggleDone(id: string) {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    const newStatus = task.status === 'done' ? 'todo' : 'done'
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', id)
        .eq('user_id', user?.id)
        .eq('farm_id', currentFarm?.id) // 👈 FILTER BY FARM!

      if (error) throw new Error('Failed to update task: ' + error.message)

      setTasks(prev =>
        prev.map(t =>
          t.id === id
            ? { ...t, status: newStatus }
            : t
        )
      )
      
    } catch (err) {
      console.error('Toggle error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update task')
    }
  }

  // ===== DELETE TASK =====
  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this task?')) return
    
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)
        .eq('farm_id', currentFarm?.id) // 👈 FILTER BY FARM!

      if (error) throw new Error('Failed to delete task: ' + error.message)

      setTasks(prev => prev.filter(t => t.id !== id))
      
    } catch (err) {
      console.error('Delete error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete task')
    }
  }

  // ===== TASK CARD COMPONENT =====
  function TaskCard({ task }: { task: Task }) {
    const overdue = task.due_date && isOverdue(task.due_date, task.status)

    return (
      <div className={`flex items-start gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors group
        ${task.status === 'done' ? 'opacity-60' : ''}`}>
        <Checkbox
          checked={task.status === 'done'}
          onCheckedChange={() => toggleDone(task.id)}
          className="mt-0.5 border-[#2D6A4F] data-[state=checked]:bg-[#2D6A4F]"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium text-gray-800
              ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>
              {task.title}
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Flag size={13} className={PRIORITY_FLAG[task.priority]} />
              <Badge className={`text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}>
                {task.priority}
              </Badge>
            </div>
          </div>
          {task.description && (
            <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {task.category && (
              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                {task.category}
              </span>
            )}
            {task.due_date && (
              <span className={`flex items-center gap-1 text-xs
                ${overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                <Calendar size={11} />
                {overdue ? 'Overdue · ' : ''}{task.due_date}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => handleDelete(task.id)}
          className="text-gray-300 hover:text-red-400 transition-colors mt-0.5 opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={15} />
        </button>
      </div>
    )
  }

  // ===== LOADING STATE =====
  if (farmLoading || (fetching && !isRefreshing)) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">{farmLoading ? 'Loading farms...' : 'Loading tasks...'}</p>
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
        <p className="text-sm text-gray-500">You need to be logged in to manage your tasks.</p>
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
        <p className="text-sm text-gray-500">Please select or create a farm to manage your tasks.</p>
        <Link href="/settings">
          <Button className="mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            Go to Settings
          </Button>
        </Link>
      </div>
    )
  }

  // ===== ERROR STATE =====
  if (error && !fetching) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1B4332]">Tasks</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your farm tasks</p>
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
              onClick={handleRefresh}
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332]">Tasks</h1>
          <p className="text-gray-500 text-sm mt-1">
            {todoTasks.length} to do
            {overdueTasks.length > 0 && (
              <span className="text-red-500 ml-2">· {overdueTasks.length} overdue</span>
            )}
            {urgentCount > 0 && (
              <span className="text-orange-500 ml-2">· {urgentCount} urgent</span>
            )}
            {currentFarm && (
              <span className="text-xs text-gray-400 ml-2">· {currentFarm.name}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <Button
              className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
              onClick={() => setOpen(true)}
            >
              <Plus size={16} className="mr-2" /> Add Task
            </Button>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Task Title <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="e.g. Spray Field A for aphids"
                    value={title}
                    onChange={(e) => setTitle((e.target as HTMLInputElement).value)}
                    className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description <span className="text-gray-400">(optional)</span></Label>
                  <Input
                    placeholder="Any extra details..."
                    value={description}
                    onChange={(e) => setDescription((e.target as HTMLInputElement).value)}
                    className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={priority}
                      onValueChange={(val) => setPriority((val ?? 'medium') as Priority)}
                    >
                      <SelectTrigger className="border-gray-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={category}
                      onValueChange={(val) => setCategory(val ?? '')}
                    >
                      <SelectTrigger className="border-gray-200">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Due Date <span className="text-gray-400">(optional)</span></Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate((e.target as HTMLInputElement).value)}
                    className="border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
                  />
                </div>

                <Button
                  className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                  onClick={handleAdd}
                  disabled={!title || loading}
                >
                  {loading ? 'Saving...' : 'Save Task'}
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

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'To Do', value: todoTasks.length, color: 'text-[#2D6A4F]', bg: 'bg-[#D8F3DC]/30' },
          { label: 'Overdue', value: overdueTasks.length, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Completed', value: doneTasks.length, color: 'text-gray-400', bg: 'bg-gray-50' },
        ].map(({ label, value, color, bg }) => (
          <Card key={label} className={`shadow-sm border-0 ${bg}`}>
            <CardContent className="pt-4 pb-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-1 font-medium">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Task list */}
      <Tabs defaultValue="todo">
        <TabsList className="bg-[#D8F3DC] p-1 rounded-lg">
          <TabsTrigger
            value="todo"
            className="data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all"
          >
            To Do ({todoTasks.length})
          </TabsTrigger>
          <TabsTrigger
            value="done"
            className="data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all"
          >
            Completed ({doneTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todo" className="mt-4">
          {todoTasks.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <CheckSquare size={32} className="opacity-30" />
                </div>
                <p className="text-sm font-medium text-gray-600">No tasks yet</p>
                <p className="text-xs mt-1">Click "Add Task" to create your first task</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm border-0">
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {todoTasks
                    .sort((a, b) => {
                      const order = { urgent: 0, high: 1, medium: 2, low: 3 }
                      return order[a.priority] - order[b.priority]
                    })
                    .map(task => <TaskCard key={task.id} task={task} />)
                  }
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="done" className="mt-4">
          {doneTasks.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <CheckSquare size={32} className="opacity-30" />
                </div>
                <p className="text-sm font-medium text-gray-600">No completed tasks yet</p>
                <p className="text-xs mt-1">Check off tasks to see them here</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm border-0">
              <CardHeader className="pb-2 border-b border-gray-100">
                <CardTitle className="text-sm text-gray-400 font-medium">
                  {doneTasks.length} task{doneTasks.length !== 1 ? 's' : ''} completed
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {doneTasks.map(task => <TaskCard key={task.id} task={task} />)}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}