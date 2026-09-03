// lib/supabase/server.ts

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Database } from '@/lib/database.types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore errors in server components
          }
        },
      },
    }
  )
}

// ===== HELPER: Get current user on server =====
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ===== HELPER: Get current user ID on server =====
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.id || null
}

// ===== HELPER: Check if user is authenticated on server =====
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return !!user
}

// ===== HELPER: Require authentication (redirects if not logged in) =====
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return user
}

export async function verifyFarmOwnership(farmId: string) {
  const user = await requireAuth()
  const supabase = await createClient()
  const { data: farm } = await supabase
    .from('farms')
    .select('id')
    .eq('id', farmId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!farm) {
    throw new Error('Farm not found or access denied')
  }

  return farm
}

// ===== HELPER: Get user with role =====
export async function getUserWithRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Get user role from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  return {
    ...user,
    role: profile?.role || 'user'
  }
}