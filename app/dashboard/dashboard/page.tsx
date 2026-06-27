import { BarChart2, Leaf, CheckSquare, BookOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const stats = [
  { label: 'Total Income',   value: 'R0.00', sub: 'This month',    icon: BarChart2,   color: 'text-green-600' },
  { label: 'Total Expenses', value: 'R0.00', sub: 'This month',    icon: BarChart2,   color: 'text-red-500'   },
  { label: 'Active Crops',   value: '0',     sub: 'In the ground', icon: Leaf,        color: 'text-[#2D6A4F]' },
  { label: 'Open Tasks',     value: '0',     sub: 'Due this week', icon: CheckSquare, color: 'text-orange-500' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B4332]">Farm Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome to RootBase — your digital farm HQ</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color }) => (
          <Card key={label} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{label}</CardTitle>
              <Icon size={18} className={color} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <p className="text-xs text-gray-400 mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckSquare size={18} className="text-[#2D6A4F]" /> Today's Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <CheckSquare size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No tasks yet — add your first task</p>
              <a href="/tasks" className="mt-2 text-sm text-[#2D6A4F] hover:underline">
                Go to Tasks →
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen size={18} className="text-[#2D6A4F]" /> Recent Journal Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <BookOpen size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No journal entries yet</p>
              <a href="/journal" className="mt-2 text-sm text-[#2D6A4F] hover:underline">
                Write your first entry →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}