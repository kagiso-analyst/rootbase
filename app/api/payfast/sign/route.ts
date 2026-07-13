// app/api/payfast/sign/route.ts

import { NextResponse } from 'next/server'
import { buildPayFastData } from '@/lib/payfast'

export async function POST(request: Request) {
  console.log('🚀 PayFast sign endpoint called')
  
  try {
    // ✅ Read ALL variables from environment
    const isSandbox = process.env.NEXT_PUBLIC_PAYFAST_SANDBOX === 'true'
    const merchantId = process.env.PAYFAST_MERCHANT_ID || ''
    const merchantKey = process.env.PAYFAST_MERCHANT_KEY || ''
    const passphrase = process.env.PAYFAST_PASSPHRASE || ''
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

    console.log('🔑 Environment Check:')
    console.log('  - Mode:', isSandbox ? 'SANDBOX 🧪' : 'PRODUCTION 🔒')
    console.log('  - Merchant ID:', merchantId || '❌ MISSING')
    console.log('  - Merchant Key:', merchantKey ? '✅ Set' : '❌ MISSING')
    console.log('  - Passphrase:', passphrase ? '✅ Set' : '❌ MISSING')
    console.log('  - App URL:', appUrl || '❌ MISSING')

    // ✅ Validate required fields
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

    // Parse request body
    const body = await request.json()
    console.log('📦 Request body:', {
      email: body.email_address,
      amount: body.amount,
      name: body.name_first,
    })

    // Validate required fields in request
    if (!body.email_address || !body.amount) {
      return NextResponse.json(
        { error: 'Missing required fields: email_address and amount are required' },
        { status: 400 }
      )
    }

    // ✅ Build PayFast data
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

    console.log('✅ PayFast data built successfully')
    console.log('📤 merchant_id being sent:', data.merchant_id)
    
    return NextResponse.json({ data })
    
  } catch (error) {
    console.error('❌ PayFast sign error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payment' },
      { status: 500 }
    )
  }
}