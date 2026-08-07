// lib/hooks/use-notifications.ts

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getNotificationCount } from '@/lib/notification-service'

export function useNotifications(farmId: string | null) {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchCount() {
      if (!farmId) {
        setCount(0)
        setLoading(false)
        return
      }

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setCount(0)
          setLoading(false)
          return
        }

        const total = await getNotificationCount(farmId, user.id)
        setCount(total)
      } catch (err) {
        console.error('Notification fetch error:', err)
        setCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchCount()

    // Refresh every 5 minutes
    const interval = setInterval(fetchCount, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [farmId, supabase])

  return { count, loading }
}