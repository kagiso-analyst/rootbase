import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const passphrase = process.env.PAYFAST_PASSPHRASE || ''

    const data: Record<string, string> = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID!,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/cancel`,
      notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payfast/notify`,
      name_first: body.name_first || 'Farmer',
      name_last: body.name_last || 'User',
      email_address: body.email_address,
      amount: parseFloat(body.amount).toFixed(2),
      item_name: body.item_name,
      item_description: body.item_description || '',
    }

    // Remove empty values
    Object.keys(data).forEach(k => { if (!data[k]) delete data[k] })

    // Build signature string
    const sortedKeys = Object.keys(data).sort()
    let queryString = sortedKeys
      .map(k => `${k}=${encodeURIComponent(data[k]).replace(/%20/g, '+')}`)
      .join('&')

    if (passphrase) {
      queryString += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`
    }

    const signature = crypto.createHash('md5').update(queryString).digest('hex')

    return NextResponse.json({ data: { ...data, signature } })
  } catch (err) {
    return NextResponse.json({ error: 'Signing failed' }, { status: 500 })
  }
}