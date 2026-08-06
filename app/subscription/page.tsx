// app/subscription/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { Check, Zap, Loader2, AlertCircle, ShieldCheck, RefreshCw, Crown, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { PLANS, PAYFAST_CONFIG } from '@/lib/payfast'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ===== FEATURE AVAILABILITY =====
export function getFeatureAvailability(plan: string) {
  const features = {
    free: {
      farms: 1,
      crops: 'Limited',
      reports: 'Basic',
      aiAssistant: false,
      prioritySupport: false,
      pdfExport: false,
      weatherAlerts: false,
      advancedAnalytics: false,
      teamMembers: 0,
      storage: '100MB',
    },
    starter: {
      farms: 1,
      crops: 'Unlimited',
      reports: 'Full',
      aiAssistant: false,
      prioritySupport: false,
      pdfExport: true,
      weatherAlerts: true,
      advancedAnalytics: false,
      teamMembers: 0,
      storage: '500MB',
    },
    pro: {
      farms: 3,
      crops: 'Unlimited',
      reports: 'Full',
      aiAssistant: true,
      prioritySupport: true,
      pdfExport: true,
      weatherAlerts: true,
      advancedAnalytics: true,
      teamMembers: 5,
      storage: '2GB',
    },
    business: {
      farms: 10,
      crops: 'Unlimited',
      reports: 'Full + Custom',
      aiAssistant: true,
      prioritySupport: true,
      pdfExport: true,
      weatherAlerts: true,
      advancedAnalytics: true,
      teamMembers: 20,
      storage: '10GB',
    },
  }
  return features[plan as keyof typeof features] || features.free
}

// ===== CHECK IF FEATURE IS AVAILABLE =====
export function isFeatureAvailable(plan: string, feature: keyof ReturnType<typeof getFeatureAvailability>): boolean {
  const features = getFeatureAvailability(plan)
  return Boolean(features[feature])
}

// ===== CHECK PLAN LIMITS =====
export function getPlanLimit(plan: string, limit: 'farms' | 'teamMembers'): number {
  const features = getFeatureAvailability(plan)
  return features[limit] as number
}

