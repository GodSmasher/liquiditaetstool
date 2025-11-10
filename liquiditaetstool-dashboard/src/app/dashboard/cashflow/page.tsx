'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Transaction {
  id: string
  date: string
  description: string
  category: string
  amount: number
  type: 'income' | 'expense'
  status: 'completed' | 'pending'
}

type TimeRange = '7days' | '30days' | '90days' | 'custom'

export default function CashflowPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>('30days')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadMockData()
  }, [])

  useEffect(() => {
    filterTransactions()
  }, [transactions, timeRange, typeFilter])

  const loadMockData = () => {
    // Mock-Daten - später aus Supabase laden
    const mockTransactions: Transaction[] = [
      { id: '1', date: '2024-11-04', description: 'Rechnung #2401', category: 'Verkauf', amount: 15000, type: 'income', status: 'completed' },
      { id: '2', date: '2024-11-03', description: 'Materialeinkauf', category: 'Material', amount: -3500, type: 'expense', status: 'completed' },
      { id: '3', date: '2024-11-02', description: 'Rechnung #2402', category: 'Verkauf', amount: 22000, type: 'income', status: 'completed' },
      { id: '4', date: '2024-11-01', description: 'Mitarbeitergehälter', category: 'Personal', amount: -8000, type: 'expense', status: 'completed' },
      { id: '5', date: '2024-10-31', description: 'Rechnung #2403', category: 'Verkauf', amount: 18500, type: 'income', status: 'completed' },
      { id: '6', date: '2024-10-30', description: 'Büromaterial', category: 'Büro', amount: -450, type: 'expense', status: 'completed' },
      { id: '7', date: '2024-10-29', description: 'Werkzeug', category: 'Material', amount: -1200, type: 'expense', status: 'completed' },
      { id: '8', date: '2024-10-28', description: 'Rechnung #2404', category: 'Verkauf', amount: 12000, type: 'income', status: 'completed' },
      { id: '9', date: '2024-10-27', description: 'Versicherung', category: 'Verwaltung', amount: -800, type: 'expense', status: 'completed' },
      { id: '10', date: '2024-10-26', description: 'Rechnung #2405', category: 'Verkauf', amount: 25000, type: 'income', status: 'completed' },
      { id: '11', date: '2024-10-25', description: 'Kraftstoff', category: 'Fahrzeug', amount: -350, type: 'expense', status: 'completed' },
      { id: '12', date: '2024-10-24', description: 'Rechnung #2406', category: 'Verkauf', amount: 19000, type: 'income', status: 'completed' },
    ]
    setTransactions(mockTransactions)
  }

  const filterTransactions = () => {
    let result = [...transactions]

    // Zeitraum filtern
    const today = new Date()
    let startDate = new Date()
    
    switch (timeRange) {
      case '7days':
        startDate.setDate(today.getDate() - 7)
        break
      case '30days':
        startDate.setDate(today.getDate() - 30)
        break
      case '90days':
        startDate.setDate(today.getDate() - 90)
        break
    }

    result = result.filter(t => new Date(t.date) >= startDate)

    // Typ filtern
    if (typeFilter !== 'all') {
      result = result.filter(t => t.type === typeFilter)
    }

    setFilteredTransactions(result)
    setCurrentPage(1)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(Math.abs(amount))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Statistiken berechnen
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = Math.abs(filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0))

  const netCashflow = totalIncome - totalExpenses

  const daysInRange = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90
  const averagePerDay = netCashflow / daysInRange

  // Chart Daten vorbereiten
  const lineChartData = filteredTransactions
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce((acc: any[], transaction) => {
      const dateStr = formatDate(transaction.date)
      const existing = acc.find(item => item.date === dateStr)
      
      if (existing) {
        if (transaction.type === 'income') {
          existing.einnahmen += transaction.amount
        } else {
          existing.ausgaben += Math.abs(transaction.amount)
        }
      } else {
        acc.push({
          date: dateStr,
          einnahmen: transaction.type === 'income' ? transaction.amount : 0,
          ausgaben: transaction.type === 'expense' ? Math.abs(transaction.amount) : 0,
        })
      }
      return acc
    }, [])

  // Kategorien für Pie Chart
  const expenseCategories = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc: any[], transaction) => {
      const existing = acc.find(item => item.name === transaction.category)
      if (existing) {
        existing.value += Math.abs(transaction.amount)
      } else {
        acc.push({ name: transaction.category, value: Math.abs(transaction.amount) })
      }
      return acc
    }, [])

  const COLORS = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex)

  const exportToCSV = () => {
    const headers = ['Datum', 'Beschreibung', 'Kategorie', 'Betrag', 'Typ', 'Status']
    const csvData = filteredTransactions.map(t => [
      formatDate(t.date),
      t.description,
      t.category,
      formatCurrency(t.amount),
      t.type === 'income' ? 'Einnahme' : 'Ausgabe',
      t.status === 'completed' ? 'Abgeschlossen' : 'Ausstehend',
    ])

    const csv = [
      headers.join(';'),
      ...csvData.map(row => row.join(';'))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `cashflow_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const exportToPDF = () => {
    alert('PDF-Export wird in einer zukünftigen Version implementiert')
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cashflow-Analyse</h1>
          <p className="mt-0.5 text-sm text-gray-600">Detaillierte Übersicht über Einnahmen und Ausgaben</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-amber-500 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSV Export
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            PDF Export
          </button>
        </div>
      </div>

      {/* Zeitraum Filter */}
      <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200">
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-700">Zeitraum:</label>
          <div className="flex gap-1.5">
            <button
              onClick={() => setTimeRange('7days')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors text-sm ${
                timeRange === '7days'
                  ? 'bg-amber-500 text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              7 Tage
            </button>
            <button
              onClick={() => setTimeRange('30days')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors text-sm ${
                timeRange === '30days'
                  ? 'bg-amber-500 text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              30 Tage
            </button>
            <button
              onClick={() => setTimeRange('90days')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors text-sm ${
                timeRange === '90days'
                  ? 'bg-amber-500 text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              90 Tage
            </button>
          </div>
          <div className="ml-auto flex gap-1.5">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === 'all'
                  ? 'bg-gray-900 text-amber-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Alle
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === 'income'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Einnahmen
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === 'expense'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Ausgaben
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Gesamt Einnahmen</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-green-100 rounded-lg p-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Im gewählten Zeitraum</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Gesamt Ausgaben</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="bg-red-100 rounded-lg p-2">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">Im gewählten Zeitraum</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Netto Cashflow</p>
              <p className={`text-2xl font-bold mt-1 ${netCashflow >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                {formatCurrency(netCashflow)}
              </p>
            </div>
            <div className="bg-amber-100 rounded-lg p-2">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">Einnahmen - Ausgaben</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Durchschnitt/Tag</p>
              <p className={`text-2xl font-bold mt-1 ${averagePerDay >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                {formatCurrency(averagePerDay)}
              </p>
            </div>
            <div className="bg-amber-100 rounded-lg p-2">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">Durchschnittlicher Cashflow</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - Einnahmen vs Ausgaben */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Einnahmen vs Ausgaben</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="einnahmen" stroke="#10B981" strokeWidth={2} name="Einnahmen" />
              <Line type="monotone" dataKey="ausgaben" stroke="#EF4444" strokeWidth={2} name="Ausgaben" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Ausgaben nach Kategorien */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ausgaben nach Kategorien</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseCategories}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {expenseCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaktions-Tabelle */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Transaktionen</h3>
          <p className="text-sm text-gray-600 mt-1">{filteredTransactions.length} Transaktionen gefunden</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-amber-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-amber-500 uppercase tracking-wider">
                  Beschreibung
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-amber-500 uppercase tracking-wider">
                  Kategorie
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-amber-500 uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-amber-500 uppercase tracking-wider">
                  Betrag
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-amber-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedTransactions.map((transaction, index) => (
                <tr 
                  key={transaction.id}
                  className={`hover:bg-amber-50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(transaction.date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{transaction.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      transaction.type === 'income' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {transaction.type === 'income' ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                        </svg>
                      )}
                      {transaction.type === 'income' ? 'Einnahme' : 'Ausgabe'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`text-sm font-bold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      transaction.status === 'completed'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {transaction.status === 'completed' ? 'Abgeschlossen' : 'Ausstehend'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-700 font-medium">
              Seite <span className="text-amber-600 font-bold">{currentPage}</span> von <span className="text-amber-600 font-bold">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-900 text-amber-500 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Zurück
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-amber-500 text-gray-900 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Weiter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

