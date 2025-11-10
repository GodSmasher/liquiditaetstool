'use client'

import { ChevronDown, Plus, Download, Settings, Bell, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface HeaderProps {
  title?: string
  user?: {
    email: string
  } | null
}

export default function Header({ title, user }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left Side - Title */}
        <div>
          {title && (
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          )}
        </div>

        {/* Right Side - Actions & User */}
        <div className="flex items-center gap-2">
          {/* Action Buttons */}
          <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          
          <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
          </button>

          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Neue Rechnung</span>
          </button>

          {/* Company/User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-medium text-gray-900">Volta Energietechnik</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <div className="w-7 h-7 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center font-semibold text-white text-xs">
                  VE
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-40">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">Volta Energietechnik GmbH</p>
                    <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                  </div>
                  
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Einstellungen
                  </button>
                  
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  
                  <div className="border-t border-gray-100 my-2" />
                  
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Abmelden
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

