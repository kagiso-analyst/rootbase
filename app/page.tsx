// app/page.tsx

import Link from 'next/link'
import { 
  Check, BarChart2, CheckSquare, BookOpen, Package, Cloud, 
  PawPrint, Wrench, Leaf, Sparkles, Rocket, TrendingUp,
  ArrowRight, Play, Users, Zap, Star, Building2
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Nav */}
      <nav className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-50 sm:px-6 md:px-12">
        <Logo size="md" />
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link href="/login" className="text-sm text-gray-500 hover:text-[#2D6A4F] transition-colors px-3 py-1.5">
            Sign In
          </Link>
          <Link href="/register" className="bg-[#1B4332] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#2D6A4F] transition-colors font-medium">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-16 text-center sm:px-6 sm:pt-24 sm:pb-20">
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

        <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link href="/register" className="bg-[#1B4332] text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-[#2D6A4F] transition-all shadow-lg shadow-green-900/20">
            Start for Free →
          </Link>
          <Link href="/login" className="border border-gray-200 text-gray-600 px-8 py-3.5 rounded-xl font-semibold hover:border-[#2D6A4F] hover:text-[#2D6A4F] transition-all">
            Sign In
          </Link>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-16 relative">
          <div className="bg-gradient-to-br from-[#D8F3DC]/20 to-white rounded-2xl border border-gray-200 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <span className="text-xs text-gray-400">Farm Dashboard</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Income', value: 'R12,480', color: 'text-green-600' },
                { label: 'Expenses', value: 'R7,250', color: 'text-red-500' },
                { label: 'Net Profit', value: '+R5,230', color: 'text-[#2D6A4F]' },
                { label: 'Active Crops', value: '6', color: 'text-blue-600' },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
            <div className="h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
              <BarChart2 size={20} className="mr-2 opacity-30" />
              Income vs Expenses Chart
            </div>
          </div>
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
              location: "Limpopo · 12ha"
            },
            {
              quote: "RootBase replaced my notebook and spreadsheets. Everything in one place.",
              name: "Sipho N.",
              location: "KwaZulu-Natal · 25ha"
            },
            {
              quote: "The weather alerts alone saved my spraying schedule twice this season.",
              name: "Johan R.",
              location: "Western Cape · 50ha"
            }
          ].map((testimonial) => (
            <div key={testimonial.name} className="bg-gray-50 rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-0.5 mb-2">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-gray-700 italic leading-relaxed">"{testimonial.quote}"</p>
              <div className="mt-3">
                <p className="text-sm font-semibold text-[#1B4332]">{testimonial.name}</p>
                <p className="text-xs text-gray-400">{testimonial.location}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B4332] mb-4">
              How RootBase Works
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Get your farm organised in three simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: Rocket,
                title: 'Create Your Account',
                desc: 'Sign up for free in under 2 minutes. No credit card required.'
              },
              {
                step: '2',
                icon: Leaf,
                title: 'Add Your Farm',
                desc: 'Set up your fields, crops, livestock, and start tracking.'
              },
              {
                step: '3',
                icon: TrendingUp,
                title: 'Start Growing',
                desc: 'Monitor finances, manage tasks, and make data-driven decisions.'
              }
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center group">
                <div className="relative inline-block">
                  <div className="w-20 h-20 bg-[#D8F3DC] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#1B4332] transition-colors">
                    <Icon size={28} className="text-[#2D6A4F] group-hover:text-white transition-colors" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-[#1B4332] text-white text-sm font-bold rounded-full flex items-center justify-center">
                    {step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[#1B4332] mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - All 4 Plans */}
      <section className="py-16 px-6 bg-[#F8FBF9]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap size={18} className="text-[#2D6A4F]" />
              <span className="text-xs font-semibold text-[#2D6A4F] bg-[#D8F3DC] px-3 py-1 rounded-full">Simple Pricing</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1B4332] mb-4">
              Choose the plan that fits your farm
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Start free, upgrade when you need more power
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-[#1B4332]">Free</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-[#1B4332]">R0</span>
                <span className="text-sm text-gray-400">/month</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">For getting started</p>
              <ul className="mt-4 space-y-2">
                {['1 Farm', 'Limited Records', 'Basic Reports', 'Weather Alerts', 'Task Management'].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={14} className="text-[#2D6A4F] flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <button className="w-full mt-6 py-2.5 border-2 border-[#2D6A4F] text-[#2D6A4F] font-medium rounded-lg hover:bg-[#D8F3DC] transition-colors">
                  Get Started Free
                </button>
              </Link>
            </div>

            {/* Starter Plan */}
            <div className="bg-white rounded-2xl border-2 border-[#2D6A4F] p-6 hover:shadow-lg transition-shadow relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#2D6A4F] text-white text-xs px-3 py-1 rounded-full">Most Popular</span>
              </div>
              <h3 className="text-xl font-bold text-[#1B4332]">Starter</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold text-[#1B4332]">R199</span>
                <span className="text-sm text-gray-400">/month</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">For growing farms</p>
              <ul className="mt-4 space-y-2">
                {['1 Farm', 'Unlimited Records', 'Full Financial Reports', 'Budget Planning', 'Balance Sheet', 'PDF Export'].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={14} className="text-[#2D6A4F] flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/subscription">
                <button className="w-full mt-6 py-2.5 bg-[#2D6A4F] text-white font-medium rounded-lg hover:bg-[#1B4332] transition-colors">
                  Subscribe Now
                </button>
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] rounded-2xl border border-[#2D6A4F] p-6 hover:shadow-lg transition-shadow text-white">
              <h3 className="text-xl font-bold">Pro</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">R499</span>
                <span className="text-sm text-[#52B788]">/month</span>
              </div>
              <p className="text-sm text-[#D8F3DC] mt-2">For serious farming operations</p>
              <ul className="mt-4 space-y-2">
                {['Up to 3 Farms', 'Unlimited Records', 'Everything in Starter', 'AI Farm Assistant', 'Priority Support', 'Advanced Analytics'].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-[#D8F3DC]">
                    <Check size={14} className="text-[#52B788] flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/subscription">
                <button className="w-full mt-6 py-2.5 bg-[#52B788] text-[#1B4332] font-medium rounded-lg hover:bg-[#D8F3DC] transition-colors">
                  Subscribe Now
                </button>
              </Link>
            </div>

            {/* Business Plan - NEW */}
            <div className="bg-gradient-to-br from-[#1B4332] to-[#0D2818] rounded-2xl border-2 border-[#52B788] p-6 hover:shadow-lg transition-shadow text-white relative">
              <div className="absolute -top-3 right-3">
                <span className="bg-[#52B788] text-[#1B4332] text-[10px] px-2 py-0.5 rounded-full font-bold">Enterprise</span>
              </div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                Business
                <Building2 size={16} className="text-[#52B788]" />
              </h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">R999</span>
                <span className="text-sm text-[#52B788]">/month</span>
              </div>
              <p className="text-sm text-[#D8F3DC] mt-2">For agri-businesses and co-ops</p>
              <ul className="mt-4 space-y-2">
                {[
                  'Everything in Pro',
                  'Unlimited farms',
                  'Team member access',
                  'API access',
                  'White-label reports',
                  'Dedicated support',
                  'Custom integrations'
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-[#D8F3DC]">
                    <Check size={14} className="text-[#52B788] flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/subscription">
                <button className="w-full mt-6 py-2.5 bg-[#52B788] text-[#1B4332] font-bold rounded-lg hover:bg-[#D8F3DC] transition-colors">
                  Subscribe Now
                </button>
              </Link>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            All plans include secure payment via PayFast. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Video Preview / CTA Section */}
      <section className="py-16 px-6 bg-[#1B4332] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Play size={20} className="text-[#52B788]" />
            <span className="text-xs font-semibold text-[#52B788]">See It In Action</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to organise your farm?
          </h2>
          <p className="text-[#D8F3DC] max-w-xl mx-auto mb-8">
            Join farmers across South Africa who are already managing their farms with RootBase.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <button className="px-8 py-3.5 bg-[#52B788] text-[#1B4332] font-semibold rounded-xl hover:bg-[#D8F3DC] transition-colors flex items-center gap-2">
                Start Free Trial
                <ArrowRight size={18} />
              </button>
            </Link>
            <Link href="/login">
              <button className="px-8 py-3.5 border border-[#52B788] text-white font-semibold rounded-xl hover:bg-[#2D6A4F]/40 transition-colors">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D8F3DC] text-[#2D6A4F]">
                <Leaf size={20} />
              </div>
            </div>
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
                tag: 'Most requested'
              },
              {
                icon: Leaf,
                title: 'Crop Management',
                desc: 'Record plantings, spray logs, harvest dates and yields. Track every field\'s history season after season.',
                tag: null
              },
              {
                icon: Cloud,
                title: 'Live Weather',
                desc: 'Real-time weather with farming advice. Know when to spray, irrigate, and harvest based on actual conditions.',
                tag: null
              },
              {
                icon: CheckSquare,
                title: 'Task Management',
                desc: 'Never miss a spray window or planting date. Assign tasks to workers and track completion.',
                tag: null
              },
              {
                icon: Package,
                title: 'Inventory Control',
                desc: 'Know exactly what\'s in your store. Get alerts before you run out of critical inputs like seed or fertiliser.',
                tag: null
              },
              {
                icon: PawPrint,
                title: 'Livestock Records',
                desc: 'Individual animal records, vaccination logs, weight tracking and breeding history — all in one place.',
                tag: null
              },
              {
                icon: BookOpen,
                title: 'Farm Journal',
                desc: 'Daily farm diary with photo support. Searchable by field, crop, date or tag. Your institutional memory.',
                tag: null
              },
              {
                icon: Wrench,
                title: 'Equipment Tracking',
                desc: 'Maintenance logs, service reminders and insurance expiry alerts for every piece of equipment.',
                tag: null
              },
              {
                icon: BarChart2,
                title: 'Analytics & Reports',
                desc: 'See your farm\'s performance at a glance. Income vs expenses charts, crop profitability, and cost breakdowns.',
                tag: null
              },
            ].map(({ icon: Icon, title, desc, tag }) => (
              <div key={title} className="group border border-gray-100 rounded-2xl p-6 hover:border-[#2D6A4F] hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
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
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo variant="text" size="sm" />
          <p className="text-xs text-gray-400 text-center sm:text-left">
            © 2026 Eliora Shammah Creative Studios (PTY) LTD · South Africa
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link href="/login" className="text-xs text-gray-400 hover:text-[#2D6A4F] transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="text-xs text-gray-400 hover:text-[#2D6A4F] transition-colors">
              Register
            </Link>
            <Link href="/subscription" className="text-xs text-gray-400 hover:text-[#2D6A4F] transition-colors">
              Pricing
            </Link>
            <Link href="/faq" className="text-xs text-gray-400 hover:text-[#2D6A4F] transition-colors">
              FAQ
            </Link>
            <Link href="/support" className="text-xs text-gray-400 hover:text-[#2D6A4F] transition-colors">
              Support
            </Link>
            <Link href="/privacy" className="text-xs text-gray-400 hover:text-[#2D6A4F] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs text-gray-400 hover:text-[#2D6A4F] transition-colors">
              Terms
            </Link>
            <Link href="/refund-policy" className="text-xs text-gray-400 hover:text-[#2D6A4F] transition-colors">
              Refunds
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}