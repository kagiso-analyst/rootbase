'use client'

import { useState, useEffect } from 'react'
import { Check, Star, Zap, Crown, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

type SubscriptionTier = 'free' | 'pro' | 'premium'

type UserSubscription = {
  id: string
  tier: SubscriptionTier
  status: 'active' | 'cancelled' | 'expired'
  current_period_start: string
  current_period_end: string
  created_at: string
}

type Plan = {
  id: SubscriptionTier
  name: string
  description: string
  price: number
  icon: React.ReactNode
  color: string
  features: string[]
  highlighted: boolean
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Starter',
    description: 'Perfect for small farms just getting started',
    price: 0,
    icon: <Zap size={24} />,
    color: 'text-blue-500',
    features: [
      'Dashboard overview',
      'Basic journal entries (up to 50)',
      'Income & expense tracking',
      'Monthly reports',
      'Up to 10 tasks',
      'Email support',
    ],
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Professional',
    description: 'For growing farms with more complex needs',
    price: 99,
    icon: <Star size={24} />,
    color: 'text-yellow-500',
    features: [
      'Everything in Starter',
      'Unlimited journal entries',
      'Advanced analytics & reports',
      'Crop management',
      'Equipment maintenance tracking',
      'Supplier management',
      'Priority email support',
      'Weekly cost calculator',
      'Custom reports export',
      'API access (coming soon)',
    ],
    highlighted: true,
  },
  {
    id: 'premium',
    name: 'Enterprise',
    description: 'For large-scale operations and businesses',
    price: 299,
    icon: <Crown size={24} />,
    color: 'text-purple-500',
    features: [
      'Everything in Professional',
      'Multi-user team accounts',
      'Role-based permissions',
      'Advanced financial forecasting',
      'Integration with accounting software',
      'Dedicated account manager',
      'Phone & email support',
      'Custom integrations',
      'Data backups & security',
      'Training & onboarding',
      'White-label options',
    ],
    highlighted: false,
  },
]

