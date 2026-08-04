// app/(marketing)/terms/page.tsx

'use client'

import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fbf9_0%,#eef8f1_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#2D6A4F] hover:underline">
          <ArrowLeft size={16} /> Back home
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D8F3DC] text-[#2D6A4F]">
            <FileText size={18} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#1B4332]">Terms of Service</h1>
            <p className="text-sm text-gray-500">Agreement between you and RootBase</p>
          </div>
        </div>

        <div className="mt-8 space-y-5 text-sm leading-7 text-gray-600">
          <p>
            By using RootBase, you agree to these terms. RootBase provides farm management tools as a service, and you are responsible for the accuracy of the data you enter.
          </p>
          <p>
            You may cancel your subscription at any time via the account settings. Refunds are handled according to our refund policy.
          </p>
          <p>
            RootBase is provided "as is" without warranties of any kind. We aim to keep the service reliable but do not guarantee uninterrupted availability.
          </p>
          <p>
            We reserve the right to update these terms from time to time. Continued use of the service constitutes acceptance of any changes.
          </p>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6 text-xs text-gray-400">
          <p>Last updated: August 2026</p>
        </div>
      </div>
    </div>
  )
}