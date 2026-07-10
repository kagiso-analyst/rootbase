import md5 from 'md5'

export const PAYFAST_CONFIG = {
  merchantId: process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || '10000100',
  merchantKey: process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY || '46f0cd694581a',
  passphrase: process.env.NEXT_PUBLIC_PAYFAST_PASSPHRASE || '',
  sandbox: process.env.NEXT_PUBLIC_PAYFAST_SANDBOX === 'true',
  returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/cancel`,
  notifyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payfast/notify`,
}

export function getPayFastUrl() {
  return PAYFAST_CONFIG.sandbox
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process'
}

export function generateSignature(data: Record<string, string>, passphrase?: string): string {
  // Step 1 — sort params alphabetically
  const sortedKeys = Object.keys(data).sort()

  // Step 2 — build query string
  let queryString = sortedKeys
    .filter(key => data[key] !== '' && data[key] !== undefined)
    .map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`)
    .join('&')

  // Step 3 — append passphrase if set
  if (passphrase && passphrase !== '') {
    queryString += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`
  }

  // Step 4 — MD5 hash
  return md5(queryString)
}

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