export default function SubscriptionPage() {
  // ===== STATE =====
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [currentPlan, setCurrentPlan] = useState('free')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'inactive' | 'canceled'>('inactive')
  
  const supabase = createClient()
  const router = useRouter()

  // ===== FETCH USER DATA =====
  useEffect(() => {
    async function fetchUser() {
      setFetching(true)
      setError(null)
      
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) throw new Error('Failed to get user: ' + authError.message)
        
        if (!user) {
          router.push('/login')
          return
        }
        
        setUserEmail(user.email || '')
        setUserName(user.user_metadata?.full_name || '')

        // Fetch current subscription
        const { data: sub, error: subError } = await supabase
          .from('subscriptions')
          .select('plan, status')
          .eq('user_email', user.email || '')
          .maybeSingle()

        if (subError && subError.code !== 'PGRST116') {
          console.error('Subscription fetch error:', subError)
        }

        if (sub) {
          setCurrentPlan(sub.plan)
          setSubscriptionStatus(sub.status as 'active' | 'inactive' | 'canceled')
        }
        
      } catch (err) {
        console.error('Fetch user error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load your information')
      } finally {
        setFetching(false)
      }
    }
    
    fetchUser()
  }, [router, supabase])

  // ===== HANDLE SUBSCRIBE =====
  async function handleSubscribe(plan: typeof PLANS[0]) {
    if (plan.price === 0 || plan.id === currentPlan) return
    
    setLoading(true)
    setProcessingPlan(plan.id)
    setError(null)
    
    try {
      if (!userEmail) {
        throw new Error('Please log in with an email address to subscribe.')
      }

      console.log('📤 Sending subscription request for plan:', plan.id)
      
      const res = await fetch('/api/payfast/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_first: userName.split(' ')[0] || 'Farmer',
          name_last: userName.split(' ').slice(1).join(' ') || 'User',
          email_address: userEmail,
          amount: plan.price.toFixed(2),
          item_name: `RootBase ${plan.name} Plan`,
          item_description: `Monthly subscription to RootBase ${plan.name}`,
          plan_id: plan.id,
          user_id: (await supabase.auth.getUser()).data.user?.id || '',
        }),
      })

      console.log('📥 Response status:', res.status)

      if (!res.ok) {
        const errorText = await res.text()
        console.error('❌ API Error:', errorText)
        throw new Error(`Payment setup failed: ${res.status} - ${errorText}`)
      }

      const { data, error: apiError } = await res.json()
      
      if (apiError || !data) {
        throw new Error(apiError || 'Payment setup failed. Please try again.')
      }

      console.log('✅ Payment data received, redirecting to PayFast...')

      const isSandbox = PAYFAST_CONFIG.sandbox
      const action = isSandbox
        ? 'https://sandbox.payfast.co.za/eng/process'
        : 'https://www.payfast.co.za/eng/process'

      // Create and submit form
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = action

      Object.entries(data).forEach(([key, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = String(value)
        form.appendChild(input)
      })

      document.body.appendChild(form)
      form.submit()
      
    } catch (err) {
      console.error('❌ Subscription error:', err)
      setError(err instanceof Error ? err.message : 'Unexpected error. Please try again.')
      setLoading(false)
      setProcessingPlan(null)
    }
  }

  // ===== HANDLE CANCEL =====
  async function handleCancelSubscription() {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features.')) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('user_email', userEmail)
        .eq('plan', currentPlan)

      if (updateError) throw updateError

      setSubscriptionStatus('canceled')
      setCurrentPlan('free')
      alert('Your subscription has been canceled. You will be downgraded to the Free plan at the end of your billing period.')
    } catch (err) {
      console.error('Cancel error:', err)
      setError('Failed to cancel subscription. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ===== LOADING STATE =====
  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Loading subscription details...</p>
        </div>
      </div>
    )
  }

  // ===== ACTUAL PAGE =====
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fbf9_0%,#eef8f1_100%)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/dashboard" className="inline-flex items-center gap-2 mb-4 rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D8F3DC] text-[#2D6A4F]">
              <ShieldCheck size={16} />
            </div>
            <span className="text-sm font-semibold text-[#1B4332]">RootBase</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1B4332] mb-3">
            Choose the plan that fits your farm
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm sm:text-base">
            Every plan includes the features shown below. Your subscription unlocks exactly what you select, and you can cancel at any time.
          </p>
          
          {subscriptionStatus === 'active' && (
            <div className="mt-4 inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm px-4 py-2 rounded-full border border-green-200">
              <Check size={16} /> Active Plan: <strong className="capitalize">{currentPlan}</strong>
            </div>
          )}

          {subscriptionStatus === 'canceled' && (
            <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-sm px-4 py-2 rounded-full border border-amber-200">
              <AlertCircle size={16} /> Subscription Canceled — Active until end of billing period
            </div>
          )}

          {PAYFAST_CONFIG.sandbox && (
            <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-xs px-4 py-2 rounded-full border border-amber-200">
              <RefreshCw size={12} /> Sandbox mode — use test card details from PayFast
            </div>
          )}
          
          {error && (
            <div className="mt-4 mx-auto max-w-md">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 text-left">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id
            const isProcessing = processingPlan === plan.id
            const isHighlighted = plan.highlighted
            const isCanceled = subscriptionStatus === 'canceled' && isCurrent

            return (
              <Card
                key={plan.id}
                className={`shadow-sm relative flex flex-col transition-all duration-200 ${
                  isHighlighted
                    ? 'border-2 border-[#2D6A4F] shadow-lg hover:shadow-xl'
                    : 'border border-gray-200 hover:shadow-md'
                } ${isCurrent ? 'border-green-400 bg-green-50/30' : ''} ${isCanceled ? 'border-amber-400 bg-amber-50/30' : ''}`}
              >
                {isHighlighted && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-[#2D6A4F] text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                      <Zap size={10} /> Most Popular
                    </span>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-3 right-4 z-10">
                    <span className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-md ${
                      isCanceled ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'
                    }`}>
                      {isCanceled ? <AlertCircle size={10} /> : <Check size={10} />}
                      {isCanceled ? 'Canceled' : 'Current'}
                    </span>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-[#1B4332] flex items-center gap-2">
                    {plan.name}
                    {plan.id === 'pro' && <Crown size={16} className="text-[#2D6A4F]" />}
                  </CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-[#1B4332]">{plan.priceDisplay}</span>
                    {plan.price > 0 && (
                      <span className="text-sm text-gray-400 ml-1">/{plan.period}</span>
                    )}
                    {plan.price === 0 && (
                      <span className="text-sm text-gray-400 ml-1">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-2 flex-1 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-[#D8F3DC] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check size={12} className="text-[#2D6A4F]" />
                        </div>
                        <span className={`text-xs ${isCurrent ? 'text-gray-700' : 'text-gray-600'}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {isCanceled ? (
                    <Button
                      className="w-full bg-amber-100 text-amber-700 cursor-default hover:bg-amber-100"
                      disabled
                    >
                      Canceled — Active until end of period
                    </Button>
                  ) : (
                    <Button
                      className={`w-full transition-all ${
                        isCurrent
                          ? 'bg-green-100 text-green-700 cursor-default hover:bg-green-100'
                          : isHighlighted
                          ? 'bg-[#2D6A4F] hover:bg-[#1B4332] text-white shadow-sm hover:shadow-md'
                          : plan.price === 0
                          ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          : 'bg-[#2D6A4F] hover:bg-[#1B4332] text-white shadow-sm hover:shadow-md'
                      }`}
                      onClick={() => handleSubscribe(plan)}
                      disabled={isCurrent || plan.price === 0 || loading || isProcessing}
                    >
                      {isProcessing ? (
                        <><Loader2 size={16} className="animate-spin mr-2" /> Processing...</>
                      ) : isCurrent ? (
                        '✓ Current Plan'
                      ) : plan.cta}
                    </Button>
                  )}

                  {plan.price > 0 && !isCurrent && !isCanceled && (
                    <p className="text-[10px] text-gray-400 text-center mt-2">
                      Secure payment via PayFast
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Current Plan Actions */}
        {subscriptionStatus === 'active' && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              onClick={handleCancelSubscription}
              disabled={loading}
              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
            >
              {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Cancel Subscription
            </Button>
          </div>
        )}

        {/* Features footer */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {[
            { 
              title: 'Cancel Anytime', 
              desc: 'No lock-in contracts. Cancel with one click from your settings.' 
            },
            { 
              title: 'Secure Payments', 
              desc: 'All payments processed securely by PayFast — South Africa\'s leading payment gateway.' 
            },
            { 
              title: 'ZAR Pricing', 
              desc: 'No currency conversion fees. Pay in South African Rand.' 
            },
          ].map(({ title, desc }) => (
            <div key={title} className="p-4 bg-white/80 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-sm font-semibold text-[#1B4332] mb-1">{title}</p>
              <p className="text-xs text-gray-500 leading-5">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white/80 p-4 text-sm text-gray-600 shadow-sm">
          <p className="font-semibold text-[#1B4332]">What you are paying for</p>
          <p className="mt-1 leading-6">
            Each plan includes the features shown above, and your subscription unlocks the selected features immediately after payment confirmation. You can review the <Link href="/terms" className="text-[#2D6A4F] underline">terms</Link>, <Link href="/privacy" className="text-[#2D6A4F] underline">privacy policy</Link>, and <Link href="/refund-policy" className="text-[#2D6A4F] underline">refund policy</Link> at any time.
          </p>
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-10 bg-white/80 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-[#1B4332] flex items-center gap-2">
              <Sparkles size={16} className="text-[#2D6A4F]" />
              Detailed Feature Comparison
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feature</th>
                  {PLANS.map(plan => (
                    <th key={plan.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { key: 'farms', label: 'Number of Farms' },
                  { key: 'crops', label: 'Crops' },
                  { key: 'reports', label: 'Reports' },
                  { key: 'pdfExport', label: 'PDF Export' },
                  { key: 'weatherAlerts', label: 'Weather Alerts' },
                  { key: 'aiAssistant', label: 'AI Assistant' },
                  { key: 'advancedAnalytics', label: 'Advanced Analytics' },
                  { key: 'teamMembers', label: 'Team Members' },
                  { key: 'prioritySupport', label: 'Priority Support' },
                  { key: 'storage', label: 'Storage' },
                ].map(({ key, label }) => (
                  <tr key={key}>
                    <td className="px-4 py-3 text-xs text-gray-700 font-medium">{label}</td>
                    {PLANS.map(plan => {
                      const features = getFeatureAvailability(plan.id)
                      const value = features[key as keyof typeof features]
                      const isAvailable = typeof value === 'boolean' ? value : true
                      
                      return (
                        <td key={plan.id} className="px-4 py-3 text-center">
                          {typeof value === 'boolean' ? (
                            value ? (
                              <Check size={16} className="text-green-500 mx-auto" />
                            ) : (
                              <span className="text-gray-300">—</span>
                            )
                          ) : (
                            <span className="text-xs font-medium text-gray-700">{String(value)}</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link href="/dashboard" className="text-sm text-[#2D6A4F] hover:underline inline-flex items-center gap-1">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}