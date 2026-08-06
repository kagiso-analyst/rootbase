// app/(marketing)/faq/page.tsx

'use client'

import Link from 'next/link'
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

const faqs = [
  {
    question: 'What is RootBase?',
    answer: 'RootBase is a farm management platform designed for African farmers. It helps you track crops, livestock, finances, inventory, tasks, and more in one place.'
  },
  {
    question: 'How much does RootBase cost?',
    answer: 'RootBase offers a Free plan with basic features. The Starter plan costs R199/month, and the Pro plan costs R499/month. All plans include the core features you need to run your farm.'
  },
  {
    question: 'Can I use RootBase on my phone?',
    answer: 'Yes! RootBase is fully responsive and works on any device with a web browser - desktop, tablet, or smartphone. There\'s no app to download.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use industry-standard encryption, secure authentication with Supabase, and regular backups to keep your farm data safe and private.'
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period.'
  },
  {
    question: 'How do I import historical farm records?',
    answer: 'Go to Settings > Import Data. Each module (finances, crops, etc.) accepts any past date. Simply add records with the historical date and they will appear correctly in reports.'
  },
  {
    question: 'What happens to my data if I cancel?',
    answer: 'Your data remains safe and accessible for 30 days after cancellation. If you re-subscribe within that period, all your data will be restored. After 30 days, data is permanently deleted.'
  },
  {
    question: 'Do you offer support for free users?',
    answer: 'Yes! All users get access to our support system. Free users receive standard support (responses within 24 hours), while Pro users get priority support (responses within 4 hours).'
  },
  {
    question: 'Can I use RootBase for multiple farms?',
    answer: 'Yes! The Free plan includes 1 farm, Starter includes 1 farm, and Pro includes up to 3 farms. You can switch between farms easily from the top bar.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards and debit cards through PayFast, South Africa\'s leading payment gateway. Payments are processed securely in ZAR.'
  },
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

        <div className="mt-6 border-t border-gray-200 pt-6 text-center">
          <p className="text-xs text-gray-400">
            Can't find what you're looking for? Email us at{' '}
            <a href="mailto:support@rootbase.co.za" className="text-[#2D6A4F] hover:underline">
              support@rootbase.co.za
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}