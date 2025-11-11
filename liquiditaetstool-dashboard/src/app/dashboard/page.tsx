'use client'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { useState, useEffect } from 'react'
import KPICard from '@/components/KPICard'
import StatusBadge from '@/components/StatusBadge'
import { 
  Wallet, 
  FileText, 
  ArrowRight,
  Clock,
  AlertTriangle,
  RefreshCw,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  overdueAmount: number
  paidCount: number
  pendingCount: number
  overdueCount: number
  paidPercentage: number
  pendingPercentage: number
  overduePercentage: number
}

interface RecentReceivable {
  id: string
  customer: string
  amount: number
  dueDate: string
  status: 'paid' | 'pending' | 'overdue'
  daysOverdue?: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
    paidPercentage: 0,
    pendingPercentage: 0,
    overduePercentage: 0
  })

  const [recentReceivables, setRecentReceivables] = useState<RecentReceivable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' })

  // Lade Daten beim Component Mount
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Lade Status-Statistiken
      const statusRes = await fetch('/api/forderungen/status')
      if (!statusRes.ok) throw new Error('Fehler beim Laden der Statistiken')
      const statusData = await statusRes.json()

      // Lade aktuelle offene/überfällige Rechnungen
      const receivablesRes = await fetch('/api/forderungen')
      if (!receivablesRes.ok) throw new Error('Fehler beim Laden der Forderungen')
      const receivablesData = await receivablesRes.json()

      // Berechne Zeitraum (aktuelles Jahr)
      const currentYear = new Date().getFullYear()
      const yearStart = `01.01.${currentYear}`
      const todayFormatted = new Date().toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
      setDateRange({ from: yearStart, to: todayFormatted })

      // Berechne Statistiken
      const totalAmount = statusData.total_open_amount + statusData.total_overdue_amount + 
                          (statusData.total_paid_amount || 0)
      const paidAmount = statusData.total_paid_amount || 0
      const pendingAmount = statusData.total_open_amount
      const overdueAmount = statusData.total_overdue_amount

      // Filtere nur offene und überfällige, sortiert nach Dringlichkeit
      const openAndOverdue = receivablesData
        .filter((r: any) => r.status === 'pending' || r.status === 'overdue')
        .sort((a: any, b: any) => {
          // Überfällige zuerst
          if (a.status === 'overdue' && b.status !== 'overdue') return -1
          if (a.status !== 'overdue' && b.status === 'overdue') return 1
          // Dann nach Fälligkeitsdatum
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        })
        .slice(0, 4) // Nur die ersten 4 anzeigen
        .map((r: any) => {
          const daysUntilDue = getDaysUntilDue(r.due_date)
          return {
            id: r.invoice_id,
            customer: r.customer,
            amount: r.amount,
            dueDate: r.due_date,
            status: r.status,
            daysOverdue: daysUntilDue < 0 ? Math.abs(daysUntilDue) : undefined
          }
        })

      setStats({
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueAmount,
        paidCount: statusData.paid_invoices,
        pendingCount: statusData.open_invoices,
        overdueCount: statusData.overdue_invoices,
        paidPercentage: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0,
        pendingPercentage: totalAmount > 0 ? (pendingAmount / totalAmount) * 100 : 0,
        overduePercentage: totalAmount > 0 ? (overdueAmount / totalAmount) * 100 : 0
      })

      setRecentReceivables(openAndOverdue)
    } catch (err: any) {
      console.error('Error loading dashboard data:', err)
      setError(err.message || 'Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }

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

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          <p className="mt-4 text-gray-600">Lade Dashboard...</p>
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="space-y-5">
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900">Fehler beim Laden</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <button
                onClick={loadDashboardData}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Erneut versuchen
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Willkommen zurück!</h1>
          <p className="text-sm text-gray-600 mt-0.5">Hier ist deine Finanzübersicht für heute</p>
        </div>
        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-600 transition-colors font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Gesamtumsatz mit Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-sm text-gray-600 font-medium">Gesamtumsatz</p>
            </div>
            {dateRange.from && (
              <span className="text-xs text-gray-500 tabular-nums">
                {dateRange.from} - {dateRange.to}
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-gray-900 tabular-nums mb-4 pl-13">{formatCurrency(stats.totalAmount)}</p>
          
          <div className="space-y-2.5 pl-13">
            {/* Bezahlt */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">Bezahlt</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-emerald-600 tabular-nums min-w-[120px] text-right">
                  {formatCurrency(stats.paidAmount)}
                </span>
                <span className="text-xs text-gray-500 tabular-nums w-[45px] text-right">
                  ({stats.paidPercentage.toFixed(0)}%)
                </span>
              </div>
            </div>
            
            {/* Offen */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">Offen</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-amber-600 tabular-nums min-w-[120px] text-right">
                  {formatCurrency(stats.pendingAmount)}
                </span>
                <span className="text-xs text-gray-500 tabular-nums w-[45px] text-right">
                  ({stats.pendingPercentage.toFixed(0)}%)
                </span>
              </div>
            </div>
            
            {/* Überfällig */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="text-sm text-gray-700">Überfällig</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-red-600 tabular-nums min-w-[120px] text-right">
                  {formatCurrency(stats.overdueAmount)}
                </span>
                <span className="text-xs text-gray-500 tabular-nums w-[45px] text-right">
                  ({stats.overduePercentage.toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Überfällige Forderungen (separate Warnung) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Überfällig</p>
              <p className="text-2xl font-bold text-red-600 tabular-nums">{formatCurrency(stats.overdueAmount)}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 pl-13">{stats.overdueCount} Rechnungen</p>
        </div>
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
                        <div className="max-w-[200px]">
                          <p className="text-sm font-medium text-gray-900 truncate">{receivable.customer}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{receivable.id}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <p className="text-sm font-semibold text-gray-900 tabular-nums min-w-[100px]">
                          {formatCurrency(receivable.amount)}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-sm text-gray-900 tabular-nums">{formatDate(receivable.dueDate)}</p>
                          {receivable.status === 'overdue' && receivable.daysOverdue && (
                            <p className="text-xs text-red-600 mt-0.5 font-medium tabular-nums">
                              {receivable.daysOverdue} Tage überfällig
                            </p>
                          )}
                          {receivable.status === 'open' && daysUntilDue <= 7 && daysUntilDue > 0 && (
                            <p className="text-xs text-amber-600 mt-0.5 font-medium tabular-nums">
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
              {stats.overdueCount > 0 && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-red-900">{stats.overdueCount} überfällige Rechnungen</p>
                      <p className="text-xs text-red-700 mt-0.5 tabular-nums">Gesamtbetrag: {formatCurrency(stats.overdueAmount)}</p>
                    </div>
                  </div>
                </div>
              )}

              {stats.pendingCount > 0 && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-amber-900">{stats.pendingCount} offene Rechnungen</p>
                      <p className="text-xs text-amber-700 mt-0.5 tabular-nums">Gesamtbetrag: {formatCurrency(stats.pendingAmount)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Card - CLEAN DESIGN */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Rechnungsübersicht</h3>
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs text-gray-600">Bezahlt</span>
                </div>
                <span className="text-sm font-semibold text-emerald-600 tabular-nums">{stats.paidCount}</span>
              </div>
              
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-xs text-gray-600">Offen</span>
                </div>
                <span className="text-sm font-semibold text-amber-600 tabular-nums">{stats.pendingCount}</span>
              </div>
              
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  <span className="text-xs font-semibold text-gray-900">Überfällig</span>
                </div>
                <span className="text-base font-bold text-red-600 tabular-nums">{stats.overdueCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
