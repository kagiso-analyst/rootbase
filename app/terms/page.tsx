'use client'

import Link from 'next/link'
import { ArrowLeft, ShieldCheck, FileText, RefreshCw } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fbf9_0%,#eef8f1_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#2D6A4F]">
          <ArrowLeft size={16} /> Back home
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D8F3DC] text-[#2D6A4F]">
            <FileText size={18} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#1B4332]">Terms of Service</h1>
            <p className="text-sm text-gray-500">Effective 4 August 2026</p>
          </div>
        </div>

        <div className="mt-8 space-y-5 text-sm leading-7 text-gray-600">
          <p>
            RootBase provides farm management services for agricultural businesses and individual farmers. By using our platform, you agree to keep your account information accurate and to use the service responsibly.
          </p>
          <p>
            Subscription plans are billed monthly and may be cancelled at any time. Access to premium features remains active until the end of the current billing period unless cancelled earlier.
          </p>
          <p>
            You are responsible for the data you enter into the platform and for maintaining the confidentiality of your login credentials.
          </p>
          <p>
            RootBase may update these terms from time to time. Material changes will be communicated through the platform or by email.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-[#F8FBF9] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1B4332]">
            <ShieldCheck size={16} className="text-[#2D6A4F]" /> Payments and subscriptions
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Payments are processed securely through PayFast. Refunds are handled according to the policy published on this page and applicable law.
          </p>
        </div>
      </div>
    </div>
  )
}
