// app/(marketing)/refund-policy/page.tsx

'use client'

import Link from 'next/link'
import { ArrowLeft, CreditCard } from 'lucide-react'

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fbf9_0%,#eef8f1_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#2D6A4F] hover:underline">
          <ArrowLeft size={16} /> Back home
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D8F3DC] text-[#2D6A4F]">
            <CreditCard size={18} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#1B4332]">Refund & Cancellation Policy</h1>
            <p className="text-sm text-gray-500">Our commitment to you</p>
          </div>
        </div>

        <div className="mt-8 space-y-5 text-sm leading-7 text-gray-600">
          <p>
            You may cancel your RootBase subscription at any time through your account settings. Upon cancellation, your subscription will not renew at the end of the current billing cycle.
          </p>
          <p>
            Refunds are available within 14 days of purchase if you have not extensively used the service. Contact support@rootbase.co.za to request a refund.
          </p>
          <p>
            If you cancel after 14 days, you will retain access to the service until the end of your current billing period, but no refund will be issued for the remaining time.
          </p>
          <p>
            For annual subscriptions, cancellations will take effect at the end of the current year. Pro-rated refunds are not available for annual plans.
          </p>
          <p>
            If you experience technical issues that prevent you from using the service, we will work with you to resolve them or issue a refund if we cannot.
          </p>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6 text-xs text-gray-400">
          <p>Last updated: January 2025</p>
          <p className="mt-1">Contact us at support@rootbase.co.za for any questions about your subscription.</p>
        </div>
      </div>
    </div>
  )
}