import Link from 'next/link'
import { Check, Leaf, BarChart2, CheckSquare, BookOpen, Package, Cloud, PawPrint, Wrench } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-4 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#1B4332] rounded-lg flex items-center justify-center">
            <Leaf size={14} className="text-[#52B788]" />
          </div>
          <span className="text-lg font-bold text-[#1B4332]">RootBase</span>
        </div>
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

        {/* Dashboard preview */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 bottom-0 h-1/3 pointer-events-none" />
          <div className="bg-[#F9FAFB] border border-gray-200 rounded-2xl p-6 shadow-2xl shadow-gray-200 text-left">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 bg-white rounded-md h-6 ml-2 border border-gray-100 flex items-center px-3">
                <span className="text-xs text-gray-400">rootbase.vercel.app/dashboard</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Total Income', value: 'R24,500', color: 'text-green-600' },
                { label: 'Total Expenses', value: 'R11,200', color: 'text-red-500' },
                { label: 'Net Profit', value: 'R13,300', color: 'text-[#2D6A4F]' },
                { label: 'Active Crops', value: '4', color: 'text-[#2D6A4F]' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded-xl p-3 border border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-3">Today's Tasks</p>
                {['Spray tomatoes — Field A', 'Check irrigation — Block 2', 'Log this week\'s expenses'].map(t => (
                  <div key={t} className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded border-2 border-[#2D6A4F]" />
                    <p className="text-xs text-gray-600">{t}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[#1B4332] rounded-xl p-4 text-white">
                <p className="text-xs font-semibold text-[#52B788] mb-1">Weather · Johannesburg</p>
                <p className="text-3xl font-bold mb-1">24°C</p>
                <p className="text-xs text-[#D8F3DC] capitalize mb-3">Partly cloudy ⛅</p>
                <p className="text-xs text-[#52B788]">✅ Good conditions for spraying today</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos / social proof */}
      <section className="border-y border-gray-100 py-8 px-6">
        <p className="text-center text-xs text-gray-400 mb-6 uppercase tracking-widest">
          Built for farmers across South Africa
        </p>
        <div className="flex items-center justify-center gap-8 flex-wrap text-gray-300 text-sm font-semibold">
          {['Limpopo', 'Free State', 'KwaZulu-Natal', 'Western Cape', 'Gauteng', 'Mpumalanga'].map(p => (
            <span key={p} className="text-gray-400">{p}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
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
                  <div className="w-10 h-10 bg-[#D8F3DC] rounded-xl flex items-center justify-center group-hover:bg-[#1B4332] transition-colors">
                    <Icon size={18} className="text-[#2D6A4F] group-hover:text-white transition-colors" />
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

      {/* Multi-farm feature highlight */}
      <section className="bg-[#F9FAFB] py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-[#D8F3DC] text-[#2D6A4F] text-xs font-semibold px-3 py-1 rounded-full mb-4">
                Multi-Farm Support
              </div>
              <h2 className="text-3xl font-bold text-[#1B4332] mb-4">
                One account.<br />All your farms.
              </h2>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Managing more than one farm? RootBase lets you switch between farms instantly.
                Each farm has its own data, records, and reports — all in one account.
              </p>
              <ul className="space-y-3">
                {[
                  'Add unlimited farms to one account',
                  'Switch between farms with one click',
                  'Each farm has completely separate data',
                  'Compare performance across your farms',
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-5 h-5 bg-[#D8F3DC] rounded-full flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-[#2D6A4F]" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Switch Farm</p>
              {[
                { name: 'Shammah Family Farm', type: 'Mixed farming · 45 ha', active: true },
                { name: 'Limpopo Tomato Block', type: 'Horticulture · 12 ha', active: false },
                { name: 'Free State Grain Farm', type: 'Crop farming · 200 ha', active: false },
              ].map(({ name, type, active }) => (
                <div key={name} className={`flex items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer ${active ? 'bg-[#1B4332] text-white' : 'hover:bg-gray-50'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-[#2D6A4F]' : 'bg-[#D8F3DC]'}`}>
                    <Leaf size={14} className={active ? 'text-white' : 'text-[#2D6A4F]'} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-800'}`}>{name}</p>
                    <p className={`text-xs ${active ? 'text-[#52B788]' : 'text-gray-400'}`}>{type}</p>
                  </div>
                  {active && <div className="ml-auto w-2 h-2 bg-[#52B788] rounded-full" />}
                </div>
              ))}
              <button className="w-full mt-2 border-2 border-dashed border-gray-200 rounded-xl py-2.5 text-sm text-gray-400 hover:border-[#2D6A4F] hover:text-[#2D6A4F] transition-colors">
                + Add another farm
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Historical data feature */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-[#D8F3DC] text-[#2D6A4F] text-xs font-semibold px-3 py-1 rounded-full mb-4">
            Import Historical Data
          </div>
          <h2 className="text-3xl font-bold text-[#1B4332] mb-4">
            Farming since before 2026?
          </h2>
          <p className="text-gray-500 mb-8 max-w-xl mx-auto">
            No problem. RootBase lets you back-date all your records.
            Add expenses, harvests, and journal entries from 2020, 2021, or any year —
            so your full farm history lives in one place.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {['2023', '2024', '2025'].map(year => (
              <div key={year} className="border border-gray-200 rounded-xl p-4 text-center hover:border-[#2D6A4F] transition-colors">
                <p className="text-2xl font-bold text-[#1B4332]">{year}</p>
                <p className="text-xs text-gray-400 mt-1">Past data</p>
                <div className="mt-2 w-full h-1 bg-[#D8F3DC] rounded-full">
                  <div className="h-1 bg-[#2D6A4F] rounded-full w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-[#F9FAFB] py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1B4332] mb-3">
              Honest pricing. No surprises.
            </h2>
            <p className="text-gray-500">Start free. Upgrade when your farm grows.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                name: 'Free',
                price: 'R0',
                period: 'forever',
                features: ['1 farm', '50 records per module', 'Farm journal', 'Task management', 'Weather'],
                highlight: false,
                cta: 'Start Free'
              },
              {
                name: 'Starter',
                price: 'R199',
                period: 'per month',
                features: ['1 farm, unlimited records', 'Full financial tracking', 'Crop + livestock', 'Analytics + reports'],
                highlight: false,
                cta: 'Get Starter'
              },
              {
                name: 'Pro',
                price: 'R499',
                period: 'per month',
                features: ['3 farms', 'Everything in Starter', 'AI farm assistant', 'PDF reports', 'Priority support'],
                highlight: true,
                cta: 'Get Pro'
              },
              {
                name: 'Business',
                price: 'R999',
                period: 'per month',
                features: ['Unlimited farms', 'Team access', 'API access', 'White-label reports', 'Dedicated support'],
                highlight: false,
                cta: 'Get Business'
              },
            ].map(({ name, price, period, features, highlight, cta }) => (
              <div key={name} className={`rounded-2xl p-5 ${highlight ? 'bg-[#1B4332] text-white shadow-xl' : 'bg-white border border-gray-200'}`}>
                {highlight && (
                  <div className="text-xs text-[#52B788] font-semibold mb-2">⭐ Most Popular</div>
                )}
                <p className={`text-sm font-semibold mb-1 ${highlight ? 'text-[#52B788]' : 'text-gray-500'}`}>{name}</p>
                <p className={`text-3xl font-bold mb-0.5 ${highlight ? 'text-white' : 'text-[#1B4332]'}`}>{price}</p>
                <p className={`text-xs mb-5 ${highlight ? 'text-[#52B788]' : 'text-gray-400'}`}>{period}</p>
                <ul className="space-y-2 mb-6">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <Check size={12} className={`mt-0.5 flex-shrink-0 ${highlight ? 'text-[#52B788]' : 'text-[#2D6A4F]'}`} />
                      <span className={highlight ? 'text-[#D8F3DC]' : 'text-gray-500'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={`block text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${highlight ? 'bg-[#52B788] text-white hover:bg-[#2D6A4F]' : 'border border-gray-200 text-gray-600 hover:border-[#2D6A4F] hover:text-[#2D6A4F]'}`}>
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1B4332] py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-14 h-14 bg-[#2D6A4F] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Leaf size={26} className="text-[#52B788]" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Your Farm. Your Data.<br />Your Growth.
          </h2>
          <p className="text-[#D8F3DC] mb-8 text-lg">
            Join farmers across Africa who are managing smarter with RootBase.
          </p>
          <Link href="/register" className="inline-block bg-[#52B788] text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-[#2D6A4F] transition-colors shadow-lg">
            Start for Free Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#1B4332] rounded-md flex items-center justify-center">
              <Leaf size={12} className="text-[#52B788]" />
            </div>
            <span className="text-sm font-bold text-[#1B4332]">RootBase</span>
          </div>
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