'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

type Farm = {
  id: string
  name: string
  farm_type: string
  province: string
  total_hectares: number
  is_active: boolean
}

type FarmContextType = {
  currentFarm: Farm | null
  farms: Farm[]
  switchFarm: (farmId: string) => void
  addFarm: (farm: Omit<Farm, 'id' | 'is_active'>) => Promise<void>
  loading: boolean
}

const FarmContext = createContext<FarmContextType>({
  currentFarm: null,
  farms: [],
  switchFarm: () => {},
  addFarm: async () => {},
  loading: true,
})

export function FarmProvider({ children }: { children: ReactNode }) {
  const [farms, setFarms] = useState<Farm[]>([])
  const [currentFarm, setCurrentFarm] = useState<Farm | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadFarms() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('farms')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (data && data.length > 0) {
        setFarms(data)
        const active = data.find(f => f.is_active) || data[0]
        setCurrentFarm(active)
      }
      setLoading(false)
    }
    loadFarms()
  }, [])

  async function switchFarm(farmId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('farms').update({ is_active: false }).eq('user_id', user.id)
    await supabase.from('farms').update({ is_active: true }).eq('id', farmId)

    const farm = farms.find(f => f.id === farmId)
    if (farm) {
      setCurrentFarm(farm)
      setFarms(prev => prev.map(f => ({ ...f, is_active: f.id === farmId })))
    }
  }

  async function addFarm(farmData: Omit<Farm, 'id' | 'is_active'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('farms')
      .insert([{ ...farmData, user_id: user.id, is_active: farms.length === 0 }])
      .select()
      .single()

    if (!error && data) {
      setFarms(prev => [...prev, data])
      if (farms.length === 0) setCurrentFarm(data)
    }
  }

  return (
    <FarmContext.Provider value={{ currentFarm, farms, switchFarm, addFarm, loading }}>
      {children}
    </FarmContext.Provider>
  )
}

export const useFarm = () => useContext(FarmContext)