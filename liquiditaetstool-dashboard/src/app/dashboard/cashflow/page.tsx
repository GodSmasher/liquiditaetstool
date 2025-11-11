'use client'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { useEffect, useState } from 'react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { CashflowData, TimePeriod } from '@/lib/types/cashflow'
import { TrendingUp, AlertTriangle, CheckCircle, Percent, RefreshCw, Wallet, DollarSign } from 'lucide-react'

export default function CashflowPage() {
  const [cashflowData, setCashflowData] = useState<CashflowData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<TimePeriod>('6months')

  useEffect(() => {
    loadCashflowData()
  }, [period])

  const loadCashflowData = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/cashflow?period=${period}`)
      if (!res.ok) {
        throw new Error('Fehler beim Laden der Cashflow-Daten')
      }

      const data = await res.json()
      if (data.success && data.data) {
        setCashflowData(data.data)
      } else {
        throw new Error(data.error || 'Unbekannter Fehler')
      }
    } catch (err: any) {
      console.error('Error loading cashflow:', err)
      setError(err.message || 'Fehler beim Laden')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatLargeNumber = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M €`
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K €`
    }
    return formatCurrency(amount)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  // Custom Tooltip for Chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: <span className="font-bold">{formatCurrency(entry.value)}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          <p className="mt-4 text-gray-600">Lade Cashflow-Daten...</p>
        </div>
      </div>
    )
  }

  // Error State
  if (error || !cashflowData) {
    return (
      <div className="space-y-5">
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900">Fehler beim Laden</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <button
                onClick={loadCashflowData}
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

  const { monthlyData, summary } = cashflowData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cashflow-Prognose</h1>
          <p className="text-sm text-gray-600 mt-0.5">Erwartete und tatsächliche Einnahmen im Überblick</p>
        </div>
        <button
          onClick={loadCashflowData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-600 transition-colors font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </button>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm font-medium text-gray-700">Zeitraum:</label>
          <div className="flex gap-2">
            {[
              { value: '3months', label: 'Nächste 3 Monate' },
              { value: '6months', label: 'Nächste 6 Monate' },
              { value: '12months', label: 'Nächstes Jahr' },
              { value: 'ytd', label: 'Dieses Jahr (YTD)' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value as TimePeriod)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                  period === option.value
                    ? 'bg-amber-500 text-gray-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Offene Forderungen */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 rounded-lg p-3">
              <Wallet className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 opacity-60" />
          </div>
          <p className="text-sm text-white/80 font-medium">Offene Forderungen</p>
          <p className="text-3xl font-bold mt-2">{formatLargeNumber(summary.totalPending)}</p>
          <p className="text-xs text-white/70 mt-2">Ausstehende Zahlungen</p>
        </div>

        {/* Überfällige Rechnungen */}
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 rounded-lg p-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">
              {formatPercent(summary.riskPercentage)}
            </span>
          </div>
          <p className="text-sm text-white/80 font-medium">Überfällige Rechnungen</p>
          <p className="text-3xl font-bold mt-2">{formatLargeNumber(summary.totalOverdue)}</p>
          <p className="text-xs text-white/70 mt-2">Risiko-Betrag</p>
        </div>

        {/* Bezahlt diesen Monat */}
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 rounded-lg p-3">
              <CheckCircle className="w-6 h-6" />
            </div>
            <DollarSign className="w-5 h-5 opacity-60" />
          </div>
          <p className="text-sm text-white/80 font-medium">Bezahlt diesen Monat</p>
          <p className="text-3xl font-bold mt-2">{formatLargeNumber(summary.paidThisMonth)}</p>
          <p className="text-xs text-white/70 mt-2">Einnahmen im aktuellen Monat</p>
        </div>

        {/* Erfolgsrate */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 rounded-lg p-3">
              <Percent className="w-6 h-6" />
            </div>
            <TrendingUp className="w-5 h-5 opacity-60" />
          </div>
          <p className="text-sm text-white/80 font-medium">Erfolgsrate</p>
          <p className="text-3xl font-bold mt-2">
            {formatPercent((summary.totalPaid / (summary.totalPaid + summary.totalPending)) * 100)}
          </p>
          <p className="text-xs text-white/70 mt-2">Bezahlt vs. Erwartet</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Monatlicher Cashflow</h2>
          <p className="text-sm text-gray-600 mt-1">Erwartete, tatsächliche und überfällige Einnahmen</p>
        </div>

        {monthlyData.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Daten verfügbar</h3>
            <p className="text-gray-600">Es wurden noch keine Rechnungen für diesen Zeitraum erstellt.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="monthLabel" 
                tick={{ fontSize: 12, fill: '#666' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#666' }}
                tickFormatter={(value) => formatLargeNumber(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Bar 
                dataKey="erwarteteEinnahmen" 
                fill="#10B981" 
                name="Erwartete Einnahmen"
                radius={[8, 8, 0, 0]}
              />
              <Bar 
                dataKey="tatsaechlicheEinnahmen" 
                fill="#3B82F6" 
                name="Tatsächliche Einnahmen"
                radius={[8, 8, 0, 0]}
              />
              <Bar 
                dataKey="ueberfaellig" 
                fill="#EF4444" 
                name="Überfällig"
                radius={[8, 8, 0, 0]}
              />
              <Line 
                type="monotone" 
                dataKey="offeneForderungen" 
                stroke="#F59E0B" 
                strokeWidth={3}
                name="Offene Forderungen"
                dot={{ fill: '#F59E0B', r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Detaillierte Monatsübersicht</h2>
          <p className="text-sm text-gray-600 mt-1">Aufschlüsselung der Einnahmen pro Monat</p>
        </div>

        {monthlyData.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600">Keine Daten verfügbar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-amber-500 uppercase tracking-wider">
                    Monat
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-amber-500 uppercase tracking-wider">
                    Erwartet
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-amber-500 uppercase tracking-wider">
                    Bezahlt
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-amber-500 uppercase tracking-wider">
                    Offen
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-amber-500 uppercase tracking-wider">
                    Überfällig
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-amber-500 uppercase tracking-wider">
                    Anzahl
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-amber-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {monthlyData.map((month, index) => {
                  const statusColor = 
                    month.ueberfaellig > 0 ? 'text-red-600' :
                    month.tatsaechlicheEinnahmen > month.erwarteteEinnahmen ? 'text-green-600' :
                    'text-amber-600'
                  
                  const statusIcon = 
                    month.ueberfaellig > 0 ? '⚠️' :
                    month.tatsaechlicheEinnahmen > month.erwarteteEinnahmen ? '✅' :
                    '📊'

                  return (
                    <tr 
                      key={month.month}
                      className={`hover:bg-amber-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{month.monthLabel}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-green-600">{formatCurrency(month.erwarteteEinnahmen)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-blue-600">{formatCurrency(month.tatsaechlicheEinnahmen)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-amber-600">{formatCurrency(month.offeneForderungen)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-red-600">{formatCurrency(month.ueberfaellig)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {month.anzahlRechnungen} Rechnungen
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`text-2xl ${statusColor}`}>{statusIcon}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">Gesamt</td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                    {formatCurrency(monthlyData.reduce((sum, m) => sum + m.erwarteteEinnahmen, 0))}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-blue-600">
                    {formatCurrency(monthlyData.reduce((sum, m) => sum + m.tatsaechlicheEinnahmen, 0))}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-amber-600">
                    {formatCurrency(monthlyData.reduce((sum, m) => sum + m.offeneForderungen, 0))}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-red-600">
                    {formatCurrency(monthlyData.reduce((sum, m) => sum + m.ueberfaellig, 0))}
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-gray-900">
                    {monthlyData.reduce((sum, m) => sum + m.anzahlRechnungen, 0)}
                  </td>
                  <td className="px-6 py-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
