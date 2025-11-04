'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import CashflowChart from '@/components/CashflowChart'

interface Invoice {
  id: string
  invoice_number: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  due_date: string
  customer_name: string
  created_at: string
}

interface DashboardStats {
  totalInvoices: number
  pendingInvoices: number
  totalRevenue: number
  pendingAmount: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    pendingInvoices: 0,
    totalRevenue: 0,
    pendingAmount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Lade alle Rechnungen aus Supabase
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })

      if (invoicesError) {
        // Wenn Tabelle noch nicht existiert, zeige freundliche Nachricht
        if (invoicesError.code === '42P01') {
          setError('Die Rechnungen-Tabelle existiert noch nicht. Bitte richte sie in Supabase ein.')
        } else {
          throw invoicesError
        }
        return
      }

      if (invoices) {
        // Berechne Statistiken
        const totalInvoices = invoices.length
        const pendingInvoices = invoices.filter((inv: Invoice) => inv.status === 'pending' || inv.status === 'overdue').length
        const totalRevenue = invoices
          .filter((inv: Invoice) => inv.status === 'paid')
          .reduce((sum: number, inv: Invoice) => sum + (inv.amount || 0), 0)
        const pendingAmount = invoices
          .filter((inv: Invoice) => inv.status === 'pending' || inv.status === 'overdue')
          .reduce((sum: number, inv: Invoice) => sum + (inv.amount || 0), 0)

        setStats({
          totalInvoices,
          pendingInvoices,
          totalRevenue,
          pendingAmount,
        })
      }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          <p className="mt-4 text-gray-600">Lade Dashboard-Daten...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Willkommensnachricht */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-2 text-gray-600">
          Übersicht über deine Liquidität und Rechnungen
        </p>
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
              <p className="text-xs text-yellow-600 mt-1">
                Erstelle die Tabelle 'invoices' in deiner Supabase-Datenbank oder synchronisiere Daten über n8n.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Gesamt Rechnungen */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamt Rechnungen</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalInvoices}</p>
            </div>
            <div className="bg-amber-100 rounded-full p-3">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Alle Rechnungen</p>
        </div>

        {/* Offene Rechnungen */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Offene Rechnungen</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{stats.pendingInvoices}</p>
            </div>
            <div className="bg-amber-100 rounded-full p-3">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Ausstehend / Überfällig</p>
        </div>

        {/* Gesamtumsatz */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamtumsatz</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="bg-amber-100 rounded-full p-3">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Bezahlte Rechnungen</p>
        </div>

        {/* Ausstehend */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ausstehend</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{formatCurrency(stats.pendingAmount)}</p>
            </div>
            <div className="bg-amber-100 rounded-full p-3">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Noch nicht bezahlt</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Schnellzugriff</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Rechnungen - Link */}
          <a 
            href="/dashboard/rechnungen" 
            className="flex items-center space-x-3 p-4 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-400 transition-all shadow-md font-medium"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium">Rechnungen</span>
          </a>

          {/* Cashflow - Link zur Detailseite */}
          <a 
            href="/dashboard/cashflow"
            className="flex items-center space-x-3 p-4 bg-gray-900 text-amber-500 rounded-lg hover:bg-gray-800 transition-all shadow-md"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="font-medium">Cashflow</span>
          </a>

          {/* Neue Rechnung - Aktiv */}
          <a
            href="/dashboard/neue-rechnung"
            className="flex items-center space-x-3 p-4 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-400 transition-all shadow-md font-medium"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="font-medium">Neue Rechnung</span>
          </a>

          {/* Forderungsmanagement - NEU */}
          <a
            href="/dashboard/forderungsmanagement"
            className="flex items-center space-x-3 p-4 bg-gradient-to-r from-amber-500 to-amber-600 text-gray-900 rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all shadow-md font-medium"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Forderungen</span>
          </a>

          {/* Berichte - Aktiv */}
          <a
            href="/dashboard/berichte"
            className="flex items-center space-x-3 p-4 bg-gray-900 text-amber-500 rounded-lg hover:bg-gray-800 transition-all shadow-md"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium">Berichte</span>
          </a>
        </div>
      </div>

      {/* HIER KOMMT DER ECHTE CASHFLOW CHART */}
      <div id="cashflow-chart">
        <CashflowChart />
      </div>

      {/* n8n Integration Info */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-6 border-2 border-amber-200">
        <div className="flex items-start space-x-4">
          <div className="bg-amber-100 rounded-full p-3 flex-shrink-0">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              n8n Workflow Synchronisation
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Deine Rechnungen werden automatisch über n8n synchronisiert. Der Workflow läuft auf{' '}
              <a href="http://localhost:5678" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 font-medium underline">
                http://localhost:5678
              </a>
            </p>
            <div className="flex items-center space-x-2 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-gray-700">Status: Aktiv</span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">Letzte Sync: Vor 5 Minuten</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}