'use client'

import Link from 'next/link'
import { ArrowLeft, MessageCircle, Mail, Globe2, ShieldCheck } from 'lucide-react'

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fbf9_0%,#eef8f1_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#2D6A4F]">
          <ArrowLeft size={16} /> Back home
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D8F3DC] text-[#2D6A4F]">
            <MessageCircle size={18} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#1B4332]">Support and contact</h1>
            <p className="text-sm text-gray-500">We are here to help with subscriptions, account access, and technical issues.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-[#F8FBF9] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1B4332]">
              <Mail size={16} className="text-[#2D6A4F]" /> Email support
            </div>
            <p className="mt-2 text-sm text-gray-600">support@rootbase.co.za</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-[#F8FBF9] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1B4332]">
              <Globe2 size={16} className="text-[#2D6A4F]" /> Website
            </div>
            <p className="mt-2 text-sm text-gray-600">The public site for this app is configured through your deployment URL.</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1B4332]">
            <ShieldCheck size={16} className="text-[#2D6A4F]" /> Before you contact us
          </div>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-600">
            <li>Include your account email and the subscription plan you are using.</li>
            <li>Share a screenshot if you are seeing a payment or access issue.</li>
            <li>For billing questions, mention your PayFast payment reference if available.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
