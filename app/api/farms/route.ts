// app/api/farms/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getMaxFarms } from '@/lib/payfast'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // ✅ Verify authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // ✅ Validate input
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Farm name is required' }, { status: 400 })
    }

    if (body.name.length > 100) {
      return NextResponse.json({ error: 'Farm name must be less than 100 characters' }, { status: 400 })
    }

    const totalHectares = body.total_hectares === undefined || body.total_hectares === ''
      ? 0
      : Number(body.total_hectares)
    if (!Number.isFinite(totalHectares) || totalHectares < 0) {
      return NextResponse.json({ error: 'Total hectares must be a non-negative number' }, { status: 400 })
    }

    // ✅ Check plan limits
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('expires_at', { ascending: false, nullsFirst: true })
      .limit(1)
      .maybeSingle()

    const { count } = await supabase
      .from('farms')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // ✅ Determine max farms based on plan
    const maxFarms = getMaxFarms(subscription?.plan || 'free')

    if (count && count >= maxFarms) {
      return NextResponse.json({
        error: `Your plan allows a maximum of ${maxFarms === Infinity ? 'unlimited' : maxFarms} farm${maxFarms > 1 ? 's' : ''}. Please upgrade to add more.`
      }, { status: 403 })
    }

    // ✅ Create farm
    const { data: farm, error } = await supabase
      .from('farms')
      .insert({
        name: body.name.trim(),
        farm_type: typeof body.farm_type === 'string' ? body.farm_type.trim() || null : null,
        province: typeof body.province === 'string' ? body.province.trim() || null : null,
        total_hectares: totalHectares,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Farm creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ✅ Set as active farm
    await supabase
      .from('profiles')
      .update({ active_farm_id: farm.id })
      .eq('user_id', user.id)

    return NextResponse.json({ 
      success: true, 
      farm,
      message: 'Farm created successfully' 
    })

  } catch (error) {
    console.error('Farm creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ✅ GET farms
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: farms, error } = await supabase
      .from('farms')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ farms })

  } catch (error) {
    console.error('Get farms error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}