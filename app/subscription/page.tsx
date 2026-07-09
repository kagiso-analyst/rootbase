'use client'

import { useState, useEffect } from 'react'
import { Check, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { PLANS, PAYFAST_CONFIG, getPayFastUrl } from '@/lib/payfast'

export default function SubscriptionPage() {
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [currentPlan, setCurrentPlan] = useState('free')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        setUserEmail(data.user.email || '')
        setUserName(data.user.user_metadata?.full_name || '')
      }

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_email', data.user?.email || '')
        .eq('status', 'active')
        .single()

      if (sub) setCurrentPlan(sub.plan)
    }
    fetchUser()
  }, [])

  function handleSubscribe(plan: typeof PLANS[0]) {
    if (plan.price === 0 || plan.id === currentPlan) return
    setLoading(true)

    const params = new URLSearchParams({
      merchant_id: PAYFAST_CONFIG.merchantId,
      merchant_key: PAYFAST_CONFIG.merchantKey,
      return_url: PAYFAST_CONFIG.returnUrl,
      cancel_url: PAYFAST_CONFIG.cancelUrl,
      notify_url: PAYFAST_CONFIG.notifyUrl,
      name_first: userName.split(' ')[0] || 'Farmer',
      name_last: userName.split(' ')[1] || '',
      email_address: userEmail,
      amount: plan.price.toFixed(2),
      item_name: `RootBase ${plan.name} Plan`,
      item_description: `Monthly subscription to RootBase ${plan.name}`,
      currency: 'ZAR',
    })

    const form = document.createElement('form')
    form.method = 'POST'
    form.action = getPayFastUrl()

    params.forEach((value, key) => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = key
      input.value = value
      form.appendChild(input)
    })

    document.body.appendChild(form)
    form.submit()
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[#1B4332] mb-3">
            Choose Your RootBase Plan
          </h1>
          <p className="text-gray-500">
            Start free. Upgrade when you're ready. Cancel anytime.
          </p>
          {PAYFAST_CONFIG.sandbox && (
            <div className="mt-4 inline-block bg-orange-100 text-orange-700 text-xs px-4 py-2 rounded-full">
              🧪 Sandbox mode — use test card details from sandbox.payfast.co.za
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id
            const isHighlighted = plan.highlighted

            return (
              <Card
                key={plan.id}
                className={`shadow-sm relative flex flex-col ${
                  isHighlighted
                    ? 'border-2 border-[#2D6A4F] shadow-lg'
                    : 'border border-gray-200'
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#2D6A4F] text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                      <Zap size={10} /> Most Popular
                    </span>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-[#1B4332]">{plan.name}</CardTitle>
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
                        <Check size={14} className="text-[#52B788] mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${
                      isCurrent
                        ? 'bg-gray-100 text-gray-400 cursor-default'
                        : isHighlighted
                        ? 'bg-[#2D6A4F] hover:bg-[#1B4332] text-white'
                        : plan.price === 0
                        ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        : 'bg-[#2D6A4F] hover:bg-[#1B4332] text-white'
                    }`}
                    onClick={() => handleSubscribe(plan)}
                    disabled={isCurrent || plan.price === 0 || loading}
                  >
                    {isCurrent ? '✓ Current Plan' : plan.cta}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            { title: 'Cancel Anytime', desc: 'No lock-in contracts. Cancel with one click from your settings.' },
            { title: 'Secure Payments', desc: 'All payments processed securely by PayFast — South Africa\'s leading payment gateway.' },
            { title: 'ZAR Pricing', desc: 'No currency conversion fees. Pay in South African Rand.' },
          ].map(({ title, desc }) => (
            <div key={title} className="p-4">
              <p className="text-sm font-semibold text-[#1B4332] mb-1">{title}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a href="/dashboard" className="text-sm text-[#2D6A4F] hover:underline">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
