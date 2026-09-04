import { describe, expect, it } from 'vitest'
import {
  buildPayFastData,
  generateSignature,
  getPayFastEnvironment,
  getPlanById,
  getPlanPrice,
  isFreePlan,
  verifyPayFastNotification,
} from '../../lib/payfast'

describe('PayFast helpers', () => {
  it('generates a stable signature independent of key order', () => {
    const first = generateSignature({ amount: '199.00', email_address: 'farmer@example.com' }, 'secret')
    const second = generateSignature({ email_address: 'farmer@example.com', amount: '199.00' }, 'secret')

    expect(first).toBe(second)
  })

  it('builds signed payment data with the expected plan details', () => {
    const payment = buildPayFastData({
      merchantId: 'merchant',
      merchantKey: 'key',
      passphrase: 'secret',
      notifyUrl: 'https://example.com/api/payfast/notify',
      name_first: 'Amina',
      name_last: 'Farmer',
      email_address: 'farmer@example.com',
      amount: '199.00',
      item_name: 'RootBase Starter Plan',
      custom_str1: 'starter',
      custom_str2: 'user-id',
    })

    expect(payment.amount).toBe('199.00')
    expect(payment.custom_str1).toBe('starter')
    expect(payment.signature).toMatch(/^[a-f0-9]{32}$/)
    expect(verifyPayFastNotification({ ...payment }, 'secret')).toBe(true)
  })

  it('rejects a modified notification', () => {
    const data = {
      amount: '199.00',
      email_address: 'farmer@example.com',
      signature: generateSignature({ amount: '199.00', email_address: 'farmer@example.com' }, 'secret'),
    }

    expect(verifyPayFastNotification({ ...data, amount: '999.00' }, 'secret')).toBe(false)
  })

  it('returns known plan prices and free-plan status', () => {
    expect(getPlanById('starter')?.name).toBe('Starter')
    expect(getPlanPrice('pro')).toBe(499)
    expect(isFreePlan('free')).toBe(true)
    expect(isFreePlan('business')).toBe(false)
  })

  it('returns the configured PayFast environment', () => {
    expect(['sandbox', 'production']).toContain(getPayFastEnvironment())
  })
})
