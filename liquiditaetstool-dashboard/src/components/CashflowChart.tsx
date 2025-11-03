'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'

interface CashflowData {
  date: string
  einnahmen: number
  ausgaben: number
  liquiditaet: number
}

interface Invoice {
  id: string
  invoice_number: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  due_date: string
  customer_name: string
  created_at: string
}

export default function CashflowChart() {
  const [data, setData] = useState<CashflowData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadCashflowData()
  }, [])

  const loadCashflowData = async () => {
    try {
      // Hole Rechnungen aus Supabase
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Fehler beim Laden der Rechnungen:', error)
        // Zeige trotzdem Demo-Daten wenn Tabelle nicht existiert
        setData(generateDemoData())
      } else {
        // Berechne 90-Tage-Prognose mit echten Daten
        const forecast = calculateForecast(invoices || [])
        setData(forecast)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Cashflow-Daten:', error)
      // Fallback zu Demo-Daten
      setData(generateDemoData())
    } finally {
      setLoading(false)
    }
  }

  const generateDemoData = (): CashflowData[] => {
    const today = new Date()
    const demoData: CashflowData[] = []
    let liquiditaet = 50000

    for (let i = 0; i < 90; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      
      const einnahmen = Math.random() > 0.7 ? Math.floor(Math.random() * 10000) + 2000 : 0
      const ausgaben = i % 7 === 0 ? 5000 : Math.floor(Math.random() * 1500) + 500
      
      liquiditaet = liquiditaet + einnahmen - ausgaben

      demoData.push({
        date: date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }),
        einnahmen,
        ausgaben,
        liquiditaet: Math.round(liquiditaet),
      })
    }

    return demoData
  }

  const calculateForecast = (invoices: Invoice[]) => {
    const today = new Date()
    const forecast: CashflowData[] = []
    let currentLiquiditaet = 50000 // Startkapital (kannst du anpassen)

    // Generiere 90 Tage
    for (let i = 0; i < 90; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      // Finde Rechnungen für diesen Tag
      const dayInvoices = invoices.filter((inv: Invoice) => {
        const invDate = new Date(inv.due_date || inv.created_at)
        return invDate.toISOString().split('T')[0] === dateStr
      })

      // Berechne Einnahmen (bezahlte Rechnungen)
      const einnahmen = dayInvoices
        .filter((inv: Invoice) => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.amount || 0), 0)

      // Berechne erwartete Einnahmen (offene Rechnungen)
      const erwarteteEinnahmen = dayInvoices
        .filter((inv: Invoice) => inv.status === 'pending' || inv.status === 'overdue')
        .reduce((sum, inv) => sum + (inv.amount || 0), 0)

      // Schätze durchschnittliche Ausgaben (vereinfacht)
      const ausgaben = i % 7 === 0 ? 5000 : 1000 // Wöchentliche größere Ausgaben

      // Update Liquidität
      currentLiquiditaet = currentLiquiditaet + einnahmen + erwarteteEinnahmen - ausgaben

      forecast.push({
        date: date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }),
        einnahmen: Math.round(einnahmen + erwarteteEinnahmen),
        ausgaben: Math.round(ausgaben),
        liquiditaet: Math.round(currentLiquiditaet),
      })
    }

    return forecast
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">90-Tage Cashflow-Prognose</h3>
        <p className="text-sm text-gray-600 mt-1">
          Visualisierung deiner erwarteten Liquidität
        </p>
      </div>

      {/* Liquiditätskurve */}
      <div className="mb-8">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Liquiditätsverlauf</h4>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorLiquiditaet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
              interval={10}
            />
            <YAxis 
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
              tickFormatter={formatCurrency}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Area
              type="monotone"
              dataKey="liquiditaet"
              stroke="#3B82F6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorLiquiditaet)"
            />
            {/* Kritische Zone */}
            <Area
              type="monotone"
              dataKey={() => 10000}
              stroke="#EF4444"
              strokeWidth={1}
              strokeDasharray="5 5"
              fillOpacity={0}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-2 flex items-center text-xs text-gray-600">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span>Kritische Zone (unter 10.000€)</span>
        </div>
      </div>

      {/* Einnahmen vs. Ausgaben */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Einnahmen vs. Ausgaben</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
              interval={10}
            />
            <YAxis 
              stroke="#6B7280"
              tick={{ fontSize: 12 }}
              tickFormatter={formatCurrency}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="einnahmen"
              stroke="#10B981"
              strokeWidth={2}
              name="Einnahmen"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="ausgaben"
              stroke="#EF4444"
              strokeWidth={2}
              name="Ausgaben"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Warnung bei niedriger Liquidität */}
      {data.some(d => d.liquiditaet < 10000) && (
        <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex">
            <svg className="h-5 w-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-red-800">Warnung: Niedrige Liquidität erwartet</h3>
              <p className="mt-1 text-sm text-red-700">
                In den nächsten 90 Tagen wird deine Liquidität voraussichtlich unter 10.000€ fallen. 
                Überprüfe deine Zahlungseingänge und plane ggf. zusätzliche Finanzierungen.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Positive Info */}
      {data.every(d => d.liquiditaet > 20000) && (
        <div className="mt-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
          <div className="flex">
            <svg className="h-5 w-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-green-800">Stabile Liquidität</h3>
              <p className="mt-1 text-sm text-green-700">
                Deine Liquiditätsprognose sieht gut aus. Du bleibst in den nächsten 90 Tagen über 20.000€.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}