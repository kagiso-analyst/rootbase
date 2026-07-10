'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Bell, Cloud, BookOpen, BarChart2, Leaf, PawPrint,
  Package, Building2, CheckSquare, Wrench, TrendingUp,
  FolderOpen, Settings, Calculator, Zap, Menu, X
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',        label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/notifications',    label: 'Notifications',   icon: Bell },
  { href: '/weather',          label: 'Weather',         icon: Cloud },
  { href: '/journal',          label: 'Journal',         icon: BookOpen },
  { href: '/finances',         label: 'Finances',        icon: BarChart2 },
  { href: '/crops',            label: 'Crops',           icon: Leaf },
  { href: '/livestock',        label: 'Livestock',       icon: PawPrint },
  { href: '/inventory',        label: 'Inventory',       icon: Package },
  { href: '/suppliers',        label: 'Suppliers',       icon: Building2 },
  { href: '/tasks',            label: 'Tasks',           icon: CheckSquare },
  { href: '/equipment',        label: 'Equipment',       icon: Wrench },
  { href: '/analytics',        label: 'Analytics',       icon: TrendingUp },
  { href: '/analytics/costs',  label: 'Cost Calculator', icon: Calculator },
  { href: '/documents',        label: 'Documents',       icon: FolderOpen },
  { href: '/subscription',     label: 'Upgrade Plan',    icon: Zap },
  { href: '/settings',         label: 'Settings',        icon: Settings },
]

function NavLinks({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  return (
    <>
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${active
                ? 'bg-[#2D6A4F] text-white'
                : 'text-[#D8F3DC] hover:bg-[#2D6A4F]/60 hover:text-white'
              }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        )
      })}
    </>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 bg-[#1B4332] text-white p-2 rounded-lg shadow-lg"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={`md:hidden fixed top-0 left-0 h-full w-64 bg-[#1B4332] text-white z-50 transform transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#2D6A4F]">
          <div>
            <span className="text-xl font-bold tracking-tight">RootBase</span>
            <p className="text-xs text-[#52B788] mt-0.5">Farm Management</p>
          </div>
          <button onClick={() => setMobileOpen(false)}>
            <X size={20} className="text-[#52B788]" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto h-[calc(100%-80px)]">
          <NavLinks onClose={() => setMobileOpen(false)} />
        </nav>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 min-h-screen bg-[#1B4332] text-white">
        <div className="px-6 py-5 border-b border-[#2D6A4F]">
          <span className="text-xl font-bold tracking-tight">RootBase</span>
          <p className="text-xs text-[#52B788] mt-0.5">Farm Management</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavLinks />
        </nav>
        <div className="px-6 py-4 border-t border-[#2D6A4F]">
          <p className="text-xs text-[#52B788]">© 2026 RootBase</p>
        </div>
      </aside>
    </>
  )
}