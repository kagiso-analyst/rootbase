'use client'

import { useEffect, useState } from 'react'
import { Bell, AlertTriangle, CheckSquare, Package, Wrench } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

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

  const supabase = createClient()

  useEffect(() => {
    async function buildNotifications() {
  try {
    const alerts: Notification[] = []
    const today = new Date().toISOString().split('T')[0]

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setNotifications([])
      setLoading(false)
      return
    }

    const [tasksRes, inventoryRes, equipmentRes, documentsRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)  // 👈 ADD THIS!
        .eq('status', 'todo')
        .lt('due_date', today),
      supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', user.id),  // 👈 ADD THIS!
      supabase
        .from('equipment')
        .select('*')
        .eq('user_id', user.id),  // 👈 ADD THIS!
      supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id),  // 👈 ADD THIS!
    ])
        // Overdue tasks
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

        // Low stock items
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

        // Equipment service due
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

        // Document expiry — wire it in properly
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

        // Sort by severity
        const order = { urgent: 0, warning: 1, info: 2 }
        alerts.sort((a, b) => order[a.severity] - order[b.severity])

        setNotifications(alerts)
      } catch (err) {
        console.error('Notification build error:', err)
      } finally {
        setLoading(false)
      }
    }

    buildNotifications()
  }, [])

  const SEVERITY_STYLES = {
    urgent:  { badge: 'bg-red-100 text-red-700',    icon: 'text-red-500',    bg: 'border-l-red-500' },
    warning: { badge: 'bg-orange-100 text-orange-700', icon: 'text-orange-500', bg: 'border-l-orange-400' },
    info:    { badge: 'bg-blue-100 text-blue-700',  icon: 'text-blue-500',   bg: 'border-l-blue-400' },
  }

  const TYPE_ICONS = {
    overdue_task: CheckSquare,
    low_stock:    Package,
    service_due:  Wrench,
    expiry:       AlertTriangle,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B4332]">Notifications</h1>
        <p className="text-gray-500 text-sm mt-1">
          {notifications.length} alert{notifications.length !== 1 ? 's' : ''} need your attention
        </p>
      </div>

      {loading ? (
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-center py-16 text-gray-400">
            <p className="text-sm">Checking your farm for alerts...</p>
          </CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-14 h-14 rounded-full bg-[#D8F3DC] flex items-center justify-center mb-4">
              <Bell size={24} className="text-[#2D6A4F]" />
            </div>
            <p className="text-sm font-medium text-[#1B4332]">All clear!</p>
            <p className="text-xs mt-1">No alerts right now. Your farm is on track.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const styles = SEVERITY_STYLES[notif.severity]
            const Icon = TYPE_ICONS[notif.type]
            return (
              <Card
                key={notif.id}
                className={`shadow-sm border-l-4 ${styles.bg}`}
              >
                <CardContent className="flex items-start gap-4 py-4">
                  <div className={`mt-0.5 flex-shrink-0 ${styles.icon}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                      <Badge className={`text-xs ${styles.badge}`}>
                        {notif.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{notif.description}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Card className="shadow-sm bg-[#D8F3DC] border-[#52B788]">
        <CardHeader>
          <CardTitle className="text-sm text-[#1B4332]">What triggers alerts?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {[
            '🔴 Overdue tasks — tasks past their due date',
            '📦 Low stock — inventory at or below reorder level',
            '🔧 Service due — equipment service within 14 days',
            '📄 Document expiry — documents expiring within 30 days',
          ].map(item => (
            <p key={item} className="text-xs text-[#2D6A4F]">{item}</p>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}