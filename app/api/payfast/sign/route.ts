// app/api/payfast/sign/route.ts

import { NextResponse } from 'next/server'
import { buildPayFastData } from '@/lib/payfast'

export async function POST(request: Request) {
  try {
    // ✅ These are read on the SERVER, never sent to client
    const merchantId = process.env.PAYFAST_MERCHANT_ID
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY
    const passphrase = process.env.PAYFAST_PASSPHRASE
    
    // ✅ Validate server-side credentials
    if (!merchantId || !merchantKey) {
      console.error('PayFast credentials not configured on server')
      return NextResponse.json(
        { error: 'Payment configuration error' },
        { status: 500 }
      )
    }

    const notifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payfast/notify`

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.email_address || !body.amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // ✅ Build PayFast data with server-side credentials
    // The private keys NEVER leave the server
    const data = buildPayFastData({
      merchantId,
      merchantKey,
      passphrase: passphrase || '',
      notifyUrl,
      name_first: body.name_first || 'Farmer',
      name_last: body.name_last || 'User',
      email_address: body.email_address,
      amount: body.amount,
      item_name: body.item_name || 'RootBase Subscription',
      item_description: body.item_description || '',
      m_payment_id: body.m_payment_id || `sub_${Date.now()}`,
    })

    // ✅ Return ONLY the payment data (signature included)
    // The private keys are NOT in this response
    return NextResponse.json({ data })
    
  } catch (error) {
    console.error('PayFast sign error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}