// app/page.tsx

import Link from 'next/link'
import { Check, BarChart2, CheckSquare, BookOpen, Package, Cloud, PawPrint, Wrench, Leaf } from 'lucide-react'  // 👈 ADD Leaf
import { Logo } from '@/components/ui/Logo'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-4 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
        <Logo size="md" />
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-500 hover:text-[#2D6A4F] transition-colors px-3 py-1.5">
            Sign In
          </Link>
          <Link href="/register" className="bg-[#1B4332] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#2D6A4F] transition-colors font-medium">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-[#D8F3DC] text-[#2D6A4F] text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 bg-[#2D6A4F] rounded-full animate-pulse" />
          Built for African Farmers · Free to Start
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-[#1B4332] mb-6 leading-[1.1] tracking-tight">
          Your farm,<br />
          <span className="text-[#2D6A4F]">finally organised.</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          RootBase is the all-in-one digital farm manager for African farmers.
          Track finances, crops, livestock, weather and tasks — beautifully, in one place.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/register" className="bg-[#1B4332] text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-[#2D6A4F] transition-all shadow-lg shadow-green-900/20">
            Start for Free →
          </Link>
          <Link href="/login" className="border border-gray-200 text-gray-600 px-8 py-3.5 rounded-xl font-semibold hover:border-[#2D6A4F] hover:text-[#2D6A4F] transition-all">
            Sign In
          </Link>
        </div>

        {/* Dashboard preview - keep as is */}
        <div className="mt-16 relative">
          {/* ... rest of dashboard preview ... */}
        </div>
      </section>

      {/* Social Proof - Real Farmer Quotes */}
      <section className="border-y border-gray-100 py-12 px-6">
        <p className="text-center text-xs text-gray-400 mb-8 uppercase tracking-widest">
          Trusted by farmers across South Africa
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              quote: "I finally know if I'm making money on my tomatoes.",
              name: "Thembi M.",
              location: "Limpopo · 12ha",
              emoji: "🍅"
            },
            {
              quote: "RootBase replaced my notebook and spreadsheets. Everything in one place.",
              name: "Sipho N.",
              location: "KwaZulu-Natal · 25ha",
              emoji: "🌽"
            },
            {
              quote: "The weather alerts alone saved my spraying schedule twice this season.",
              name: "Johan R.",
              location: "Western Cape · 50ha",
              emoji: "🍇"
            }
          ].map((testimonial) => (
            <div key={testimonial.name} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <div className="text-2xl mb-2">{testimonial.emoji}</div>
              <p className="text-sm text-gray-700 italic leading-relaxed">"{testimonial.quote}"</p>
              <div className="mt-3">
                <p className="text-sm font-semibold text-[#1B4332]">{testimonial.name}</p>
                <p className="text-xs text-gray-400">{testimonial.location}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-4xl mb-4">🚜</div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B4332] mb-4">
              Everything your farm needs
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              From daily tasks to annual reports — RootBase replaces your notebooks,
              spreadsheets and WhatsApp voice notes with one clean system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: BarChart2,
                title: 'Farm Finances',
                desc: 'Track every rand of income and expenses. Generate income statements your bank will accept. Know your profit margin per crop.',
                tag: 'Most requested',
                emoji: '💰'
              },
              {
                icon: Leaf,
                title: 'Crop Management',
                desc: 'Record plantings, spray logs, harvest dates and yields. Track every field\'s history season after season.',
                tag: null,
                emoji: '🌱'
              },
              {
                icon: Cloud,
                title: 'Live Weather',
                desc: 'Real-time weather with farming advice. Know when to spray, irrigate, and harvest based on actual conditions.',
                tag: null,
                emoji: '⛅'
              },
              {
                icon: CheckSquare,
                title: 'Task Management',
                desc: 'Never miss a spray window or planting date. Assign tasks to workers and track completion.',
                tag: null,
                emoji: '✅'
              },
              {
                icon: Package,
                title: 'Inventory Control',
                desc: 'Know exactly what\'s in your store. Get alerts before you run out of critical inputs like seed or fertiliser.',
                tag: null,
                emoji: '📦'
              },
              {
                icon: PawPrint,
                title: 'Livestock Records',
                desc: 'Individual animal records, vaccination logs, weight tracking and breeding history — all in one place.',
                tag: null,
                emoji: '🐄'
              },
              {
                icon: BookOpen,
                title: 'Farm Journal',
                desc: 'Daily farm diary with photo support. Searchable by field, crop, date or tag. Your institutional memory.',
                tag: null,
                emoji: '📖'
              },
              {
                icon: Wrench,
                title: 'Equipment Tracking',
                desc: 'Maintenance logs, service reminders and insurance expiry alerts for every piece of equipment.',
                tag: null,
                emoji: '🔧'
              },
              {
                icon: BarChart2,
                title: 'Analytics & Reports',
                desc: 'See your farm\'s performance at a glance. Income vs expenses charts, crop profitability, and cost breakdowns.',
                tag: null,
                emoji: '📊'
              },
            ].map(({ icon: Icon, title, desc, tag, emoji }) => (
              <div key={title} className="group border border-gray-100 rounded-2xl p-6 hover:border-[#2D6A4F] hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emoji}</span>
                    <div className="w-10 h-10 bg-[#D8F3DC] rounded-xl flex items-center justify-center group-hover:bg-[#1B4332] transition-colors">
                      <Icon size={18} className="text-[#2D6A4F] group-hover:text-white transition-colors" />
                    </div>
                  </div>
                  {tag && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">{tag}</span>
                  )}
                </div>
                <h3 className="font-semibold text-[#1B4332] mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <Logo variant="text" size="sm" />
          <p className="text-xs text-gray-400">
            © 2026 Eliora Shammah Creative Studios (PTY) LTD · South Africa
          </p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs text-gray-400 hover:text-[#2D6A4F]">Sign In</Link>
            <Link href="/register" className="text-xs text-gray-400 hover:text-[#2D6A4F]">Register</Link>
            <Link href="/subscription" className="text-xs text-gray-400 hover:text-[#2D6A4F]">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}