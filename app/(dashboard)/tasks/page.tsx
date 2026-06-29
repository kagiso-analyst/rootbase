'use client'

import { useState } from 'react'
import { Plus, CheckSquare, Trash2, Calendar, Flag } from 'lucide-react'
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

type Priority = 'low' | 'medium' | 'high' | 'urgent'
type Status = 'todo' | 'done'

type Task = {
  id: string
  title: string
  description: string
  priority: Priority
  status: Status
  dueDate: string
  category: string
  createdAt: string
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
  if (status === 'done') return false
  return new Date(dueDate) < new Date()
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const todoTasks = tasks.filter(t => t.status === 'todo')
  const doneTasks = tasks.filter(t => t.status === 'done')
  const overdueTasks = todoTasks.filter(t => t.dueDate && isOverdue(t.dueDate, t.status))
  const urgentCount = todoTasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length

  async function handleAdd() {
    if (!title) return
    setLoading(true)
    console.log('Saving to Supabase...')
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ title, description, priority, status: 'todo', due_date: dueDate || null, category }])
      .select()
      .single()
    console.log('Data:', data)
    console.log('Error:', error)
    if (!error && data) {
      setTasks((prev) => [data as Task, ...prev])
      setTitle('')
      setDescription('')
      setPriority('medium')
      setDueDate('')
      setCategory('')
      setOpen(false)
    }
    setLoading(false)
  }

  function toggleDone(id: string) {
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, status: t.status === 'done' ? 'todo' : 'done' }
          : t
      )
    )
  }

  function handleDelete(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  function TaskCard({ task }: { task: Task }) {
    const overdue = task.dueDate && isOverdue(task.dueDate, task.status)

    return (
      <div className={`flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors
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
              <Badge className={`text-xs ${PRIORITY_STYLES[task.priority]}`}>
                {task.priority}
              </Badge>
            </div>
          </div>
          {task.description && (
            <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            {task.category && (
              <span className="text-xs text-gray-400">{task.category}</span>
            )}
            {task.dueDate && (
              <span className={`flex items-center gap-1 text-xs
                ${overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                <Calendar size={11} />
                {overdue ? 'Overdue · ' : ''}{task.dueDate}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => handleDelete(task.id)}
          className="text-gray-300 hover:text-red-400 transition-colors mt-0.5"
        >
          <Trash2 size={15} />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
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
          </p>
        </div>

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
                <Label>Task Title</Label>
                <Input
                  placeholder="e.g. Spray Field A for aphids"
                  value={title}
                  onChange={(e) => setTitle((e.target as HTMLInputElement).value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Description <span className="text-gray-400">(optional)</span></Label>
                <Input
                  placeholder="Any extra details..."
                  value={description}
                  onChange={(e) => setDescription((e.target as HTMLInputElement).value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={priority}
                    onValueChange={(val) => setPriority((val ?? 'medium') as Priority)}
                  >
                    <SelectTrigger>
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
                    <SelectTrigger>
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
                />
              </div>

              <Button
                className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                onClick={handleAdd}
                disabled={!title}
              >
                Save Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'To Do',     value: todoTasks.length,  color: 'text-[#2D6A4F]' },
          { label: 'Overdue',   value: overdueTasks.length, color: 'text-red-500'  },
          { label: 'Completed', value: doneTasks.length,  color: 'text-gray-400'  },
        ].map(({ label, value, color }) => (
          <Card key={label} className="shadow-sm text-center">
            <CardContent className="pt-4 pb-4">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Task list */}
      <Tabs defaultValue="todo">
        <TabsList className="bg-[#D8F3DC]">
          <TabsTrigger
            value="todo"
            className="data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white"
          >
            To Do ({todoTasks.length})
          </TabsTrigger>
          <TabsTrigger
            value="done"
            className="data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white"
          >
            Completed ({doneTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todo" className="mt-4">
          {todoTasks.length === 0 ? (
            <Card className="shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
                <CheckSquare size={40} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">No tasks yet</p>
                <p className="text-xs mt-1">Click "Add Task" to create your first task</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm">
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
                <CheckSquare size={40} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">No completed tasks yet</p>
                <p className="text-xs mt-1">Check off tasks to see them here</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm text-gray-400">
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