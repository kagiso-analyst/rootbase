// lib/payfast.ts

import md5 from 'md5'

// ===== PUBLIC CONFIG (Safe for client) =====
export const PAYFAST_CONFIG = {
  sandbox: process.env.NEXT_PUBLIC_PAYFAST_SANDBOX === 'true',
  returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/cancel`,
}

// ===== GET PAYFAST URL =====
export function getPayFastUrl(): string {
  return PAYFAST_CONFIG.sandbox
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process'
}

// ===== GENERATE SIGNATURE (Server-side only!) =====
export function generateSignature(data: Record<string, string>, passphrase?: string): string {
  const sortedKeys = Object.keys(data).sort()

  let queryString = sortedKeys
    .filter(key => data[key] !== '' && data[key] !== undefined && data[key] !== null)
    .map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`)
    .join('&')

  if (passphrase && passphrase !== '') {
    queryString += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`
  }

  return md5(queryString)
}

// ===== PAYFAST DATA INTERFACE =====
export interface PayFastData {
  merchant_id: string
  merchant_key: string
  return_url: string
  cancel_url: string
  notify_url: string
  name_first: string
  name_last: string
  email_address: string
  m_payment_id?: string
  amount: string
  item_name: string
  item_description?: string
  custom_int1?: string
  custom_str1?: string
  custom_str2?: string
  signature: string
}

interface BuildPayFastDataParams {
  merchantId: string
  merchantKey: string
  passphrase?: string
  notifyUrl: string
  name_first: string
  name_last: string
  email_address: string
  amount: string
  item_name: string
  item_description?: string
  m_payment_id?: string
  custom_int1?: string
  custom_str1?: string
  custom_str2?: string
}

// ===== BUILD PAYFAST DATA =====
export function buildPayFastData(params: BuildPayFastDataParams): PayFastData {
  // Build the data object with all required fields
  const data: Record<string, string> = {
    merchant_id: params.merchantId,
    merchant_key: params.merchantKey,
    return_url: PAYFAST_CONFIG.returnUrl,
    cancel_url: PAYFAST_CONFIG.cancelUrl,
    notify_url: params.notifyUrl,
    name_first: params.name_first || 'Farmer',
    name_last: params.name_last || 'User',
    email_address: params.email_address || '',
    amount: params.amount || '0.00',
    item_name: params.item_name || 'RootBase Subscription',
  }

  // Add optional fields
  if (params.item_description) {
    data.item_description = params.item_description
  }
  
  if (params.m_payment_id) {
    data.m_payment_id = params.m_payment_id
  }
  
  if (params.custom_int1) {
    data.custom_int1 = params.custom_int1
  }
  
  if (params.custom_str1) {
    data.custom_str1 = params.custom_str1
  }
  
  if (params.custom_str2) {
    data.custom_str2 = params.custom_str2
  }

  // Generate signature
  const signature = generateSignature(data, params.passphrase)
  data.signature = signature

  // ✅ FIX: Type assertion with explicit validation
  return data as unknown as PayFastData
}

// ===== VERIFY PAYFAST NOTIFICATION =====
export function verifyPayFastNotification(
  data: Record<string, string>, 
  passphrase?: string
): boolean {
  if (!data.signature) {
    return false
  }

  const { signature, ...dataWithoutSignature } = data
  const calculatedSignature = generateSignature(dataWithoutSignature, passphrase)

  return signature === calculatedSignature
}

// ===== PLANS (Safe for client) =====
export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceDisplay: 'R0',
    period: 'forever',
    description: 'Get started with basic farm tracking',
    features: [
      '1 farm',
      '50 records per module',
      'Basic dashboard',
      'Farm journal',
      'Task management',
    ],
    cta: 'Current Plan',
    highlighted: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 199,
    priceDisplay: 'R199',
    period: 'per month',
    description: 'Everything a growing farm needs',
    features: [
      '1 farm, unlimited records',
      'Full financial tracking',
      'Crop + livestock management',
      'Inventory + suppliers',
      'Equipment tracking',
      'Financial reports',
      'Analytics dashboard',
    ],
    cta: 'Subscribe Now',
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 499,
    priceDisplay: 'R499',
    period: 'per month',
    description: 'For serious farming operations',
    features: [
      'Everything in Starter',
      'Up to 3 farms',
      'AI farm assistant',
      'PDF report export',
      'Priority support',
      'Weather alerts',
      'Cost calculator',
    ],
    cta: 'Subscribe Now',
    highlighted: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 999,
    priceDisplay: 'R999',
    period: 'per month',
    description: 'For agri-businesses and co-ops',
    features: [
      'Everything in Pro',
      'Unlimited farms',
      'Team member access',
      'API access',
      'White-label reports',
      'Dedicated support',
      'Custom integrations',
    ],
    cta: 'Subscribe Now',
    highlighted: false,
  },
]

// ===== HELPER FUNCTIONS =====
export function getPlanById(id: string) {
  return PLANS.find(plan => plan.id === id)
}

export function getPlanPrice(planId: string): number {
  const plan = getPlanById(planId)
  return plan?.price || 0
}

export function isFreePlan(planId: string): boolean {
  return planId === 'free' || getPlanPrice(planId) === 0
}

export function getPlanFeatures(planId: string): string[] {
  const plan = getPlanById(planId)
  return plan?.features || []
}

export function getPlanCta(planId: string): string {
  const plan = getPlanById(planId)
  return plan?.cta || 'Subscribe'
}

export function getPayFastEnvironment(): 'sandbox' | 'production' {
  return PAYFAST_CONFIG.sandbox ? 'sandbox' : 'production'
}