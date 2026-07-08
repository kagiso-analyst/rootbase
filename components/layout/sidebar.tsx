'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Bell, BookOpen, BarChart2, Leaf, PawPrint,
  Package, Building2, CheckSquare, Wrench, TrendingUp,
  FolderOpen, Settings, Calculator
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/journal',    label: 'Journal',     icon: BookOpen },
  { href: '/finances',   label: 'Finances',    icon: BarChart2 },
  { href: '/crops',      label: 'Crops',       icon: Leaf },
  { href: '/livestock',  label: 'Livestock',   icon: PawPrint },
  { href: '/inventory',  label: 'Inventory',   icon: Package },
  { href: '/suppliers',  label: 'Suppliers',   icon: Building2 },
  { href: '/tasks',      label: 'Tasks',       icon: CheckSquare },
  { href: '/equipment',  label: 'Equipment',   icon: Wrench },
  { href: '/analytics',  label: 'Analytics',   icon: TrendingUp },
  { href: '/analytics/costs', label: 'Cost Calculator', icon: Calculator },
  { href: '/documents',  label: 'Documents',   icon: FolderOpen },
  { href: '/settings',   label: 'Settings',    icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-[#1B4332] text-white">
      <div className="px-6 py-5 border-b border-[#2D6A4F]">
        <span className="text-xl font-bold tracking-tight">RootBase</span>
        <p className="text-xs text-[#52B788] mt-0.5">Farm Management</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
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
      </nav>
      <div className="px-6 py-4 border-t border-[#2D6A4F]">
        <p className="text-xs text-[#52B788]">© 2026 RootBase</p>
      </div>
    </aside>
  )
}