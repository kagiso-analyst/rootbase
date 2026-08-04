// app/(dashboard)/notifications/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { Bell, AlertTriangle, CheckSquare, Package, Wrench, RefreshCw, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context'
import { cn, getSeasonalGreeting } from '@/lib/utils'
import Link from 'next/link'

type Notification = {
  id: string
  type: 'overdue_task' | 'low_stock' | 'service_due' | 'expiry'
  title: string
  description: string
  severity: 'urgent' | 'warning' | 'info'
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [greeting, setGreeting] = useState('')

  const { currentFarm, loading: farmLoading } = useFarm()
  const supabase = createClient()

  async function buildNotifications() {
    if (!currentFarm) {
      setNotifications([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const alerts: Notification[] = []
      const today = new Date().toISOString().split('T')[0]

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUser(null)
        setNotifications([])
        setLoading(false)
        return
      }
      
      setUser(user)

      const seasonal = getSeasonalGreeting(user.user_metadata?.full_name?.split(' ')[0] || 'Farmer')
      setGreeting(seasonal.greeting)

      const [tasksRes, inventoryRes, equipmentRes, documentsRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id)
          .eq('status', 'todo')
          .lt('due_date', today),
        supabase
          .from('inventory_items')
          .select('*')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id),
        supabase
          .from('equipment')
          .select('*')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id),
        supabase
          .from('documents')
          .select('*')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id),
      ])

      if (tasksRes.error) throw new Error('Failed to fetch tasks: ' + tasksRes.error.message)
      if (inventoryRes.error) throw new Error('Failed to fetch inventory: ' + inventoryRes.error.message)
      if (equipmentRes.error) throw new Error('Failed to fetch equipment: ' + equipmentRes.error.message)
      if (documentsRes.error) throw new Error('Failed to fetch documents: ' + documentsRes.error.message)

      const overdueTasks = tasksRes.data || []
      overdueTasks.forEach(task => {
        alerts.push({
          id: `task-${task.id}`,
          type: 'overdue_task',
          title: `Overdue task: ${task.title}`,
          description: `Was due on ${task.due_date} · Priority: ${task.priority}`,
          severity: task.priority === 'urgent' || task.priority === 'high' ? 'urgent' : 'warning',
        })
      })

      const inventoryItems = inventoryRes.data || []
      inventoryItems
        .filter(i => i.reorder_level > 0 && i.current_quantity <= i.reorder_level)
        .forEach(item => {
          alerts.push({
            id: `stock-${item.id}`,
            type: 'low_stock',
            title: `Low stock: ${item.name}`,
            description: `${item.current_quantity} ${item.unit} remaining — reorder level is ${item.reorder_level} ${item.unit}`,
            severity: 'warning',
          })
        })

      const equipment = equipmentRes.data || []
      equipment.forEach(equip => {
        if (equip.next_service_date) {
          const days = Math.ceil(
            (new Date(equip.next_service_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
          if (days <= 14) {
            alerts.push({
              id: `equip-${equip.id}`,
              type: 'service_due',
              title: `Service due: ${equip.name}`,
              description: days <= 0
                ? `Service was due on ${equip.next_service_date}`
                : `Service due in ${days} days — ${equip.next_service_date}`,
              severity: days <= 0 ? 'urgent' : 'warning',
            })
          }
        }
      })

      const documents = documentsRes.data || []
      documents.forEach(doc => {
        if (!doc.expiry_date) return
        const days = Math.ceil(
          (new Date(doc.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
        if (days <= 30) {
          alerts.push({
            id: `doc-${doc.id}`,
            type: 'expiry',
            title: `Document expiring: ${doc.name}`,
            description: days <= 0
              ? `Expired on ${doc.expiry_date} — renew immediately`
              : `Expires in ${days} day${days !== 1 ? 's' : ''} on ${doc.expiry_date}`,
            severity: days <= 7 ? 'urgent' : 'warning',
          })
        }
      })

      const order = { urgent: 0, warning: 1, info: 2 }
      alerts.sort((a, b) => order[a.severity] - order[b.severity])

      setNotifications(alerts)
      
    } catch (err) {
      console.error('Notification build error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load notifications. Please refresh the page.')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    buildNotifications()
  }, [currentFarm])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await buildNotifications()
  }

  const SEVERITY_STYLES = {
    urgent:  { 
      badge: 'bg-red-100 text-red-700', 
      icon: 'text-red-500', 
      bg: 'border-l-red-500',
      dot: 'bg-red-500',
    },
    warning: { 
      badge: 'bg-orange-100 text-orange-700', 
      icon: 'text-orange-500', 
      bg: 'border-l-orange-400',
      dot: 'bg-orange-400',
    },
    info: { 
      badge: 'bg-blue-100 text-blue-700', 
      icon: 'text-blue-500', 
      bg: 'border-l-blue-400',
      dot: 'bg-blue-400',
    },
  }

  const TYPE_ICONS = {
    overdue_task: CheckSquare,
    low_stock:    Package,
    service_due:  Wrench,
    expiry:       AlertTriangle,
  }

  if (farmLoading || (loading && !isRefreshing)) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">{farmLoading ? 'Loading farms...' : 'Checking for alerts...'}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">Please Log In</h2>
        <p className="text-sm text-gray-500">You need to be logged in to view your notifications.</p>
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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">🏠</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">No Farm Selected</h2>
        <p className="text-sm text-gray-500">Please select a farm to view notifications.</p>
        <Link href="/settings">
          <Button className="mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            Go to Settings
          </Button>
        </Link>
      </div>
    )
  }

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1B4332]">Notifications</h1>
            <p className="text-gray-500 text-sm mt-1">Stay on top of your farm alerts</p>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#1B4332]">Notifications</h1>
            <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
              🔔 {currentFarm.name}
            </Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
            <span>{greeting || 'Stay on top of alerts'}</span>
            <span className="text-base">{getSeasonalGreeting(user?.user_metadata?.full_name?.split(' ')[0] || 'Farmer').emoji}</span>
          </p>
        </div>
        <Button
          variant="outline"
          className="border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw size={14} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

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

      {notifications.length === 0 ? (
        <Card className="shadow-sm border-0 bg-gradient-to-br from-[#D8F3DC] to-white">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-[#D8F3DC] flex items-center justify-center mb-4">
              <Bell size={36} className="text-[#2D6A4F]" />
            </div>
            <p className="text-lg font-semibold text-[#1B4332]">All clear! 🎉</p>
            <p className="text-sm text-gray-500 mt-1">No alerts right now. Your farm is on track.</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              Everything looks good
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Urgent', count: notifications.filter(n => n.severity === 'urgent').length, color: 'text-red-500 bg-red-50' },
              { label: 'Warning', count: notifications.filter(n => n.severity === 'warning').length, color: 'text-orange-500 bg-orange-50' },
              { label: 'Info', count: notifications.filter(n => n.severity === 'info').length, color: 'text-blue-500 bg-blue-50' },
              { label: 'Total', count: notifications.length, color: 'text-[#2D6A4F] bg-[#D8F3DC]' },
            ].map(({ label, count, color }) => (
              <Card key={label} className="shadow-sm border-0">
                <CardContent className="py-3 px-4 text-center">
                  <p className={`text-xl font-bold ${color.split(' ')[0]}`}>{count}</p>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-3">
            {notifications.map((notif) => {
              const styles = SEVERITY_STYLES[notif.severity]
              const Icon = TYPE_ICONS[notif.type]
              return (
                <Card
                  key={notif.id}
                  className={`shadow-sm border-l-4 ${styles.bg} hover:shadow-md transition-shadow duration-200`}
                >
                  <CardContent className="flex items-start gap-4 py-4">
                    <div className={`mt-0.5 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${styles.icon === 'text-red-500' ? 'bg-red-50' : styles.icon === 'text-orange-500' ? 'bg-orange-50' : 'bg-blue-50'}`}>
                      <Icon size={18} className={styles.icon} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                        <Badge className={`text-xs font-medium ${styles.badge}`}>
                          {notif.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">{notif.description}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}></span>
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                          {notif.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      <Card className="shadow-sm bg-[#D8F3DC] border-[#52B788]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#1B4332]">What triggers alerts?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {[
            { icon: '🔴', text: 'Overdue tasks — tasks past their due date' },
            { icon: '📦', text: 'Low stock — inventory at or below reorder level' },
            { icon: '🔧', text: 'Service due — equipment service within 14 days' },
            { icon: '📄', text: 'Document expiry — documents expiring within 30 days' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-xs text-[#2D6A4F] py-0.5">
              <span className="text-base">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}