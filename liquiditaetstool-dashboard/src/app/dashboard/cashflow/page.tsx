'use client'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { useEffect, useState } from 'react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import type { CashflowData } from '@/lib/types/cashflow'
import { TrendingUp, AlertTriangle, CheckCircle, RefreshCw, Wallet, Calendar } from 'lucide-react'

export default function CashflowPage() {
  const [cashflowData, setCashflowData] = useState<CashflowData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCashflowData()
  }, [])

  const loadCashflowData = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/cashflow')
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

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Custom Tooltip for Chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{formatFullDate(data.date)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm tabular-nums">
              {entry.name}: <span className="font-bold">{formatCurrency(entry.value)}</span>
            </p>
          ))}
          {data.anzahlRechnungen > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {data.anzahlRechnungen} Rechnung{data.anzahlRechnungen !== 1 ? 'en' : ''}
            </p>
          )}
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

  const { dailyData, summary } = cashflowData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cashflow-Prognose</h1>
          <p className="text-sm text-gray-600 mt-0.5">Nächste 2 Wochen - Tägliche Übersicht</p>
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

      {/* KPI Cards - Updated for 2-week view */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Heute */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Heute</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{formatLargeNumber(summary.todayExpected)}</p>
            </div>
          </div>
        </div>

        {/* Morgen */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Morgen</p>
              <p className="text-2xl font-bold text-gray-900 tabular-nums">{formatLargeNumber(summary.tomorrowExpected)}</p>
            </div>
          </div>
        </div>

        {/* Diese Woche */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Diese Woche</p>
              <p className="text-2xl font-bold text-emerald-600 tabular-nums">{formatLargeNumber(summary.thisWeekExpected)}</p>
            </div>
          </div>
        </div>

        {/* Nächste 2 Wochen */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Nächste 2 Wochen</p>
              <p className="text-2xl font-bold text-purple-600 tabular-nums">{formatLargeNumber(summary.totalExpected)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart - Daily View */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Täglicher Cashflow (Nächste 2 Wochen)</h2>
          <p className="text-sm text-gray-600 mt-1">Erwartete, bezahlte und überfällige Einnahmen pro Tag</p>
        </div>

        {dailyData.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Daten verfügbar</h3>
            <p className="text-gray-600">Es wurden noch keine Rechnungen für die nächsten 14 Tage erstellt.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="dateLabel" 
                tick={{ fontSize: 11, fill: '#6B7280' }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6B7280' }}
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
                radius={[4, 4, 0, 0]}
              >
                {dailyData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isToday ? '#059669' : entry.isWeekend ? '#86EFAC' : '#10B981'} 
                  />
                ))}
              </Bar>
              <Bar 
                dataKey="bezahlt" 
                fill="#3B82F6" 
                name="Bezahlt"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="ueberfaellig" 
                fill="#EF4444" 
                name="Überfällig"
                radius={[4, 4, 0, 0]}
              />
              <Line 
                type="monotone" 
                dataKey="offen" 
                stroke="#F59E0B" 
                strokeWidth={2}
                name="Offen"
                dot={{ fill: '#F59E0B', r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Detailed Table - Daily View */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Detaillierte Tagesübersicht</h2>
          <p className="text-sm text-gray-600 mt-1">Aufschlüsselung der Einnahmen pro Tag</p>
        </div>

        {dailyData.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600">Keine Daten verfügbar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Erwartet
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Bezahlt
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Offen
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Überfällig
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Anzahl
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dailyData.map((day, index) => {
                  const isUrgent = day.isToday || index === 1 // Today or tomorrow
                  const statusColor = 
                    day.ueberfaellig > 0 ? 'bg-red-50' :
                    day.isToday ? 'bg-amber-50' :
                    day.isWeekend ? 'bg-gray-50' :
                    'bg-white'

                  return (
                    <tr 
                      key={day.date}
                      className={`hover:bg-amber-50 transition-colors ${statusColor} ${
                        isUrgent ? 'border-l-4 border-amber-500' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-gray-900">{day.dateLabel}</div>
                          {day.isToday && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500 text-white">
                              Heute
                            </span>
                          )}
                          {day.isWeekend && (
                            <span className="text-xs text-gray-400">Wochenende</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-emerald-600 tabular-nums">
                          {formatCurrency(day.erwarteteEinnahmen)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-blue-600 tabular-nums">
                          {formatCurrency(day.bezahlt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-amber-600 tabular-nums">
                          {formatCurrency(day.offen)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-red-600 tabular-nums">
                          {formatCurrency(day.ueberfaellig)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 tabular-nums">
                          {day.anzahlRechnungen}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">Gesamt (14 Tage)</td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600 tabular-nums">
                    {formatCurrency(dailyData.reduce((sum, d) => sum + d.erwarteteEinnahmen, 0))}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-blue-600 tabular-nums">
                    {formatCurrency(dailyData.reduce((sum, d) => sum + d.bezahlt, 0))}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-amber-600 tabular-nums">
                    {formatCurrency(dailyData.reduce((sum, d) => sum + d.offen, 0))}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-red-600 tabular-nums">
                    {formatCurrency(dailyData.reduce((sum, d) => sum + d.ueberfaellig, 0))}
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-gray-900 tabular-nums">
                    {dailyData.reduce((sum, d) => sum + d.anzahlRechnungen, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
