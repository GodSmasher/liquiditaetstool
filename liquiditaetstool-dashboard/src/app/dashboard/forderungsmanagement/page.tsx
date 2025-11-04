'use client'

import { useState, useEffect } from 'react'

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
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [status, setStatus] = useState<ReceivablesStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'overdue' | 'paid'>('all')
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Forderungen laden - jetzt von lokaler API
      const receivablesUrl = statusFilter === 'all' 
        ? '/api/forderungen'
        : `/api/forderungen?status=${statusFilter}`
      
      const receivablesRes = await fetch(receivablesUrl)
      if (!receivablesRes.ok) throw new Error('Fehler beim Laden der Forderungen')
      const receivablesData = await receivablesRes.json()
      setReceivables(receivablesData)

      // Status laden - jetzt von lokaler API
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
      
      // Daten neu laden
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

  const getStatusBadge = (status: string) => {
    const badges = {
      paid: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ),
        label: 'Bezahlt',
      },
      open: {
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        icon: (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        ),
        label: 'Offen',
      },
      overdue: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ),
        label: 'Überfällig',
      },
    }

    const badge = badges[status as keyof typeof badges] || badges.open

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.icon}
        {badge.label}
      </span>
    )
  }

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
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-red-800">Fehler beim Laden</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <button
                onClick={loadData}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Forderungsmanagement</h1>
          <p className="mt-2 text-gray-600">Übersicht über offene und überfällige Forderungen aus SevDesk & Reonic</p>
        </div>
        <button
          onClick={triggerSync}
          disabled={syncing}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-400 transition-all shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? (
            <>
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
              Synchronisiere...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Jetzt synchronisieren
            </>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gesamt Forderungen</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{status.total_invoices}</p>
              </div>
              <div className="bg-amber-100 rounded-full p-3">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Alle Rechnungen</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Offene Forderungen</p>
                <p className="text-3xl font-bold text-amber-600 mt-2">{status.open_invoices}</p>
              </div>
              <div className="bg-amber-100 rounded-full p-3">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">{formatCurrency(status.total_open_amount)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-xl hover:shadow-red-500/20 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Überfällig</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{status.overdue_invoices}</p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">{formatCurrency(status.total_overdue_amount)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bezahlt</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{status.paid_invoices}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Erfolgreich eingegangen</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'Alle', color: 'bg-gray-900 text-amber-500' },
              { value: 'open', label: 'Offen', color: 'bg-amber-500 text-gray-900' },
              { value: 'overdue', label: 'Überfällig', color: 'bg-red-500 text-white' },
              { value: 'paid', label: 'Bezahlt', color: 'bg-green-500 text-white' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  statusFilter === filter.value
                    ? filter.color + ' shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Forderungen-Tabelle */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Forderungen</h3>
          <p className="text-sm text-gray-600 mt-1">{receivables.length} Forderungen gefunden</p>
        </div>

        {receivables.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Forderungen gefunden</h3>
            <p className="text-gray-600">
              {statusFilter !== 'all' ? 'Versuche einen anderen Filter' : 'Synchronisiere Daten von SevDesk & Reonic'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-amber-500 uppercase tracking-wider">
                    Rechnungsnummer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-amber-500 uppercase tracking-wider">
                    Kunde
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-amber-500 uppercase tracking-wider">
                    Betrag
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-amber-500 uppercase tracking-wider">
                    Fällig am
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-amber-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-amber-500 uppercase tracking-wider">
                    Mahnstufe
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {receivables.map((receivable, index) => (
                  <tr 
                    key={receivable.invoice_id}
                    className={`hover:bg-amber-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
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
                      {getStatusBadge(receivable.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {receivable.reminder_level > 0 ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          {receivable.reminder_level}. Mahnung
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

