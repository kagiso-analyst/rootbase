import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const data = Object.fromEntries(formData.entries())

    const paymentStatus = data.payment_status as string
    const userEmail = data.email_address as string
    const amount = parseFloat(data.amount_gross as string)
    const itemName = data.item_name as string
    const paymentId = data.pf_payment_id as string

    // Log the payment
    await supabase.from('payment_logs').insert([{
      user_email: userEmail,
      amount,
      item_name: itemName,
      payment_status: paymentStatus,
      payfast_payment_id: paymentId,
    }])

    if (paymentStatus === 'COMPLETE') {
      // Determine plan from item name
      let plan = 'starter'
      if (itemName?.toLowerCase().includes('pro')) plan = 'pro'
      if (itemName?.toLowerCase().includes('business')) plan = 'business'

      // Set expiry to 1 month from now
      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + 1)

      // Update or create subscription
      await supabase.from('subscriptions').upsert([{
        user_email: userEmail,
        user_id: userEmail,
        plan,
        status: 'active',
        amount,
        expires_at: expiresAt.toISOString(),
      }], { onConflict: 'user_email' })
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('PayFast notify error:', error)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}
