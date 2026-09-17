'use client'

import { useEffect, useState } from 'react'
import { CloudOff, CloudUpload, Wifi } from 'lucide-react'
import {
  getPendingMutationCount,
  subscribeToQueueChanges,
} from '@/lib/offline-queue'

export default function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const updateStatus = () => {
      setIsOnline(navigator.onLine)
      setPendingCount(getPendingMutationCount())
    }

    updateStatus()
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)
    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [])

  useEffect(() => subscribeToQueueChanges(() => {
    setPendingCount(getPendingMutationCount())
  }), [])

  if (isOnline && pendingCount === 0) return null

  return (
    <div
      className={`fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full px-3 py-2 text-xs font-medium shadow-lg ${
        isOnline ? 'bg-[#FFF3CD] text-[#856404]' : 'bg-[#1B4332] text-white'
      }`}
      role="status"
      aria-live="polite"
    >
      {isOnline ? <CloudUpload size={14} /> : <CloudOff size={14} />}
      <span>
        {isOnline
          ? `Syncing ${pendingCount} pending ${pendingCount === 1 ? 'change' : 'changes'}`
          : 'Offline mode'}
      </span>
      {isOnline ? <Wifi size={13} /> : null}
    </div>
  )
}