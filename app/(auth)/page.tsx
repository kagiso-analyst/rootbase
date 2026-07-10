import Link from 'next/link'
import { Check, Leaf, BarChart2, CheckSquare, BookOpen, Package } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <span className="text-xl font-bold text-[#1B4332]">RootBase</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-gray-500 hover:text-[#2D6A4F]">Sign In</Link>
          <Link href="/register" className="bg-[#2D6A4F] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#1B4332] transition-colors">
            Start Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="inline-block bg-[#D8F3DC] text-[#2D6A4F] text-xs font-semibold px-3 py-1 rounded-full mb-6">
          Built for African Farmers
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-[#1B4332] mb-6 leading-tight">
          Know Your Farm<br />Like Never Before
        </h1>
        <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto">
          The all-in-one digital farm manager built for African farmers.
          Track finances, crops, livestock, and tasks — all in one place.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/register" className="bg-[#2D6A4F] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#1B4332] transition-colors">
            Start for Free
          </Link>
          <Link href="/login" className="border border-gray-200 text-gray-600 px-8 py-3 rounded-lg font-semibold hover:border-[#2D6A4F] transition-colors">
            Sign In
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-4">No credit card required</p>
      </section>

      {/* Features */}
      <section className="bg-[#F9FAFB] py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-[#1B4332] text-center mb-12">
            Everything your farm needs in one place
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BarChart2, title: 'Financial Tracking', desc: 'Track every rand of income and expenses. Generate income statements for your bank.' },
              { icon: Leaf, title: 'Crop Management', desc: 'Record plantings, spray logs, harvest dates and yields for every field.' },
              { icon: CheckSquare, title: 'Task Management', desc: 'Never miss a spray window or irrigation schedule. Manage your daily farm tasks.' },
              { icon: BookOpen, title: 'Farm Journal', desc: 'Daily record-keeping with photo support. Searchable and tagged by field and crop.' },
              { icon: Package, title: 'Inventory Control', desc: 'Track stock levels and get low-stock alerts before you run out of critical inputs.' },
              { icon: Leaf, title: 'Livestock Records', desc: 'Individual animal records, health events, vaccinations and breeding logs.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-10 h-10 bg-[#D8F3DC] rounded-lg flex items-center justify-center mb-4">
                  <Icon size={20} className="text-[#2D6A4F]" />
                </div>
                <h3 className="font-semibold text-[#1B4332] mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#1B4332] mb-4">Simple, honest pricing</h2>
          <p className="text-gray-500 mb-12">Start free. Upgrade when you need more.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { name: 'Free', price: 'R0', period: 'forever', features: ['1 farm', '50 records', 'Basic dashboard', 'Farm journal'] },
              { name: 'Starter', price: 'R199', period: 'per month', features: ['Unlimited records', 'Full financials', 'Crop + livestock', 'Analytics'], highlight: true },
              { name: 'Pro', price: 'R499', period: 'per month', features: ['3 farms', 'AI assistant', 'PDF reports', 'Priority support'] },
            ].map(({ name, price, period, features, highlight }) => (
              <div key={name} className={`rounded-xl p-6 ${highlight ? 'bg-[#1B4332] text-white shadow-lg' : 'bg-[#F9FAFB]'}`}>
                <p className={`text-sm font-medium mb-1 ${highlight ? 'text-[#52B788]' : 'text-gray-500'}`}>{name}</p>
                <p className={`text-3xl font-bold mb-1 ${highlight ? 'text-white' : 'text-[#1B4332]'}`}>{price}</p>
                <p className={`text-xs mb-6 ${highlight ? 'text-[#52B788]' : 'text-gray-400'}`}>{period}</p>
                <ul className="space-y-2 mb-6">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check size={14} className={highlight ? 'text-[#52B788]' : 'text-[#2D6A4F]'} />
                      <span className={highlight ? 'text-[#D8F3DC]' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={`block text-center text-sm font-semibold py-2 rounded-lg transition-colors ${highlight ? 'bg-[#52B788] text-white hover:bg-[#2D6A4F]' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#2D6A4F]'}`}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1B4332] py-20 px-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          Your Farm. Your Data. Your Growth.
        </h2>
        <p className="text-[#D8F3DC] mb-8">
          Join farmers across Africa who are managing smarter with RootBase.
        </p>
        <Link href="/register" className="bg-[#52B788] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#2D6A4F] transition-colors inline-block">
          Start for Free Today
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center border-t border-gray-100">
        <p className="text-xs text-gray-400">
          © 2026 RootBase — Eliora Shammah Creative Studios (PTY) LTD · South Africa
        </p>
      </footer>
    </div>
  )
}