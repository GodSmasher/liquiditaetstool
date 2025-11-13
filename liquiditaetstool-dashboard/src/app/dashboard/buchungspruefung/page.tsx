'use client'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { useState, useEffect } from 'react'
import { 
  LinkIcon, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  FileText,
  Filter,
  Download,
  RefreshCw,
  StickyNote,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import type { PaymentMatchesResponse, PaymentMatchWithInvoices } from '@/lib/types/payment-match'

type ConfidenceFilter = 'all' | 'high' | 'low'
type StatusFilter = 'pending' | 'matched' | 'ignored'

export default function BuchungspruefungPage() {
  const [data, setData] = useState<PaymentMatchesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [noteModal, setNoteModal] = useState<{ matchId: string; currentNote?: string } | null>(null)
  const [note, setNote] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/buchungspruefung')
      if (!res.ok) throw new Error('Fehler beim Laden der Daten')
      const responseData = await res.json()
      setData(responseData)
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden der Daten')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMatch = async (
    matchId: string, 
    status?: 'matched' | 'ignored' | 'pending', 
    invoiceId?: string,
    notes?: string
  ) => {
    try {
      const res = await fetch('/api/buchungspruefung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, status, invoiceId, notes })
      })

      if (!res.ok) throw new Error('Fehler beim Aktualisieren')
      
      // Reload data
      await loadData()
      
      // Show success message
      if (status === 'matched') {
        alert('Zahlung als verknüpft markiert. Bitte in SevDesk final verknüpfen.')
      } else if (status === 'ignored') {
        alert('Zahlung wurde ignoriert.')
      } else if (!status && notes !== undefined) {
        alert('Notiz wurde gespeichert.')
      }
    } catch (err: any) {
      alert('Fehler: ' + err.message)
      console.error('Error updating match:', err)
    }
  }

  const openNoteModal = (matchId: string, currentNote?: string) => {
    setNoteModal({ matchId, currentNote: currentNote || '' })
    setNote(currentNote || '')
  }

  const saveNote = async () => {
    if (!noteModal) return
    
    await handleUpdateMatch(noteModal.matchId, undefined, undefined, note)
    setNoteModal(null)
    setNote('')
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

  const getConfidenceBadge = (score: number | null | undefined) => {
    if (!score) return null
    
    if (score >= 95) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          {score}% - Sicher
        </span>
      )
    } else if (score >= 70) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          {score}% - Mittel
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
          {score}% - Unsicher
        </span>
      )
    }
  }

  const toggleCardExpand = (matchId: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(matchId)) {
      newExpanded.delete(matchId)
    } else {
      newExpanded.add(matchId)
    }
    setExpandedCards(newExpanded)
  }

  const exportToCSV = () => {
    if (!data) return

    const matches = data.pending
    const csvRows = [
      ['Zahlungsdatum', 'Betrag', 'Verwendungszweck', 'Rechnungsnummer', 'Konfidenz'].join(';')
    ]

    matches.forEach(match => {
      const row = [
        formatDate(match.payment_date),
        match.payment_amount.toString().replace('.', ','),
        match.payment_reference || '',
        match.suggested_invoice?.invoice_number || '',
        match.confidence_score?.toString() || ''
      ].join(';')
      csvRows.push(row)
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `buchungspruefung_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Filter matches
  const getFilteredMatches = () => {
    if (!data) return []
    
    let matches: PaymentMatchWithInvoices[] = []
    if (statusFilter === 'pending') matches = data.pending
    else if (statusFilter === 'matched') matches = data.matched
    else if (statusFilter === 'ignored') matches = data.ignored

    if (confidenceFilter === 'all') return matches
    
    return matches.filter(match => {
      const score = match.confidence_score || 0
      if (confidenceFilter === 'high') return score >= 95
      if (confidenceFilter === 'low') return score < 95
      return true
    })
  }

  const filteredMatches = getFilteredMatches()

  // Group by confidence for pending
  const highConfidenceMatches = filteredMatches.filter(m => (m.confidence_score || 0) >= 95)
  const lowConfidenceMatches = filteredMatches.filter(m => (m.confidence_score || 0) < 95)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          <p className="mt-4 text-gray-600">Lade Buchungsprüfung...</p>
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
          <h1 className="text-2xl font-semibold text-gray-900">Buchungsprüfung</h1>
          <p className="mt-0.5 text-sm text-gray-600">
            Zahlungen mit Rechnungen abgleichen - Read-Only für SevDesk
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`bg-white rounded-xl shadow-sm border p-6 text-left transition-all ${
              statusFilter === 'pending' ? 'border-amber-500 ring-2 ring-amber-500' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Offen</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{data.counts.pending}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('matched')}
            className={`bg-white rounded-xl shadow-sm border p-6 text-left transition-all ${
              statusFilter === 'matched' ? 'border-emerald-500 ring-2 ring-emerald-500' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Verknüpft</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{data.counts.matched}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setStatusFilter('ignored')}
            className={`bg-white rounded-xl shadow-sm border p-6 text-left transition-all ${
              statusFilter === 'ignored' ? 'border-gray-500 ring-2 ring-gray-500' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ignoriert</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{data.counts.ignored}</p>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Filters */}
      {statusFilter === 'pending' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter nach Konfidenz:</span>
            {[
              { value: 'all', label: 'Alle anzeigen' },
              { value: 'high', label: 'Nur Sichere (95%+)' },
              { value: 'low', label: 'Nur Unsichere (< 95%)' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setConfidenceFilter(filter.value as ConfidenceFilter)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors text-sm ${
                  confidenceFilter === filter.value
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Payment Matches */}
      <div className="space-y-4">
        {/* High Confidence Section */}
        {statusFilter === 'pending' && highConfidenceMatches.length > 0 && (confidenceFilter === 'all' || confidenceFilter === 'high') && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Sichere Zuordnungen (95%+)
            </h2>
            <div className="space-y-3">
              {highConfidenceMatches.map((match) => (
                <PaymentMatchCard
                  key={match.id}
                  match={match}
                  onUpdate={handleUpdateMatch}
                  onAddNote={openNoteModal}
                  expanded={expandedCards.has(match.id)}
                  onToggleExpand={toggleCardExpand}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  getConfidenceBadge={getConfidenceBadge}
                />
              ))}
            </div>
          </div>
        )}

        {/* Low Confidence Section */}
        {statusFilter === 'pending' && lowConfidenceMatches.length > 0 && (confidenceFilter === 'all' || confidenceFilter === 'low') && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Unsichere Zuordnungen (&lt; 95%)
            </h2>
            <div className="space-y-3">
              {lowConfidenceMatches.map((match) => (
                <PaymentMatchCard
                  key={match.id}
                  match={match}
                  onUpdate={handleUpdateMatch}
                  onAddNote={openNoteModal}
                  expanded={expandedCards.has(match.id)}
                  onToggleExpand={toggleCardExpand}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  getConfidenceBadge={getConfidenceBadge}
                />
              ))}
            </div>
          </div>
        )}

        {/* Matched/Ignored List */}
        {(statusFilter === 'matched' || statusFilter === 'ignored') && (
          <div className="space-y-3">
            {filteredMatches.map((match) => (
              <PaymentMatchCard
                key={match.id}
                match={match}
                onUpdate={handleUpdateMatch}
                onAddNote={openNoteModal}
                expanded={expandedCards.has(match.id)}
                onToggleExpand={toggleCardExpand}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                getConfidenceBadge={getConfidenceBadge}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredMatches.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Zahlungen gefunden</h3>
            <p className="text-gray-600">
              {statusFilter === 'pending' 
                ? 'Alle Zahlungen wurden bereits zugeordnet.' 
                : statusFilter === 'matched'
                ? 'Noch keine Zahlungen verknüpft.'
                : 'Noch keine Zahlungen ignoriert.'}
            </p>
          </div>
        )}
      </div>

      {/* Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notiz hinzufügen</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              rows={4}
              placeholder="Notiz eingeben..."
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={saveNote}
                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
              >
                Speichern
              </button>
              <button
                onClick={() => {
                  setNoteModal(null)
                  setNote('')
                }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Payment Match Card Component
interface PaymentMatchCardProps {
  match: PaymentMatchWithInvoices
  onUpdate: (matchId: string, status: 'matched' | 'ignored', invoiceId?: string, notes?: string) => void
  onAddNote: (matchId: string, currentNote?: string) => void
  expanded: boolean
  onToggleExpand: (matchId: string) => void
  formatCurrency: (amount: number) => string
  formatDate: (date: string) => string
  getConfidenceBadge: (score: number | null | undefined) => JSX.Element | null
}

function PaymentMatchCard({
  match,
  onUpdate,
  onAddNote,
  expanded,
  onToggleExpand,
  formatCurrency,
  formatDate,
  getConfidenceBadge
}: PaymentMatchCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(match.payment_amount)}
              </span>
              <span className="text-sm text-gray-500">
                am {formatDate(match.payment_date)}
              </span>
            </div>
            {match.payment_reference && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Verwendungszweck:</span> {match.payment_reference}
              </p>
            )}
            {match.payment_account && (
              <p className="text-xs text-gray-500 mt-1">
                Konto: {match.payment_account}
              </p>
            )}
          </div>
          <button
            onClick={() => onToggleExpand(match.id)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* Suggested Match */}
        {match.suggested_invoice && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <LinkIcon className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold text-gray-900">
                    {match.suggested_invoice.invoice_number}
                  </span>
                  {getConfidenceBadge(match.confidence_score)}
                </div>
                <p className="text-sm text-gray-600">
                  {match.suggested_invoice.customer_name}
                </p>
                <p className="text-sm text-gray-600">
                  Betrag: {formatCurrency(match.suggested_invoice.amount)} | 
                  Fällig: {formatDate(match.suggested_invoice.due_date)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Matched Invoice (for matched status) */}
        {match.status === 'matched' && match.matched_invoice && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-gray-900">
                Verknüpft mit {match.matched_invoice.invoice_number}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {match.matched_invoice.customer_name}
            </p>
            {match.matched_by && (
              <p className="text-xs text-gray-500 mt-1">
                Von {match.matched_by} am {match.matched_at && formatDate(match.matched_at)}
              </p>
            )}
          </div>
        )}

        {/* Notes */}
        {match.notes && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
            <div className="flex items-start gap-2">
              <StickyNote className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">{match.notes}</p>
            </div>
          </div>
        )}

        {/* Expanded Details */}
        {expanded && (
          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Payment ID:</span>
                <span className="ml-2 text-gray-900 font-mono text-xs">{match.payment_id}</span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="ml-2 text-gray-900">{match.status}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {match.status === 'pending' && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onUpdate(match.id, 'matched', match.suggested_invoice?.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
            >
              <CheckCircle2 className="w-4 h-4" />
              Verknüpft
            </button>
            <button
              onClick={() => onUpdate(match.id, 'ignored')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              <XCircle className="w-4 h-4" />
              Ignorieren
            </button>
            <button
              onClick={() => onAddNote(match.id, match.notes || undefined)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              <StickyNote className="w-4 h-4" />
              Notiz
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

