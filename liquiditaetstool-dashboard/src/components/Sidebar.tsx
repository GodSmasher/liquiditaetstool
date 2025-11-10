'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { 
  LayoutGrid, 
  TrendingUp, 
  FileText, 
  ArrowLeftRight, 
  Receipt, 
  Calendar, 
  FolderOpen, 
  BarChart3,
  Menu,
  X,
  Zap
} from 'lucide-react'

interface MenuItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export default function Sidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    { name: 'Cashflow', href: '/dashboard/cashflow', icon: TrendingUp },
    { name: 'Forderungen', href: '/dashboard/forderungsmanagement', icon: FileText },
    { name: 'Transaktionen', href: '/dashboard/transaktionen', icon: ArrowLeftRight },
    { name: 'Rechnungen', href: '/dashboard/rechnungen', icon: Receipt },
    { name: 'Planwerte', href: '/dashboard/planwerte', icon: Calendar },
    { name: 'Kategorien', href: '/dashboard/kategorien', icon: FolderOpen },
    { name: 'Berichte', href: '/dashboard/berichte', icon: BarChart3 },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-700">
        <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-semibold text-base">Volta</h1>
          <p className="text-gray-400 text-xs">Energietechnik</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`
                flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors
                ${active 
                  ? 'bg-gray-700 text-amber-500' 
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }
              `}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-amber-500' : ''}`} />
              <span className="font-medium text-sm">{item.name}</span>
              {active && (
                <div className="ml-auto w-1 h-6 bg-amber-500 rounded-full"></div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="px-3 py-3 border-t border-gray-700">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center font-semibold text-white text-xs">
            {user?.email ? user.email.substring(0, 2).toUpperCase() : 'VE'}
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-medium">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Benutzer'}
            </p>
            <p className="text-gray-400 text-xs">Admin</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg shadow-lg"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-gray-800 z-40 transition-transform duration-300
          lg:translate-x-0 lg:w-64
          ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Spacer for desktop */}
      <div className="hidden lg:block w-64 flex-shrink-0" />
    </>
  )
}