export default function SubscriptionsPage() {
  const [currentPlan, setCurrentPlan] = useState<SubscriptionTier>('free')
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier | null>(null)
  const [processing, setProcessing] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const res = await supabase
          .from('subscriptions')
          .select('*')
          .eq('status', 'active')
          .single()
        
        if (res.data) {
          setSubscription(res.data as UserSubscription)
          setCurrentPlan(res.data.tier as SubscriptionTier)
        } else {
          // Default to free plan if no subscription found
          setCurrentPlan('free')
        }
      } catch (err) {
        console.log('No active subscription found')
        setCurrentPlan('free')
      } finally {
        setLoading(false)
      }
    }
    fetchSubscription()
  }, [])

  async function handleSubscribe(tier: SubscriptionTier) {
    if (tier === 'free' || currentPlan === tier) return
    
    setProcessing(true)
    setSelectedPlan(tier)

    try {
      // For demo purposes, create subscription in database
      const { error } = await supabase.from('subscriptions').insert([{
        tier,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }])

      if (error) {
        console.error('Subscription error:', error)
        alert('Failed to process subscription. In production, this would integrate with Stripe/PayPal.')
      } else {
        alert(`Successfully subscribed to ${PLANS.find(p => p.id === tier)?.name} plan!`)
        setCurrentPlan(tier)
        
        // Refresh subscription data
        const res = await supabase
          .from('subscriptions')
          .select('*')
          .eq('status', 'active')
          .single()
        if (res.data) {
          setSubscription(res.data as UserSubscription)
        }
      }
    } catch (err) {
      console.error('Subscription crash:', err)
      alert('An error occurred. Please try again.')
    } finally {
      setProcessing(false)
      setSelectedPlan(null)
    }
  }

  async function handleCancel() {
    if (!subscription) return
    if (!confirm('Are you sure you want to cancel your subscription?')) return

    setProcessing(true)
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscription.id)

      if (error) {
        console.error('Cancel error:', error)
        alert('Failed to cancel subscription')
      } else {
        alert('Subscription cancelled successfully')
        setCurrentPlan('free')
        setSubscription(null)
      }
    } catch (err) {
      console.error('Cancel crash:', err)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p className="text-sm">Loading subscription details...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1B4332]">RootBase Subscription Plans</h1>
        <p className="text-gray-500 text-base mt-2">
          Choose the perfect plan for your farm's needs. Upgrade or downgrade anytime.
        </p>
      </div>

      {/* Current Plan Info */}
      {subscription && (
        <Card className="shadow-sm bg-gradient-to-r from-[#D8F3DC] to-[#B7E4C7] border-[#52B788]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Plan</p>
                <p className="text-xl font-bold text-[#1B4332]">
                  {PLANS.find(p => p.id === currentPlan)?.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Renews on {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="outline"
                className="text-red-500 border-red-200 hover:bg-red-50"
                onClick={handleCancel}
                disabled={processing}
              >
                Cancel Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={`shadow-sm transition-all ${
              plan.highlighted
                ? 'ring-2 ring-[#2D6A4F] scale-105'
                : 'hover:shadow-md'
            } ${currentPlan === plan.id ? 'border-2 border-[#2D6A4F]' : ''}`}
          >
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className={`${plan.color} mb-3`}>
                    {plan.icon}
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                </div>
                {plan.highlighted && (
                  <Badge className="bg-[#2D6A4F] text-white">Popular</Badge>
                )}
                {currentPlan === plan.id && (
                  <Badge variant="outline" className="border-[#2D6A4F] text-[#2D6A4F]">
                    Current
                  </Badge>
                )}
              </div>

              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[#1B4332]">
                    R{plan.price}
                  </span>
                  <span className="text-gray-500 text-sm">{plan.price > 0 ? '/month' : 'Forever'}</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Features */}
              <div className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check size={16} className="text-[#2D6A4F] flex-shrink-0 mt-1" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              {currentPlan === plan.id ? (
                <Button disabled className="w-full bg-gray-300 text-gray-600">
                  Current Plan
                </Button>
              ) : plan.id === 'free' ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSubscribe('free')}
                >
                  Downgrade to Free
                </Button>
              ) : (
                <Button
                  className={`w-full ${
                    plan.highlighted
                      ? 'bg-[#2D6A4F] hover:bg-[#1B4332] text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={processing && selectedPlan === plan.id}
                >
                  {processing && selectedPlan === plan.id ? (
                    'Processing...'
                  ) : (
                    <>
                      Upgrade to {plan.name}
                      <ArrowRight size={16} className="ml-2" />
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ Section */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">Can I change my plan anytime?</h4>
            <p className="text-sm text-gray-600">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">What happens if I downgrade?</h4>
            <p className="text-sm text-gray-600">
              Downgrading removes access to premium features immediately, but your data is preserved. You can upgrade again anytime.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">Is there a free trial?</h4>
            <p className="text-sm text-gray-600">
              The Starter plan is completely free! Try all basic features with no credit card required. Upgrade anytime to unlock more capabilities.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">What payment methods do you accept?</h4>
            <p className="text-sm text-gray-600">
              We accept all major credit cards and digital payment methods. Subscriptions renew automatically each month.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">Do you offer annual billing?</h4>
            <p className="text-sm text-gray-600">
              Contact our sales team for enterprise pricing and annual billing options. Email: sales@rootbase.farm
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Trust Badges */}
      <div className="bg-[#F0F9FF] border border-[#D8F3DC] rounded-lg p-6">
        <p className="text-center text-sm text-gray-600 mb-4">
          🔒 Secure • 📊 Trusted by 1000+ farms • 💰 Money-back guarantee
        </p>
        <p className="text-center text-xs text-gray-500">
          All payments are encrypted and secure. We respect your privacy.
        </p>
      </div>
    </div>
  )
}
