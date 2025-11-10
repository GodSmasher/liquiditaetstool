'use client'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'

type ReportType = 'umsatz' | 'cashflow' | 'kunden' | 'steuer'
type TimeRange = '30days' | '90days' | '6months' | '12months'

interface ReportData {
  revenue: number
  expenses: number
  profit: number
  invoiceCount: number
  paidInvoices: number
  pendingInvoices: number
  averageInvoiceValue: number
  topCustomers: { name: string; amount: number }[]
  monthlyData: { month: string; revenue: number; expenses: number }[]
  taxData: { period: string; tax: number; net: number }[]
}

export default function BerichtePage() {
  const [reportType, setReportType] = useState<ReportType>('umsatz')
  const [timeRange, setTimeRange] = useState<TimeRange>('30days')
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadReportData()
  }, [timeRange])

  const loadReportData = async () => {
    setLoading(true)
    
    // Mock-Daten - später aus Supabase laden
    setTimeout(() => {
      const mockData: ReportData = {
        revenue: 127500,
        expenses: 45300,
        profit: 82200,
        invoiceCount: 24,
        paidInvoices: 18,
        pendingInvoices: 6,
        averageInvoiceValue: 5312.50,
        topCustomers: [
          { name: 'Solar GmbH', amount: 35000 },
          { name: 'Energie AG', amount: 28000 },
          { name: 'Power Corp', amount: 22000 },
          { name: 'Green Energy', amount: 18500 },
          { name: 'Eco Systems', amount: 15000 },
        ],
        monthlyData: [
          { month: 'Jan', revenue: 45000, expenses: 15000 },
          { month: 'Feb', revenue: 52000, expenses: 18000 },
          { month: 'Mar', revenue: 48000, expenses: 16000 },
          { month: 'Apr', revenue: 61000, expenses: 20000 },
          { month: 'Mai', revenue: 55000, expenses: 17000 },
          { month: 'Jun', revenue: 58000, expenses: 19000 },
        ],
        taxData: [
          { period: 'Q1 2024', tax: 15200, net: 80000 },
          { period: 'Q2 2024', tax: 18300, net: 96300 },
          { period: 'Q3 2024', tax: 16800, net: 88400 },
          { period: 'Q4 2024', tax: 14700, net: 77400 },
        ],
      }
      setReportData(mockData)
      setLoading(false)
    }, 500)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const exportToPDF = () => {
    alert('PDF-Export wird in einer zukünftigen Version implementiert')
  }

  const exportToCSV = () => {
    if (!reportData) return

    const headers = ['Metrik', 'Wert']
    const data = [
      ['Gesamtumsatz', formatCurrency(reportData.revenue)],
      ['Gesamtausgaben', formatCurrency(reportData.expenses)],
      ['Gewinn', formatCurrency(reportData.profit)],
      ['Anzahl Rechnungen', reportData.invoiceCount.toString()],
      ['Bezahlte Rechnungen', reportData.paidInvoices.toString()],
      ['Offene Rechnungen', reportData.pendingInvoices.toString()],
      ['Durchschnittlicher Rechnungswert', formatCurrency(reportData.averageInvoiceValue)],
    ]

    const csv = [
      headers.join(';'),
      ...data.map(row => row.join(';'))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `bericht_${reportType}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const getTimeRangeLabel = () => {
    const labels = {
      '30days': 'Letzte 30 Tage',
      '90days': 'Letzte 90 Tage',
      '6months': 'Letzte 6 Monate',
      '12months': 'Letztes Jahr',
    }
    return labels[timeRange]
  }

  const COLORS = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6']

  if (loading || !reportData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          <p className="mt-4 text-gray-600">Lade Berichtsdaten...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Berichte & Analysen</h1>
          <p className="mt-2 text-gray-600">Detaillierte Auswertungen und Geschäftsberichte</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-amber-500 rounded-lg hover:bg-gray-800 transition-all shadow-md font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSV Export
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-400 transition-all shadow-md font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            PDF Export
          </button>
        </div>
      </div>

      {/* Filter-Bereich */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Berichtstyp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Berichtstyp</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setReportType('umsatz')}
                className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  reportType === 'umsatz'
                    ? 'bg-amber-500 text-gray-900 shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Umsatz
              </button>
              <button
                onClick={() => setReportType('cashflow')}
                className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  reportType === 'cashflow'
                    ? 'bg-amber-500 text-gray-900 shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Cashflow
              </button>
              <button
                onClick={() => setReportType('kunden')}
                className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  reportType === 'kunden'
                    ? 'bg-amber-500 text-gray-900 shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Kunden
              </button>
              <button
                onClick={() => setReportType('steuer')}
                className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  reportType === 'steuer'
                    ? 'bg-amber-500 text-gray-900 shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Steuer
              </button>
            </div>
          </div>

          {/* Zeitraum */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Zeitraum</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: '30days', label: '30 Tage' },
                { value: '90days', label: '90 Tage' },
                { value: '6months', label: '6 Monate' },
                { value: '12months', label: '12 Monate' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTimeRange(option.value as TimeRange)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    timeRange === option.value
                      ? 'bg-gray-900 text-amber-500 shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamtumsatz</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(reportData.revenue)}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">{getTimeRangeLabel()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamtausgaben</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{formatCurrency(reportData.expenses)}</p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">{getTimeRangeLabel()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gewinn</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{formatCurrency(reportData.profit)}</p>
            </div>
            <div className="bg-amber-100 rounded-full p-3">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Umsatz - Ausgaben</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rechnungen</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{reportData.invoiceCount}</p>
            </div>
            <div className="bg-amber-100 rounded-full p-3">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">{reportData.paidInvoices} bezahlt, {reportData.pendingInvoices} offen</p>
        </div>
      </div>

      {/* Report Content basierend auf Typ */}
      {reportType === 'umsatz' && (
        <div className="space-y-6">
          {/* Umsatz Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monatlicher Umsatz</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={reportData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#10B981" name="Umsatz" />
                <Bar dataKey="expenses" fill="#EF4444" name="Ausgaben" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detaillierte Statistiken */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Kennzahlen</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Durchschn. Rechnungswert:</span>
                  <span className="font-bold text-amber-600">{formatCurrency(reportData.averageInvoiceValue)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Gewinnmarge:</span>
                  <span className="font-bold text-green-600">{((reportData.profit / reportData.revenue) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Bezahlrate:</span>
                  <span className="font-bold text-blue-600">{((reportData.paidInvoices / reportData.invoiceCount) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Prognose</h3>
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
                  <p className="text-sm text-gray-600 mb-2">Erwarteter Monatsumsatz:</p>
                  <p className="text-2xl font-bold text-amber-700">{formatCurrency(reportData.revenue / 6)}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <p className="text-sm text-gray-600 mb-2">Erwarteter Jahresumsatz:</p>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency((reportData.revenue / 6) * 12)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'cashflow' && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cashflow-Entwicklung</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={reportData.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} name="Einnahmen" />
              <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={3} name="Ausgaben" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {reportType === 'kunden' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Kunden Liste */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Kunden</h3>
              <div className="space-y-3">
                {reportData.topCustomers.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-amber-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <span className="font-bold text-amber-700">#{index + 1}</span>
                      </div>
                      <span className="font-medium text-gray-900">{customer.name}</span>
                    </div>
                    <span className="font-bold text-amber-600">{formatCurrency(customer.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Kundenverteilung Pie Chart */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Umsatzverteilung</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.topCustomers}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {reportData.topCustomers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {reportType === 'steuer' && (
        <div className="space-y-6">
          {/* Steuer Übersicht */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quartalsweise Steuerübersicht</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-amber-500 uppercase tracking-wider">
                      Zeitraum
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-amber-500 uppercase tracking-wider">
                      Nettoumsatz
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-amber-500 uppercase tracking-wider">
                      MwSt. (19%)
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-amber-500 uppercase tracking-wider">
                      Bruttoumsatz
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.taxData.map((tax, index) => (
                    <tr 
                      key={index}
                      className={`hover:bg-amber-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{tax.period}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(tax.net)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-amber-600">{formatCurrency(tax.tax)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-green-600">{formatCurrency(tax.net + tax.tax)}</div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-900">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-amber-500">GESAMT</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-white">
                        {formatCurrency(reportData.taxData.reduce((sum, t) => sum + t.net, 0))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-amber-500">
                        {formatCurrency(reportData.taxData.reduce((sum, t) => sum + t.tax, 0))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-bold text-white">
                        {formatCurrency(reportData.taxData.reduce((sum, t) => sum + t.net + t.tax, 0))}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Steuer Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Steuerentwicklung</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.taxData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="net" fill="#10B981" name="Netto" />
                <Bar dataKey="tax" fill="#F59E0B" name="MwSt." />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

