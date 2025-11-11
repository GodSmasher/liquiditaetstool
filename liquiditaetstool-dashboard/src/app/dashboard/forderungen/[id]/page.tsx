'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface TimelineEvent {
  status: string
  date: string
  label: string
}

interface InvoiceDetails {
  id: string
  invoice_number: string
  customer_name: string
  customer_address: string
  amount: number
  due_date: string
  created_at: string
  status: 'paid' | 'open' | 'overdue'
  reminder_level: number
  source: string
  invoice_items: InvoiceItem[]
  timeline: TimelineEvent[]
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string

  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadInvoice()
  }, [invoiceId])

  const loadInvoice = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/forderungen/${invoiceId}`)
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Rechnung nicht gefunden')
        }
        throw new Error('Fehler beim Laden der Rechnung')
      }

      const data = await res.json()
      setInvoice(data)
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden der Daten')
      console.error('Error loading invoice:', err)
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
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      paid: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ),
        label: 'Bezahlt',
      },
      open: {
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        ),
        label: 'Offen',
      },
      overdue: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ),
        label: 'Überfällig',
      },
    }

    const badge = badges[status as keyof typeof badges] || badges.open

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>
        {badge.icon}
        {badge.label}
      </span>
    )
  }

  const handleMarkAsPaid = async () => {
    if (!confirm('Möchten Sie diese Rechnung wirklich als bezahlt markieren?')) {
      return
    }

    try {
      setActionLoading('paid')
      const res = await fetch(`/api/forderungen/${invoiceId}/mark-paid`, {
        method: 'POST'
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Markieren als bezahlt')
      }

      alert('Rechnung wurde als bezahlt markiert!')
      await loadInvoice() // Reload invoice data
    } catch (err: any) {
      alert('Fehler: ' + err.message)
      console.error('Error marking as paid:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendReminder = async () => {
    if (!confirm('Möchten Sie eine Zahlungserinnerung senden?')) {
      return
    }

    try {
      setActionLoading('reminder')
      const res = await fetch(`/api/forderungen/${invoiceId}/send-reminder`, {
        method: 'POST'
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Senden der Mahnung')
      }

      alert(data.message)
      await loadInvoice() // Reload invoice data
    } catch (err: any) {
      alert('Fehler: ' + err.message)
      console.error('Error sending reminder:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      setActionLoading('pdf')
      const res = await fetch(`/api/forderungen/${invoiceId}/generate-pdf`)

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Fehler beim Generieren der PDF')
      }

      // Create blob from response
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      
      // Create download link
      const a = document.createElement('a')
      a.href = url
      a.download = `Rechnung-${invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      alert('PDF wurde heruntergeladen!')
    } catch (err: any) {
      alert('Fehler: ' + err.message)
      console.error('Error downloading PDF:', err)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          <p className="mt-4 text-gray-600">Lade Rechnungsdetails...</p>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/forderungsmanagement"
          className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Zurück zur Übersicht
        </Link>

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
                onClick={loadInvoice}
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
      {/* Back Button */}
      <Link
        href="/dashboard/forderungsmanagement"
        className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Zurück zur Übersicht
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                Rechnung {invoice.invoice_number}
              </h1>
              {getStatusBadge(invoice.status)}
            </div>
            <p className="text-gray-600 text-sm">
              Quelle: <span className="font-semibold">{invoice.source === 'sevdesk' ? 'SevDesk' : 'Reonic'}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-gray-900">{formatCurrency(invoice.amount)}</p>
            <p className="text-sm text-gray-600 mt-1">Gesamtbetrag</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Kundeninformationen
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-lg font-semibold text-gray-900">{invoice.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Adresse</p>
                <p className="text-gray-900">{invoice.customer_address}</p>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Rechnungspositionen
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-amber-500 uppercase tracking-wider">
                      Beschreibung
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-amber-500 uppercase tracking-wider">
                      Menge
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-amber-500 uppercase tracking-wider">
                      Einzelpreis
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-amber-500 uppercase tracking-wider">
                      Gesamt
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoice.invoice_items.map((item, index) => (
                    <tr key={index} className="hover:bg-amber-50 transition-colors">
                      <td className="px-6 py-4 text-gray-900">{item.description}</td>
                      <td className="px-6 py-4 text-right text-gray-900">{item.quantity}</td>
                      <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(item.unit_price)}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-right font-bold text-gray-900">
                      Gesamtbetrag:
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-2xl text-amber-600">
                      {formatCurrency(invoice.amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Status-Verlauf
            </h2>
            <div className="relative">
              {invoice.timeline.map((event, index) => (
                <div key={index} className="flex gap-4 pb-8 last:pb-0">
                  {/* Timeline Line */}
                  {index < invoice.timeline.length - 1 && (
                    <div className="absolute left-[15px] top-[32px] bottom-0 w-0.5 bg-gray-300" style={{ height: 'calc(100% - 32px)' }}></div>
                  )}
                  
                  {/* Timeline Dot */}
                  <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    event.status === 'paid' ? 'bg-green-500' :
                    event.status.includes('reminder') ? 'bg-red-500' :
                    'bg-amber-500'
                  }`}>
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  
                  {/* Event Details */}
                  <div className="flex-1 pt-1">
                    <p className="font-semibold text-gray-900">{event.label}</p>
                    <p className="text-sm text-gray-600 mt-1">{formatDateTime(event.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Actions & Payment Info */}
        <div className="space-y-6">
          {/* Payment Details */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Zahlungsdetails
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Erstellt am</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(invoice.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fällig am</p>
                <p className={`text-lg font-semibold ${
                  invoice.status === 'overdue' ? 'text-red-600' : 
                  invoice.status === 'paid' ? 'text-green-600' : 
                  'text-amber-600'
                }`}>
                  {formatDate(invoice.due_date)}
                </p>
              </div>
              {invoice.reminder_level > 0 && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">Mahnstufe</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700 mt-1">
                    {invoice.reminder_level}. Mahnung
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Aktionen</h2>
            <div className="space-y-3">
              {invoice.status !== 'paid' && (
                <button
                  onClick={handleMarkAsPaid}
                  disabled={actionLoading === 'paid'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === 'paid' ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Wird bearbeitet...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Als bezahlt markieren
                    </>
                  )}
                </button>
              )}

              {invoice.status !== 'paid' && (
                <button
                  onClick={handleSendReminder}
                  disabled={actionLoading === 'reminder'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-400 transition-all shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === 'reminder' ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                      Wird versendet...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Zahlungserinnerung senden
                    </>
                  )}
                </button>
              )}

              <button
                onClick={handleDownloadPDF}
                disabled={actionLoading === 'pdf'}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-amber-500 rounded-lg hover:bg-gray-800 transition-all shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === 'pdf' ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500"></div>
                    Wird heruntergeladen...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF herunterladen
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

