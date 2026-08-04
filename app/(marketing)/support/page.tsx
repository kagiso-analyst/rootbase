// app/(marketing)/faq/page.tsx

'use client'

import Link from 'next/link'
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

const faqs = [
  {
    question: 'What is RootBase?',
    answer: 'RootBase is a farm management platform designed for African farmers. It helps you track crops, livestock, finances, inventory, and more in one place.'
  },
  {
    question: 'How much does RootBase cost?',
    answer: 'RootBase offers a Free plan with basic features. The Starter plan costs R199/month and includes unlimited fields, financial reports, and priority support.'
  },
  {
    question: 'Can I use RootBase on my phone?',
    answer: 'Yes! RootBase is fully responsive and works on any device with a web browser - desktop, tablet, or smartphone.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use industry-standard encryption, secure authentication, and regular backups to keep your farm data safe.'
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period.'
  },
  {
    question: 'How do I import historical farm records?',
    answer: 'Go to Settings > Import Data. Each module (finances, crops, etc.) accepts any past date. Simply add records with the historical date and they will appear correctly in reports.'
  }
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fbf9_0%,#eef8f1_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#2D6A4F] hover:underline">
          <ArrowLeft size={16} /> Back home
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D8F3DC] text-[#2D6A4F]">
            <HelpCircle size={18} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#1B4332]">Frequently Asked Questions</h1>
            <p className="text-sm text-gray-500">Find answers to common questions about RootBase</p>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-200 overflow-hidden transition-all hover:border-[#2D6A4F]/30"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-[#F8FBF9] transition-colors"
              >
                <span className="text-sm font-medium text-[#1B4332]">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp size={18} className="text-[#2D6A4F] flex-shrink-0" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-[#F8FBF9] p-4 text-center">
          <p className="text-sm text-gray-600">
            Still have questions?{' '}
            <Link href="/support" className="text-[#2D6A4F] font-medium hover:underline">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}