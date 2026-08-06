// lib/use-plan-restrictions.ts

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context'

export type Plan = 'free' | 'starter' | 'pro' | 'business'

export type PlanFeatures = {
  maxFarms: number
  maxCrops: number
  maxLivestock: number
  maxInventory: number
  maxTasks: number
  maxEquipment: number
  maxSuppliers: number
  maxDocuments: number
  maxJournalEntries: number
  maxTransactions: number
  financialReports: boolean
  analyticsDashboard: boolean
  costCalculator: boolean
  pdfExport: boolean
  aiAssistant: boolean
  prioritySupport: boolean
  weatherAlerts: boolean
  budgetPlanning: boolean
  balanceSheet: boolean
  recurringTransactions: boolean
  stockMovementTracking: boolean
}

const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  free: {
    maxFarms: 1,
    maxCrops: 10,
    maxLivestock: 20,
    maxInventory: 30,
    maxTasks: 20,
    maxEquipment: 10,
    maxSuppliers: 10,
    maxDocuments: 10,
    maxJournalEntries: 50,
    maxTransactions: 100,
    financialReports: true,
    analyticsDashboard: true,
    costCalculator: true,
    pdfExport: false,
    aiAssistant: false,
    prioritySupport: false,
    weatherAlerts: true,
    budgetPlanning: false,
    balanceSheet: false,
    recurringTransactions: false,
    stockMovementTracking: false,
  },
  starter: {
    maxFarms: 1,
    maxCrops: 999,
    maxLivestock: 999,
    maxInventory: 999,
    maxTasks: 999,
    maxEquipment: 999,
    maxSuppliers: 999,
    maxDocuments: 999,
    maxJournalEntries: 999,
    maxTransactions: 999,
    financialReports: true,
    analyticsDashboard: true,
    costCalculator: true,
    pdfExport: true,
    aiAssistant: false,
    prioritySupport: false,
    weatherAlerts: true,
    budgetPlanning: true,
    balanceSheet: true,
    recurringTransactions: true,
    stockMovementTracking: true,
  },
  pro: {
    maxFarms: 3,
    maxCrops: 999,
    maxLivestock: 999,
    maxInventory: 999,
    maxTasks: 999,
    maxEquipment: 999,
    maxSuppliers: 999,
    maxDocuments: 999,
    maxJournalEntries: 999,
    maxTransactions: 999,
    financialReports: true,
    analyticsDashboard: true,
    costCalculator: true,
    pdfExport: true,
    aiAssistant: true,
    prioritySupport: true,
    weatherAlerts: true,
    budgetPlanning: true,
    balanceSheet: true,
    recurringTransactions: true,
    stockMovementTracking: true,
  },
  business: {
    maxFarms: 10,
    maxCrops: 999,
    maxLivestock: 999,
    maxInventory: 999,
    maxTasks: 999,
    maxEquipment: 999,
    maxSuppliers: 999,
    maxDocuments: 999,
    maxJournalEntries: 999,
    maxTransactions: 999,
    financialReports: true,
    analyticsDashboard: true,
    costCalculator: true,
    pdfExport: true,
    aiAssistant: true,
    prioritySupport: true,
    weatherAlerts: true,
    budgetPlanning: true,
    balanceSheet: true,
    recurringTransactions: true,
    stockMovementTracking: true,
  },
}

export function usePlanRestrictions() {
  const [userPlan, setUserPlan] = useState<Plan>('free')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const { currentFarm } = useFarm()

  useEffect(() => {
    async function fetchUserPlan() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setUserPlan('free')
          setLoading(false)
          return
        }

        // Check subscription table first
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select('plan')
          .eq('user_email', user.email || '')
          .eq('status', 'active')
          .maybeSingle()

        if (subscription && !subError) {
          const plan = subscription.plan as Plan
          if (plan && PLAN_FEATURES[plan]) {
            setUserPlan(plan)
            setLoading(false)
            return
          }
        }

        // Fallback to profile plan
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('plan')
          .eq('user_id', user.id)
          .maybeSingle()

        if (profile && !profileError && profile.plan) {
          const plan = profile.plan as Plan
          if (PLAN_FEATURES[plan]) {
            setUserPlan(plan)
            setLoading(false)
            return
          }
        }

        setUserPlan('free')
      } catch (err) {
        console.error('Error fetching user plan:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch plan')
        setUserPlan('free')
      } finally {
        setLoading(false)
      }
    }

    fetchUserPlan()
  }, [supabase])

  const features = PLAN_FEATURES[userPlan] || PLAN_FEATURES.free

  // Check if a specific feature is available
  const hasFeature = (feature: keyof PlanFeatures): boolean => {
    return features[feature] === true
  }

  // Check if the user can add more of a specific resource
  const canAddMore = (resource: 'farms' | 'crops' | 'livestock' | 'inventory' | 'tasks' | 'equipment' | 'suppliers' | 'documents' | 'journalEntries' | 'transactions', currentCount: number): boolean => {
    const maxMap: Record<string, keyof PlanFeatures> = {
      farms: 'maxFarms',
      crops: 'maxCrops',
      livestock: 'maxLivestock',
      inventory: 'maxInventory',
      tasks: 'maxTasks',
      equipment: 'maxEquipment',
      suppliers: 'maxSuppliers',
      documents: 'maxDocuments',
      journalEntries: 'maxJournalEntries',
      transactions: 'maxTransactions',
    }

    const maxKey = maxMap[resource]
    if (!maxKey) return true
    const max = features[maxKey] as number
    return currentCount < max
  }

  // Get the limit for a specific resource
  const getLimit = (resource: keyof PlanFeatures): number => {
    return features[resource] as number
  }

  // Get the plan name
  const getPlanName = (): string => {
    const names: Record<Plan, string> = {
      free: 'Free',
      starter: 'Starter',
      pro: 'Pro',
      business: 'Business',
    }
    return names[userPlan] || 'Free'
  }

  // Check if the user is on a paid plan
  const isPaid = (): boolean => {
    return userPlan !== 'free'
  }

  // Check if the user is on Pro or higher
  const isProOrHigher = (): boolean => {
    return userPlan === 'pro' || userPlan === 'business'
  }

  // Get upgrade URL
  const getUpgradeUrl = (): string => {
    return '/subscription'
  }

  return {
    plan: userPlan,
    planName: getPlanName(),
    features,
    loading,
    error,
    hasFeature,
    canAddMore,
    getLimit,
    isPaid,
    isProOrHigher,
    upgradeUrl: getUpgradeUrl(),
    isFeatureAvailable: hasFeature,
  }
}