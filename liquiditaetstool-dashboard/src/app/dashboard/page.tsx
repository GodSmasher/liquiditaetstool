'use client'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { useState, useEffect } from 'react'
import KPICard from '@/components/KPICard'
import StatusBadge from '@/components/StatusBadge'
import { 
  Wallet, 
  TrendingDown, 
  FileText, 
  ArrowRight,
  Clock,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  currentBalance: number
  burnRate: number
  burnRateChange: number
  openReceivables: number
  openReceivablesCount: number
  overdueReceivables: number
  overdueCount: number
}

interface RecentReceivable {
  id: string
  customer: string
  amount: number
  dueDate: string
  status: 'paid' | 'open' | 'overdue'
  daysOverdue?: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    currentBalance: 125430.50,
    burnRate: -8500,
    burnRateChange: -12.5,
    openReceivables: 42350,
    openReceivablesCount: 8,
    overdueReceivables: 15200,
    overdueCount: 3
  })

  const [recentReceivables, setRecentReceivables] = useState<RecentReceivable[]>([
    {
      id: 'SV-2024-0012',
      customer: 'Musterfirma GmbH',
      amount: 4200,
      dueDate: '2024-11-15',
      status: 'overdue',
      daysOverdue: 5
    },
    {
      id: 'RE-2024-0501',
      customer: 'Solar Energy GmbH',
      amount: 12500,
      dueDate: '2024-11-25',
      status: 'open'
    },
    {
      id: 'SV-2024-0013',
      customer: 'Tech Solutions AG',
      amount: 8500,
      dueDate: '2024-12-20',
      status: 'open'
    },
    {
      id: 'SV-2024-0010',
      customer: 'Energie Plus GmbH',
      amount: 3200,
      dueDate: '2024-10-30',
      status: 'overdue',
      daysOverdue: 21
    },
  ])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="space-y-5">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Willkommen zurück!</h1>
        <p className="text-sm text-gray-600 mt-0.5">Hier ist deine Finanzübersicht für heute</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Aktueller Kontostand"
          value={formatCurrency(stats.currentBalance)}
          icon={Wallet}
          color="amber"
          subtitle="Hauptkonto"
        />
        
        <KPICard
          title="Burn Rate"
          value={formatCurrency(stats.burnRate)}
          change={stats.burnRateChange}
          changeLabel="vs. letzter Monat"
          icon={TrendingDown}
          color="red"
          trend="down"
        />
        
        <KPICard
          title="Offene Forderungen"
          value={formatCurrency(stats.openReceivables)}
          icon={FileText}
          color="blue"
          subtitle={`${stats.openReceivablesCount} Rechnungen`}
        />
        
        <KPICard
          title="Überfällige Forderungen"
          value={formatCurrency(stats.overdueReceivables)}
          icon={AlertTriangle}
          color="red"
          subtitle={`${stats.overdueCount} Rechnungen`}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Offene Forderungen Table */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Offene Forderungen</h2>
              <p className="text-xs text-gray-500 mt-0.5">Fällige und überfällige Rechnungen</p>
            </div>
            <Link
              href="/dashboard/forderungsmanagement"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            >
              Alle anzeigen
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Kunde
                  </th>
                  <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Betrag
                  </th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Fällig
                  </th>
                  <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentReceivables.map((receivable) => {
                  const daysUntilDue = getDaysUntilDue(receivable.dueDate)
                  
                  return (
                    <tr
                      key={receivable.id}
                      className="hover:bg-amber-50/50 transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/dashboard/forderungen/${receivable.id}`}
                    >
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{receivable.customer}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{receivable.id}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(receivable.amount)}</p>
                      </td>
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-sm text-gray-900">{formatDate(receivable.dueDate)}</p>
                          {receivable.status === 'overdue' && receivable.daysOverdue && (
                            <p className="text-xs text-red-600 mt-0.5 font-medium">
                              {receivable.daysOverdue} Tage überfällig
                            </p>
                          )}
                          {receivable.status === 'open' && daysUntilDue <= 7 && daysUntilDue > 0 && (
                            <p className="text-xs text-amber-600 mt-0.5 font-medium">
                              In {daysUntilDue} Tagen fällig
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={receivable.status} size="sm" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & Alerts */}
        <div className="space-y-4">
          {/* Alerts Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Wichtige Hinweise
            </h3>
            
            <div className="space-y-2.5">
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-red-900">3 überfällige Rechnungen</p>
                    <p className="text-xs text-red-700 mt-0.5">Gesamtbetrag: {formatCurrency(stats.overdueReceivables)}</p>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-amber-900">2 Rechnungen bald fällig</p>
                    <p className="text-xs text-amber-700 mt-0.5">Fällig in den nächsten 7 Tagen</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg shadow-md p-4 text-white">
            <h3 className="text-sm font-semibold mb-3">Monatszusammenfassung</h3>
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-white/20">
                <span className="text-xs text-white/90">Einnahmen</span>
                <span className="text-base font-semibold">+ {formatCurrency(45200)}</span>
              </div>
              
              <div className="flex items-center justify-between pb-2.5 border-b border-white/20">
                <span className="text-xs text-white/90">Ausgaben</span>
                <span className="text-base font-semibold">- {formatCurrency(38700)}</span>
              </div>
              
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold">Netto</span>
                <span className="text-xl font-bold">+ {formatCurrency(6500)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
