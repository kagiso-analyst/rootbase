// lib/farm-context.tsx

'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Farm = {
  id: string
  name: string
  farm_type: string | null  // 👈 Make nullable
  province: string | null   // 👈 Make nullable
  total_hectares: number
  is_active: boolean
  user_id: string
  created_at: string
}

type FarmContextType = {
  currentFarm: Farm | null
  farms: Farm[]
  switchFarm: (farmId: string) => Promise<void>
  addFarm: (farmData: Omit<Farm, 'id' | 'is_active' | 'user_id' | 'created_at'>) => Promise<Farm | null>
  updateFarm: (farmId: string, farmData: Partial<Farm>) => Promise<void>
  deleteFarm: (farmId: string) => Promise<void>
  refreshFarms: () => Promise<void>
  loading: boolean
  error: string | null
}

const FarmContext = createContext<FarmContextType | undefined>(undefined)

export function FarmProvider({ children }: { children: ReactNode }) {
  const [farms, setFarms] = useState<Farm[]>([])
  const [currentFarm, setCurrentFarm] = useState<Farm | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // ===== LOAD FARMS =====
  const loadFarms = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setFarms([])
        setCurrentFarm(null)
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from('farms')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (fetchError) throw new Error('Failed to load farms: ' + fetchError.message)

      if (data && data.length > 0) {
        setFarms(data)
        
        const savedFarmId = localStorage.getItem('currentFarmId')
        let activeFarm = data.find(f => f.is_active)
        
        if (savedFarmId) {
          const savedFarm = data.find(f => f.id === savedFarmId)
          if (savedFarm) {
            setCurrentFarm(savedFarm)
            // Update is_active in database
            await supabase
              .from('farms')
              .update({ is_active: false })
              .eq('user_id', user.id)
            await supabase
              .from('farms')
              .update({ is_active: true })
              .eq('id', savedFarm.id)
            setLoading(false)
            return
          }
        }
        
        const farmToUse = activeFarm || data[0]
        setCurrentFarm(farmToUse)
        localStorage.setItem('currentFarmId', farmToUse.id)
      } else {
        setFarms([])
        setCurrentFarm(null)
        localStorage.removeItem('currentFarmId')
      }
    } catch (err) {
      console.error('Error loading farms:', err)
      setError(err instanceof Error ? err.message : 'Failed to load farms')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadFarms()
  }, [loadFarms])

  // ===== SWITCH FARM =====
  const switchFarm = useCallback(async (farmId: string) => {
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in to switch farms')

      const farm = farms.find(f => f.id === farmId)
      if (!farm) throw new Error('Farm not found')

      console.log('🔄 Switching to farm:', farm.name)

      // ✅ Fix: Add await to both updates
      const { error: updateError1 } = await supabase
        .from('farms')
        .update({ is_active: false })
        .eq('user_id', user.id)

      if (updateError1) {
        console.error('Error deactivating farms:', updateError1)
        throw new Error('Failed to switch farm: ' + updateError1.message)
      }

      const { error: updateError2 } = await supabase
        .from('farms')
        .update({ is_active: true })
        .eq('id', farmId)
        .eq('user_id', user.id)

      if (updateError2) {
        console.error('Error activating farm:', updateError2)
        throw new Error('Failed to switch farm: ' + updateError2.message)
      }

      // Update state
      setCurrentFarm(farm)
      setFarms(prev => prev.map(f => ({ ...f, is_active: f.id === farmId })))
      
      // Save to localStorage for persistence
      localStorage.setItem('currentFarmId', farmId)

      console.log('✅ Farm switched successfully to:', farm.name)
      
    } catch (err) {
      console.error('❌ Error switching farm:', err)
      setError(err instanceof Error ? err.message : 'Failed to switch farm')
      throw err
    }
  }, [farms, supabase])

  // ===== ADD FARM =====
  const addFarm = useCallback(async (farmData: Omit<Farm, 'id' | 'is_active' | 'user_id' | 'created_at'>): Promise<Farm | null> => {
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in to add a farm')

      const isFirstFarm = farms.length === 0

      const { data, error: insertError } = await supabase
        .from('farms')
        .insert([{ 
          ...farmData, 
          user_id: user.id, 
          is_active: isFirstFarm 
        }])
        .select()
        .single()

      if (insertError) throw new Error('Failed to add farm: ' + insertError.message)

      if (data) {
        setFarms(prev => [...prev, data])
        if (isFirstFarm) {
          setCurrentFarm(data)
          localStorage.setItem('currentFarmId', data.id)
        }
        return data
      }
      
      return null
    } catch (err) {
      console.error('Error adding farm:', err)
      setError(err instanceof Error ? err.message : 'Failed to add farm')
      return null
    }
  }, [farms.length, supabase])

  // ===== UPDATE FARM =====
  const updateFarm = useCallback(async (farmId: string, farmData: Partial<Farm>) => {
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in to update a farm')

      const { error: updateError } = await supabase
        .from('farms')
        .update(farmData)
        .eq('id', farmId)
        .eq('user_id', user.id)

      if (updateError) throw new Error('Failed to update farm: ' + updateError.message)

      // Update local state
      setFarms(prev => prev.map(f => 
        f.id === farmId ? { ...f, ...farmData } : f
      ))
      
      if (currentFarm?.id === farmId) {
        setCurrentFarm(prev => prev ? { ...prev, ...farmData } : null)
      }
    } catch (err) {
      console.error('Error updating farm:', err)
      setError(err instanceof Error ? err.message : 'Failed to update farm')
      throw err
    }
  }, [currentFarm, supabase])

  // ===== DELETE FARM =====
  const deleteFarm = useCallback(async (farmId: string) => {
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in to delete a farm')

      if (farms.length <= 1) {
        throw new Error('Cannot delete the last farm. Create a new farm first.')
      }

      const { error: deleteError } = await supabase
        .from('farms')
        .delete()
        .eq('id', farmId)
        .eq('user_id', user.id)

      if (deleteError) throw new Error('Failed to delete farm: ' + deleteError.message)

      const updatedFarms = farms.filter(f => f.id !== farmId)
      setFarms(updatedFarms)

      if (currentFarm?.id === farmId) {
        const newActiveFarm = updatedFarms[0]
        if (newActiveFarm) {
          setCurrentFarm(newActiveFarm)
          localStorage.setItem('currentFarmId', newActiveFarm.id)
          
          await supabase
            .from('farms')
            .update({ is_active: true })
            .eq('id', newActiveFarm.id)
        } else {
          setCurrentFarm(null)
          localStorage.removeItem('currentFarmId')
        }
      }
    } catch (err) {
      console.error('Error deleting farm:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete farm')
      throw err
    }
  }, [farms, currentFarm, supabase])

  // ===== REFRESH FARMS =====
  const refreshFarms = useCallback(async () => {
    await loadFarms()
  }, [loadFarms])

  const value = {
    currentFarm,
    farms,
    switchFarm,
    addFarm,
    updateFarm,
    deleteFarm,
    refreshFarms,
    loading,
    error,
  }

  return (
    <FarmContext.Provider value={value}>
      {children}
    </FarmContext.Provider>
  )
}

export const useFarm = () => {
  const context = useContext(FarmContext)
  if (context === undefined) {
    throw new Error('useFarm must be used within a FarmProvider')
  }
  return context
}