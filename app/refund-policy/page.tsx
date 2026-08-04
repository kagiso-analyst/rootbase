'use client'

import Link from 'next/link'
import { ArrowLeft, RefreshCw, CircleAlert } from 'lucide-react'

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fbf9_0%,#eef8f1_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#2D6A4F]">
          <ArrowLeft size={16} /> Back home
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D8F3DC] text-[#2D6A4F]">
            <RefreshCw size={18} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#1B4332]">Refund and Cancellation Policy</h1>
            <p className="text-sm text-gray-500">What to expect if you cancel or need a refund</p>
          </div>
        </div>

        <div className="mt-8 space-y-5 text-sm leading-7 text-gray-600">
          <p>
            You may cancel your subscription at any time from the dashboard or the subscription page. Cancellation prevents future billing, but does not automatically generate a refund for charges already processed.
          </p>
          <p>
            Refund requests are assessed on a case-by-case basis and may be granted where there has been an error in billing, an unsuccessful service delivery, or where required by applicable consumer protection law.
          </p>
          <p>
            If you believe you are entitled to a refund, contact us at support@rootbase.co.za with your account email and payment reference.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-[#F8FBF9] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1B4332]">
            <CircleAlert size={16} className="text-[#2D6A4F]" /> Important note
          </div>
          <p className="mt-2 text-sm text-gray-600">
            You will continue to have access to the paid features until the end of your current billing cycle unless a refund is approved.
          </p>
        </div>
      </div>
    </div>
  )
}
