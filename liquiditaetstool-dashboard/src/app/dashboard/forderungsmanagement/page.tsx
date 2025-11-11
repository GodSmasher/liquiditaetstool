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
  status: 'paid' | 'open' | 'overdue' | 'pending'
  reminder_level: number
  source?: string
  id?: string
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'overdue' | 'paid' | 'pending'>('all')
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
      
      const data = await res.json()
      
      if (!res.ok) {
        // Zeige spezifische Fehlermeldung vom Backend
        const errorMsg = data.message || data.error || 'Sync fehlgeschlagen'
        const details = data.details ? `\n\nDetails: ${data.details}` : ''
        alert(`Fehler: ${errorMsg}${details}`)
        return
      }
      
      // Erfolgreiche Synchronisation
      const invoiceCount = data.data?.invoices || 0
      const paymentCount = data.data?.payments || 0
      alert(`Synchronisation erfolgreich!\n\n${invoiceCount} Rechnungen synchronisiert\n${paymentCount} Zahlungen synchronisiert`)
      
      // Reload data
      await loadData()
    } catch (err: any) {
      alert('Fehler beim Synchronisieren: ' + err.message)
      console.error('Sync error:', err)
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

      {/* Stats Cards - CLEAN DESIGN */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Gesamt */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Gesamt</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{status.total_invoices}</p>
              </div>
            </div>
          </div>

          {/* Offen */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Offen</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{status.open_invoices}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 tabular-nums">{formatCurrency(status.total_open_amount)}</p>
          </div>

          {/* Überfällig */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Überfällig</p>
                <p className="text-2xl font-bold text-red-600 tabular-nums">{status.overdue_invoices}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 tabular-nums">{formatCurrency(status.total_overdue_amount)}</p>
          </div>

          {/* Bezahlt */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Bezahlt</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{status.paid_invoices}</p>
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
              { value: 'pending', label: 'Ausstehend', color: 'bg-gray-500 text-white' },
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
                      <div className="text-sm text-gray-900 truncate max-w-[200px]">{receivable.customer}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-gray-900 tabular-nums">{formatCurrency(receivable.amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 tabular-nums">{formatDate(receivable.due_date)}</div>
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
