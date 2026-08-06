// components/layout/Sidebar.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Bell,
  Cloud,
  BookOpen,
  Wallet,
  Sprout,
  Beef,
  Boxes,
  Truck,
  CheckSquare,
  Wrench,
  BarChart3,
  Calculator,
  FileText,
  Crown,
  Settings,
  HelpCircle,
  Menu,
  X,
  Leaf
} from 'lucide-react'
import { useFarm } from '@/lib/farm-context'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'

// ===== TYPES =====
type NavItem = {
  name: string
  href: string
  icon: any
  badge?: number
  isFarm?: boolean
}

type NavSection = {
  title: string
  items: NavItem[]
}

// ===== NAVIGATION DATA =====
const navigation: NavSection[] = [
  {
    title: "ACTIVE FARM",
    items: [
      {
        name: "Plot 3",
        href: "#",
        icon: Leaf,
        isFarm: true,
      },
    ],
  },
  {
    title: "MAIN",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        name: "Notifications",
        href: "/notifications",
        icon: Bell,
        badge: 3,
      },
      {
        name: "Weather",
        href: "/weather",
        icon: Cloud,
      },
      {
        name: "Journal",
        href: "/journal",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      {
        name: "Finances",
        href: "/finances",
        icon: Wallet,
      },
      {
        name: "Crops",
        href: "/crops",
        icon: Sprout,
      },
      {
        name: "Livestock",
        href: "/livestock",
        icon: Beef,
      },
      {
        name: "Inventory",
        href: "/inventory",
        icon: Boxes,
      },
      {
        name: "Suppliers",
        href: "/suppliers",
        icon: Truck,
      },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      {
        name: "Tasks",
        href: "/tasks",
        icon: CheckSquare,
      },
      {
        name: "Equipment",
        href: "/equipment",
        icon: Wrench,
      },
      {
        name: "Analytics",
        href: "/analytics",
        icon: BarChart3,
      },
      {
        name: "Cost Calculator",
        href: "/analytics/costs",
        icon: Calculator,
      },
      {
        name: "Documents",
        href: "/documents",
        icon: FileText,
      },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      {
        name: "Upgrade Plan",
        href: "/subscription",
        icon: Crown,
      },
      {
        name: "Settings",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
]

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const { currentFarm } = useFarm()

  // Get the actual farm name from context
  const farmName = currentFarm?.name || 'No Farm Selected'

  // Update the farm name in navigation
  const navWithFarm = navigation.map((section) => {
    if (section.title === "ACTIVE FARM") {
      return {
        ...section,
        items: section.items.map((item) => ({
          ...item,
          name: farmName,
        })),
      }
    }
    return section
  })

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 bg-[#1B4332] text-white p-2.5 rounded-xl shadow-lg hover:bg-[#2D6A4F] transition-colors"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={cn(
        "md:hidden fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-[#1B4332] to-[#143025] text-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#2D6A4F]/50">
          <Logo size="md" />
          <button 
            onClick={() => setMobileOpen(false)}
            className="p-1.5 hover:bg-[#2D6A4F]/40 rounded-lg transition-colors"
          >
            <X size={20} className="text-[#52B788]" />
          </button>
        </div>
        <nav className="flex-1 px-4 py-4 overflow-y-auto h-[calc(100%-80px)]">
          <div className="space-y-6">
            {/* Active Farm Section */}
            <div>
              <p className="text-[10px] text-[#52B788]/70 uppercase tracking-wider font-semibold mb-2">
                ACTIVE FARM
              </p>
              <div className="bg-[#2D6A4F]/30 rounded-lg px-3 py-2.5 border border-[#2D6A4F]/20">
                <div className="flex items-center gap-2.5">
                  <Leaf size={16} className="text-[#52B788]" />
                  <span className="text-sm font-medium text-white truncate">
                    {currentFarm?.name || 'No Farm'}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Sections */}
            {navWithFarm.slice(1).map((section) => (
              <div key={section.title}>
                <p className="text-[10px] text-[#52B788]/70 uppercase tracking-wider font-semibold mb-2">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                    const Icon = item.icon

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                          isActive
                            ? "bg-[#2D6A4F] text-white shadow-lg shadow-[#2D6A4F]/20"
                            : "text-[#D8F3DC] hover:bg-[#2D6A4F]/40 hover:text-white"
                        )}
                      >
                        <Icon size={18} className={cn(
                          "flex-shrink-0",
                          isActive ? "text-white" : "text-[#52B788]"
                        )} />
                        <span className="flex-1">{item.name}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-gradient-to-b from-[#1B4332] to-[#143025] text-white shadow-xl border-r border-[#2D6A4F]/20 flex-shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-[#2D6A4F]/50">
          <Logo size="md" />
          <p className="text-xs text-[#52B788] mt-0.5 font-medium">Farm Management</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2D6A4F] scrollbar-track-transparent">
          <div className="space-y-6">
            {/* Active Farm Section */}
            <div>
              <p className="text-[10px] text-[#52B788]/70 uppercase tracking-wider font-semibold mb-2">
                ACTIVE FARM
              </p>
              <div className="bg-[#2D6A4F]/30 rounded-lg px-3 py-2.5 border border-[#2D6A4F]/20">
                <div className="flex items-center gap-2.5">
                  <Leaf size={16} className="text-[#52B788]" />
                  <span className="text-sm font-medium text-white truncate">
                    {currentFarm?.name || 'No Farm Selected'}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Sections */}
            {navWithFarm.slice(1).map((section) => (
              <div key={section.title}>
                <p className="text-[10px] text-[#52B788]/70 uppercase tracking-wider font-semibold mb-2">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                    const Icon = item.icon

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                          isActive
                            ? "bg-[#2D6A4F] text-white shadow-lg shadow-[#2D6A4F]/20"
                            : "text-[#D8F3DC] hover:bg-[#2D6A4F]/40 hover:text-white"
                        )}
                      >
                        <Icon size={18} className={cn(
                          "flex-shrink-0",
                          isActive ? "text-white" : "text-[#52B788]"
                        )} />
                        <span className="flex-1">{item.name}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2D6A4F]/50">
          <Link 
            href="/support" 
            className="flex items-center gap-2 text-sm text-[#52B788] hover:text-[#D8F3DC] transition-colors mb-3"
          >
            <HelpCircle size={16} />
            <span>Need help?</span>
            <span className="text-[#52B788]/60">Visit our help center →</span>
          </Link>
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#52B788]/50">© 2026 RootBase</p>
            <span className="text-xs text-[#52B788]/40">v1.0</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-[#52B788]/40">All systems ready</span>
          </div>
        </div>
      </aside>
    </>
  )
}