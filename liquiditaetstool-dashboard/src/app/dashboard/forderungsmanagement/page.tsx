'use client'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/StatusBadge'
import { 
  Search, 
  Filter, 
  Download, 
  MoreVertical,
  RefreshCw,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

interface Receivable {
  invoice_id: string
  customer: string
  amount: number
  due_date: string
  status: 'paid' | 'open' | 'overdue'
  reminder_level: number
}

interface ReceivablesStatus {
  total_invoices: number
  open_invoices: number
  overdue_invoices: number
  paid_invoices: number
  total_open_amount: number
  total_overdue_amount: number
}

export default function ForderungsmanagementPage() {
  const router = useRouter()
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [status, setStatus] = useState<ReceivablesStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'overdue' | 'paid'>('all')
  const [syncing, setSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const receivablesUrl = statusFilter === 'all' 
        ? '/api/forderungen'
        : `/api/forderungen?status=${statusFilter}`
      
      const receivablesRes = await fetch(receivablesUrl)
      if (!receivablesRes.ok) throw new Error('Fehler beim Laden der Forderungen')
      const receivablesData = await receivablesRes.json()
      setReceivables(receivablesData)

      const statusRes = await fetch('/api/forderungen/status')
      if (!statusRes.ok) throw new Error('Fehler beim Laden des Status')
      const statusData = await statusRes.json()
      setStatus(statusData)

    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden der Daten')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const triggerSync = async () => {
    try {
      setSyncing(true)
      const res = await fetch('/api/forderungen/sync', {
        method: 'POST',
      })
      
      if (!res.ok) throw new Error('Sync fehlgeschlagen')
      
      const data = await res.json()
      alert(`Sync erfolgreich! ${data.data.invoices} Rechnungen synchronisiert`)
      
      await loadData()
    } catch (err: any) {
      alert('Fehler beim Synchronisieren: ' + err.message)
    } finally {
      setSyncing(false)
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
      month: '2-digit',
      year: 'numeric',
    })
  }

  const filteredReceivables = receivables.filter(receivable => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      receivable.invoice_id.toLowerCase().includes(query) ||
      receivable.customer.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          <p className="mt-4 text-gray-600">Lade Forderungen...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900">Fehler beim Laden</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <button
                onClick={loadData}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Forderungsmanagement</h1>
          <p className="mt-0.5 text-sm text-gray-600">Übersicht über alle Forderungen aus SevDesk & Reonic</p>
        </div>
        <button
          onClick={triggerSync}
          disabled={syncing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Synchronisiere...' : 'Synchronisieren'}
        </button>
      </div>

      {/* Stats Cards */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Gesamt Forderungen</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{status.total_invoices}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Offene Forderungen</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{status.open_invoices}</p>
                <p className="text-xs text-gray-500 mt-1.5">{formatCurrency(status.total_open_amount)}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Überfällig</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{status.overdue_invoices}</p>
                <p className="text-xs text-gray-500 mt-1.5">{formatCurrency(status.total_overdue_amount)}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Bezahlt</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{status.paid_invoices}</p>
                <p className="text-xs text-gray-500 mt-1.5">Erfolgreich eingegangen</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Table Header with Filters */}
        <div className="px-5 py-3 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Forderungen</h3>
              <p className="text-xs text-gray-600 mt-0.5">{filteredReceivables.length} von {receivables.length} Forderungen</p>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent w-full sm:w-56 text-sm"
                />
              </div>

              {/* Export Button */}
              <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-2 mt-3">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs font-medium text-gray-700">Filter:</span>
            {[
              { value: 'all', label: 'Alle', color: 'bg-gray-900 text-white' },
              { value: 'open', label: 'Offen', color: 'bg-amber-500 text-white' },
              { value: 'overdue', label: 'Überfällig', color: 'bg-red-500 text-white' },
              { value: 'paid', label: 'Bezahlt', color: 'bg-emerald-500 text-white' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value as any)}
                className={`px-3 py-1 rounded-lg font-medium transition-colors text-xs ${
                  statusFilter === filter.value
                    ? filter.color
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {filteredReceivables.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Forderungen gefunden</h3>
            <p className="text-gray-600">
              {searchQuery ? 'Versuche eine andere Suche' : statusFilter !== 'all' ? 'Versuche einen anderen Filter' : 'Synchronisiere Daten von SevDesk & Reonic'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Rechnungsnummer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Kunde
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Betrag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Fällig am
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Mahnstufe
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredReceivables.map((receivable, index) => (
                  <tr 
                    key={receivable.invoice_id}
                    onClick={() => router.push(`/dashboard/forderungen/${receivable.invoice_id}`)}
                    className="hover:bg-amber-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{receivable.invoice_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{receivable.customer}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-gray-900">{formatCurrency(receivable.amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(receivable.due_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={receivable.status} size="sm" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {receivable.reminder_level > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                          {receivable.reminder_level}. Mahnung
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // Add action menu logic here
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Summary */}
        {filteredReceivables.length > 0 && status && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Gesamt: <span className="font-semibold text-gray-900">{filteredReceivables.length} Forderungen</span>
              </span>
              <span className="text-gray-600">
                Offener Betrag: <span className="font-bold text-amber-600">{formatCurrency(status.total_open_amount + status.total_overdue_amount)}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
