// app/api/payfast/sign/route.ts

import { NextResponse } from 'next/server'
import { buildPayFastData } from '@/lib/payfast'
import { createClient } from '@/lib/supabase/server'
import { getPlanById } from '@/lib/payfast'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const planId = typeof body.plan_id === 'string' ? body.plan_id : typeof body.plan === 'string' ? body.plan : ''
    const plan = getPlanById(planId)
    if (!plan || plan.id === 'free') {
      return NextResponse.json({ error: 'Invalid paid plan selected' }, { status: 400 })
    }

    const merchantId = process.env.PAYFAST_MERCHANT_ID || ''
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY || ''
    const passphrase = process.env.PAYFAST_PASSPHRASE || ''
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

    const errors: string[] = []
    if (!merchantId) errors.push('PAYFAST_MERCHANT_ID is missing')
    if (!merchantKey) errors.push('PAYFAST_MERCHANT_KEY is missing')
    if (!appUrl) errors.push('NEXT_PUBLIC_APP_URL is missing')
    
    // ✅ Validate merchant ID format (must be 8 digits)
    if (merchantId && !/^\d{8}$/.test(merchantId)) {
      errors.push('PAYFAST_MERCHANT_ID must be exactly 8 digits')
    }

    if (errors.length > 0) {
      console.error('❌ Configuration errors:', errors)
      return NextResponse.json(
        { error: 'Payment configuration error: ' + errors.join(', ') },
        { status: 500 }
      )
    }

    const notifyUrl = `${appUrl}/api/payfast/notify`
    const data = buildPayFastData({
      merchantId,
      merchantKey,
      passphrase: passphrase || '',
      notifyUrl,
      name_first: typeof body.name_first === 'string' ? body.name_first : user.user_metadata?.full_name || 'Farmer',
      name_last: typeof body.name_last === 'string' ? body.name_last : 'User',
      email_address: user.email || '',
      amount: plan.price.toFixed(2),
      item_name: `RootBase ${plan.name} Plan`,
      item_description: `Monthly subscription to RootBase ${plan.name} plan`,
      m_payment_id: `sub_${user.id}_${Date.now()}`,
      custom_str1: plan.id,
      custom_str2: user.id,
    })
    return NextResponse.json({ data })
    
  } catch (error) {
    console.error('❌ PayFast sign error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payment' },
      { status: 500 }
    )
  }
}