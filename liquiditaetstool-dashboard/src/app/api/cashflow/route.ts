export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 60 // Cache for 60 seconds

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateInvoiceStatus } from '@/lib/utils/invoice-helpers'
import type { MonthlyData, CashflowData, CashflowSummary } from '@/lib/types/cashflow'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '6months'

    const supabase = await createClient()

    // Fetch all invoices
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .order('due_date', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { success: false, error: 'Fehler beim Laden der Rechnungen' },
        { status: 500 }
      )
    }

    if (!invoices || invoices.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          monthlyData: [],
          summary: {
            totalPending: 0,
            totalPaid: 0,
            totalOverdue: 0,
            riskPercentage: 0,
            paidThisMonth: 0,
            avgInvoiceAmount: 0
          },
          period: {
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
            months: 0
          }
        }
      })
    }

    // Calculate date range based on period
    const today = new Date()
    const startDate = new Date(today)
    let endDate = new Date(today)
    let months = 6

    switch (period) {
      case '3months':
        months = 3
        endDate.setMonth(endDate.getMonth() + 3)
        break
      case '6months':
        months = 6
        endDate.setMonth(endDate.getMonth() + 6)
        break
      case '12months':
        months = 12
        endDate.setMonth(endDate.getMonth() + 12)
        break
      case 'ytd':
        startDate.setMonth(0, 1) // Jan 1
        endDate.setMonth(11, 31) // Dec 31
        months = 12
        break
    }

    // Process invoices with calculated status
    const processedInvoices = invoices.map(invoice => ({
      ...invoice,
      calculatedStatus: calculateInvoiceStatus({
        status: invoice.status,
        due_date: invoice.due_date
      }),
      amount: parseFloat(invoice.amount as any)
    }))

    // DATA VALIDATION LOGGING (Development Only)
    if (process.env.NODE_ENV === 'development') {
      console.log('═══ CASHFLOW DATA VALIDATION ═══')
      console.log('Total Invoices:', invoices.length)
      console.log('Total Amount:', processedInvoices.reduce((sum, inv) => sum + inv.amount, 0).toFixed(2), '€')
      console.log('By Status:', {
        paid: {
          count: processedInvoices.filter(i => i.calculatedStatus === 'paid').length,
          sum: processedInvoices.filter(i => i.calculatedStatus === 'paid').reduce((sum, i) => sum + i.amount, 0).toFixed(2) + ' €'
        },
        pending: {
          count: processedInvoices.filter(i => i.calculatedStatus === 'pending').length,
          sum: processedInvoices.filter(i => i.calculatedStatus === 'pending').reduce((sum, i) => sum + i.amount, 0).toFixed(2) + ' €'
        },
        overdue: {
          count: processedInvoices.filter(i => i.calculatedStatus === 'overdue').length,
          sum: processedInvoices.filter(i => i.calculatedStatus === 'overdue').reduce((sum, i) => sum + i.amount, 0).toFixed(2) + ' €'
        }
      })
      console.log('Date Range:', {
        oldest: invoices[invoices.length - 1]?.invoice_date || invoices[invoices.length - 1]?.created_at,
        newest: invoices[0]?.invoice_date || invoices[0]?.created_at
      })
      console.log('Period Filter:', period, '(', months, 'months )')
    }

    // IMPROVED: Group by month using reduce for better aggregation
    const monthlyMap: Record<string, MonthlyData> = {}

    // Generate all months in range first
    for (let i = 0; i < months; i++) {
      const date = new Date(startDate)
      date.setMonth(date.getMonth() + i)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })

      monthlyMap[monthKey] = {
        month: monthKey,
        monthLabel,
        erwarteteEinnahmen: 0,
        tatsaechlicheEinnahmen: 0,
        offeneForderungen: 0,
        ueberfaellig: 0,
        anzahlRechnungen: 0,
        erfolgsrate: 0
      }
    }

    // Aggregate invoices into months
    processedInvoices.forEach(invoice => {
      const dueDate = new Date(invoice.due_date)
      const monthKey = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`
      
      // Skip if month is not in our range
      if (!monthlyMap[monthKey]) return

      const amount = invoice.amount
      monthlyMap[monthKey].anzahlRechnungen++

      if (invoice.calculatedStatus === 'paid') {
        monthlyMap[monthKey].tatsaechlicheEinnahmen += amount
        monthlyMap[monthKey].erwarteteEinnahmen += amount // Paid is part of expected
      } else if (invoice.calculatedStatus === 'pending') {
        monthlyMap[monthKey].erwarteteEinnahmen += amount
        monthlyMap[monthKey].offeneForderungen += amount
      } else if (invoice.calculatedStatus === 'overdue') {
        monthlyMap[monthKey].erwarteteEinnahmen += amount
        monthlyMap[monthKey].ueberfaellig += amount
        monthlyMap[monthKey].offeneForderungen += amount
      }
    })

    // Calculate success rate for each month
    Object.values(monthlyMap).forEach(monthData => {
      const total = monthData.erwarteteEinnahmen
      if (total > 0) {
        monthData.erfolgsrate = (monthData.tatsaechlicheEinnahmen / total) * 100
      }
    })

    // Convert to array and sort by month
    const monthlyData = Object.values(monthlyMap).sort((a, b) => 
      a.month.localeCompare(b.month)
    )

    // Calculate summary statistics
    const totalPending = processedInvoices
      .filter(inv => inv.calculatedStatus === 'pending')
      .reduce((sum, inv) => sum + inv.amount, 0)

    const totalPaid = processedInvoices
      .filter(inv => inv.calculatedStatus === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0)

    const totalOverdue = processedInvoices
      .filter(inv => inv.calculatedStatus === 'overdue')
      .reduce((sum, inv) => sum + inv.amount, 0)

    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const paidThisMonth = processedInvoices
      .filter(inv => {
        const date = new Date(inv.invoice_date || inv.created_at)
        return inv.calculatedStatus === 'paid' && 
               date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear
      })
      .reduce((sum, inv) => sum + inv.amount, 0)

    const avgInvoiceAmount = invoices.length > 0 
      ? processedInvoices.reduce((sum, inv) => sum + inv.amount, 0) / invoices.length 
      : 0

    const riskPercentage = (totalPending + totalOverdue) > 0
      ? (totalOverdue / (totalPending + totalOverdue)) * 100
      : 0

    const summary: CashflowSummary = {
      totalPending,
      totalPaid,
      totalOverdue,
      riskPercentage,
      paidThisMonth,
      avgInvoiceAmount
    }

    const cashflowData: CashflowData = {
      monthlyData,
      summary,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        months
      }
    }

    // Debug output in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Cashflow Monthly Data:', monthlyData.length, 'months')
      console.log('First month:', monthlyData[0])
      console.log('Summary:', summary)
      console.log('═══════════════════════════════')
    }

    return NextResponse.json({
      success: true,
      data: cashflowData
    })

  } catch (error) {
    console.error('Error in cashflow API:', error)
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
