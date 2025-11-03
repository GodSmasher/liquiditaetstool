'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Invoice {
  id: string
  invoice_number: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  due_date: string
  customer_name: string
  created_at: string
}

type SortField = 'invoice_number' | 'customer_name' | 'amount' | 'status' | 'due_date' | 'created_at'
type SortDirection = 'asc' | 'desc'

export default function RechnungenPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter & Sort States
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  
  const supabase = createClient()

  useEffect(() => {
    loadInvoices()
  }, [])

  useEffect(() => {
    filterAndSortInvoices()
  }, [invoices, statusFilter, searchTerm, sortField, sortDirection])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })

      if (invoicesError) {
        if (invoicesError.code === '42P01') {
          setError('Die Rechnungen-Tabelle existiert noch nicht. Bitte richte sie in Supabase ein.')
        } else {
          throw invoicesError
        }
        return
      }

      setInvoices(data || [])
    } catch (err: any) {
      console.error('Error loading invoices:', err)
      setError(err.message || 'Fehler beim Laden der Rechnungen')
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortInvoices = () => {
    let result = [...invoices]

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(inv => inv.status === statusFilter)
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        inv =>
          inv.invoice_number.toLowerCase().includes(term) ||
          inv.customer_name.toLowerCase().includes(term)
      )
    }

    // Sort
    result.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      // Handle numeric sorting for amount
      if (sortField === 'amount') {
        return sortDirection === 'asc' 
          ? (a.amount - b.amount) 
          : (b.amount - a.amount)
      }

      // Handle string sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return 0
    })

    setFilteredInvoices(result)
    setCurrentPage(1) // Reset to first page on filter change
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const exportToCSV = () => {
    const headers = ['Rechnungsnummer', 'Kunde', 'Betrag', 'Status', 'Fälligkeitsdatum', 'Erstellt']
    const csvData = filteredInvoices.map(inv => [
      inv.invoice_number,
      inv.customer_name,
      inv.amount.toString(),
      inv.status,
      formatDate(inv.due_date),
      formatDate(inv.created_at),
    ])

    const csv = [
      headers.join(';'),
      ...csvData.map(row => row.join(';'))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `rechnungen_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
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

  const getStatusBadge = (status: string) => {
    const badges = {
      paid: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: '✓',
        label: 'Bezahlt',
      },
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: '⏱',
        label: 'Ausstehend',
      },
      overdue: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: '⚠',
        label: 'Überfällig',
      },
    }

    const badge = badges[status as keyof typeof badges] || badges.pending

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        <span>{badge.icon}</span>
        {badge.label}
      </span>
    )
  }

  // Calculate stats
  const stats = {
    total: filteredInvoices.length,
    totalAmount: filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0),
    pendingAmount: filteredInvoices
      .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.amount, 0),
    averageAmount: filteredInvoices.length > 0
      ? filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0) / filteredInvoices.length
      : 0,
  }

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex)

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-gray-400">⇅</span>
    }
    return <span className="text-indigo-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Lade Rechnungen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rechnungsübersicht</h1>
          <p className="mt-2 text-gray-600">Verwalte und überwache alle deine Rechnungen</p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={filteredInvoices.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          CSV Export
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <p className="text-sm font-medium text-gray-600">Gesamt Rechnungen</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <p className="text-sm font-medium text-gray-600">Gesamtbetrag</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(stats.totalAmount)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <p className="text-sm font-medium text-gray-600">Offene Beträge</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{formatCurrency(stats.pendingAmount)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <p className="text-sm font-medium text-gray-600">Durchschnitt</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{formatCurrency(stats.averageAmount)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suche
            </label>
            <input
              type="text"
              placeholder="Rechnungsnummer oder Kunde..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">Alle Status</option>
              <option value="paid">Bezahlt</option>
              <option value="pending">Ausstehend</option>
              <option value="overdue">Überfällig</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{filteredInvoices.length}</span> {filteredInvoices.length === 1 ? 'Rechnung' : 'Rechnungen'} gefunden
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 border border-gray-100 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Rechnungen gefunden</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' 
              ? 'Versuche, deine Filter anzupassen.' 
              : 'Es wurden noch keine Rechnungen erstellt.'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th 
                      onClick={() => handleSort('invoice_number')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        Rechnungsnr.
                        <SortIcon field="invoice_number" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('customer_name')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        Kunde
                        <SortIcon field="customer_name" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('amount')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        Betrag
                        <SortIcon field="amount" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('status')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        Status
                        <SortIcon field="status" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('due_date')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        Fällig am
                        <SortIcon field="due_date" />
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('created_at')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        Erstellt
                        <SortIcon field="created_at" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{invoice.invoice_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{invoice.customer_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(invoice.amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(invoice.due_date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(invoice.created_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-indigo-600 hover:text-indigo-900 font-medium">
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {paginatedInvoices.map((invoice) => (
                <div key={invoice.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{invoice.invoice_number}</p>
                      <p className="text-sm text-gray-600">{invoice.customer_name}</p>
                    </div>
                    {getStatusBadge(invoice.status)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Betrag:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(invoice.amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Fällig:</span>
                      <span className="text-gray-900">{formatDate(invoice.due_date)}</span>
                    </div>
                    <button className="w-full mt-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100">
                      Details anzeigen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-xl shadow-md p-4 border border-gray-100">
              <div className="text-sm text-gray-600">
                Seite {currentPage} von {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Zurück
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Weiter
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

