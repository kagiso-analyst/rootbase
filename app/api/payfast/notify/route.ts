// app/api/payfast/notify/route.ts

import { NextResponse } from 'next/server'
import { verifyPayFastNotification } from '@/lib/payfast'

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

    // Check payment status
    const paymentStatus = data.payment_status
    const amount = data.amount
    const email = data.email_address
    const mPaymentId = data.m_payment_id

    if (paymentStatus === 'COMPLETE') {
      // Payment successful - update subscription in database
      console.log(`Payment complete for ${email}: ${amount}`)
      
      // TODO: Update subscription status in Supabase
      // await updateSubscription(email, 'active', 'starter')
      
    } else if (paymentStatus === 'FAILED') {
      console.log(`Payment failed for ${email}: ${amount}`)
      // TODO: Handle failed payment
    }

    // Always return 200 OK to PayFast
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('PayFast notify error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}