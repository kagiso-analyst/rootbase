// app/api/payfast/notify/route.ts

import { NextResponse } from 'next/server'
import { getPlanById, verifyPayFastNotification } from '@/lib/payfast'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    // Get form data from PayFast
    const formData = await request.formData()
    const data: Record<string, string> = {}
    
    formData.forEach((value, key) => {
      data[key] = value.toString()
    })

    // Get passphrase from server-side environment
    const passphrase = process.env.PAYFAST_PASSPHRASE || ''

    // Verify the notification signature
    const isValid = verifyPayFastNotification(data, passphrase)

    if (!isValid) {
      console.error('Invalid PayFast signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    if (data.merchant_id !== process.env.PAYFAST_MERCHANT_ID) {
      return NextResponse.json({ error: 'Invalid merchant' }, { status: 400 })
    }

    const paymentStatus = data.payment_status
    const amount = data.amount
    const email = data.email_address
    const mPaymentId = data.m_payment_id
    const planId = data.custom_str1
    const userId = data.custom_str2
    const plan = getPlanById(planId)

    if (!mPaymentId || !email || !userId || !plan || plan.id === 'free' || amount !== plan.price.toFixed(2)) {
      return NextResponse.json({ error: 'Invalid payment data' }, { status: 400 })
    }

    if (paymentStatus === 'COMPLETE') {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!serviceRoleKey || !supabaseUrl) {
        return NextResponse.json({ error: 'Payment storage is not configured' }, { status: 500 })
      }

      const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)
      const { data: existing, error: lookupError } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('payment_id', mPaymentId)
        .maybeSingle()

      if (lookupError) throw lookupError
      if (existing) return NextResponse.json({ success: true })

      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_email: email,
          plan: plan.id,
          status: 'active',
          payment_id: mPaymentId,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })

      if (insertError) throw insertError

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ plan: plan.id })
        .eq('user_id', userId)

      if (profileError) throw profileError
    } else if (paymentStatus === 'FAILED') {
      console.log(`Payment failed for ${email}: ${amount}`)
    }

    // Always return 200 OK to PayFast
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('PayFast notify error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}