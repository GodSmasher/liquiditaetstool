'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle, 
  TrendingUp, 
  List, 
  Search, 
  Calendar, 
  Download,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/invoice-helpers'

interface Transaction {
  id: string
  invoice_number: string
  customer_name: string
  customer_address: string | null
  amount: number
  created_at: string
  invoice_date: string
  source: string
  external_id: string
}

interface TransactionSummary {
  total: number
  thisMonth: number
  count: number
  thisMonthCount: number
}

interface TransactionResponse {
  transactions: Transaction[]
  summary: TransactionSummary
}

export default function TransaktionenPage() {
  const router = useRouter()
  const [data, setData] = useState<TransactionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [activeFilters, setActiveFilters] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo) params.append('dateTo', dateTo)
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/transaktionen?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Transaktionen')
      }
      
      const result: TransactionResponse = await response.json()
      setData(result)
      setCurrentPage(1) // Reset to first page on new data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleApplyFilters = () => {
    setActiveFilters(true)
    fetchTransactions()
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setDateFrom('')
    setDateTo('')
    setActiveFilters(false)
    fetchTransactions()
  }

  const handleExportCSV = () => {
    if (!data || data.transactions.length === 0) return

    const headers = ['Datum', 'Kunde', 'Rechnungsnummer', 'Betrag']
    const rows = data.transactions.map(t => [
      formatDate(t.created_at),
      t.customer_name.replace(/;/g, ','), // Escape semicolons
      t.invoice_number,
      Number(t.amount).toFixed(2).replace('.', ',')
    ])

    const csv = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Transaktionen_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleRowClick = (id: string) => {
    router.push(`/dashboard/forderungen/${id}`)
  }

  // Pagination logic
  const totalPages = data ? Math.ceil(data.transactions.length / itemsPerPage) : 0
  const paginatedTransactions = data
    ? data.transactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : []

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transaktionen</h1>
            <p className="text-gray-600 mt-1">Übersicht aller bezahlten Rechnungen</p>
          </div>
        </div>

        {/* KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-8 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-900 font-medium">Fehler beim Laden der Daten</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={fetchTransactions}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Erneut versuchen
            </button>
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gesamt bezahlt</p>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">
                    {formatCurrency(data.summary.total)}
                  </p>
                </div>
              </div>
            </div>

            {/* This Month */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Diesen Monat</p>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">
                    {formatCurrency(data.summary.thisMonth)}
                  </p>
                </div>
              </div>
            </div>

            {/* Count */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center">
                  <List className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Anzahl Transaktionen</p>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">
                    {data.summary.count}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suche
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Kunde oder Rechnungsnummer..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                />
              </div>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Von
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bis
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleApplyFilters}
              disabled={loading}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Filter anwenden
            </button>
            {activeFilters && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Filter zurücksetzen
              </button>
            )}
            <button
              onClick={handleExportCSV}
              disabled={!data || data.transactions.length === 0}
              className="ml-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              CSV Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded flex-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? null : data && data.transactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <List className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Keine Transaktionen gefunden
              </h3>
              <p className="text-gray-600">
                {activeFilters
                  ? 'Versuchen Sie andere Filterkriterien'
                  : 'Es sind noch keine bezahlten Rechnungen vorhanden'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Datum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Kunde
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Rechnungsnummer
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Betrag
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Quelle
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedTransactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        onClick={() => handleRowClick(transaction.id)}
                        className="hover:bg-amber-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatDate(transaction.created_at)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-[200px] truncate" title={transaction.customer_name}>
                            {transaction.customer_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {transaction.invoice_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900 tabular-nums">
                          {formatCurrency(Number(transaction.amount))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {transaction.source}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Seite {currentPage} von {totalPages} ({data?.summary.count} Transaktionen gesamt)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      Zurück
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      Weiter
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

