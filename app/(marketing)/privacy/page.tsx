// app/(marketing)/privacy/page.tsx

'use client'

import Link from 'next/link'
import { ArrowLeft, Lock, EyeOff } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fbf9_0%,#eef8f1_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#2D6A4F] hover:underline">
          <ArrowLeft size={16} /> Back home
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D8F3DC] text-[#2D6A4F]">
            <Lock size={18} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#1B4332]">Privacy Policy</h1>
            <p className="text-sm text-gray-500">How we handle your information</p>
          </div>
        </div>

        <div className="mt-8 space-y-5 text-sm leading-7 text-gray-600">
          <p>
            RootBase collects only the information needed to provide your account, farm records, and subscription services. This may include your name, email address, authentication details, and farm management data.
          </p>
          <p>
            We use this information to deliver the app experience, process subscriptions, improve service reliability, and communicate important account updates.
          </p>
          <p>
            We do not sell personal data. We may share limited information with payment processors or service providers strictly necessary to provide the requested service.
          </p>
          <p>
            You may contact us at support@rootbase.co.za to request access to, correction of, or deletion of your personal data where applicable.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-[#F8FBF9] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1B4332]">
            <EyeOff size={16} className="text-[#2D6A4F]" /> Your privacy matters
          </div>
          <p className="mt-2 text-sm text-gray-600">
            We use secure storage practices and encrypted transport where available to protect your data.
          </p>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6 text-xs text-gray-400">
          <p>Last updated: January 2025</p>
          <p className="mt-1">RootBase is committed to protecting your privacy and ensuring the security of your farm data.</p>
        </div>
      </div>
    </div>
  )
}