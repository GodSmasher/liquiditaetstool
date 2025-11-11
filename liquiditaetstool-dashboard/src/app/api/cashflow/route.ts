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

    // Group by month
    const monthlyMap = new Map<string, MonthlyData>()

    // Generate all months in range
    for (let i = 0; i < months; i++) {
      const date = new Date(startDate)
      date.setMonth(date.getMonth() + i)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })

      monthlyMap.set(monthKey, {
        month: monthKey,
        monthLabel,
        erwarteteEinnahmen: 0,
        tatsaechlicheEinnahmen: 0,
        offeneForderungen: 0,
        ueberfaellig: 0,
        anzahlRechnungen: 0,
        erfolgsrate: 0
      })
    }

    // Aggregate data
    processedInvoices.forEach(invoice => {
      const dueDate = new Date(invoice.due_date)
      const createdDate = new Date(invoice.created_at || invoice.invoice_date)
      const amount = invoice.amount

      // Group paid invoices by created_at month
      if (invoice.calculatedStatus === 'paid') {
        const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`
        const monthData = monthlyMap.get(monthKey)
        if (monthData) {
          monthData.tatsaechlicheEinnahmen += amount
          monthData.anzahlRechnungen++
        }
      }

      // Group pending invoices by due_date month
      if (invoice.calculatedStatus === 'pending') {
        const monthKey = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`
        const monthData = monthlyMap.get(monthKey)
        if (monthData) {
          monthData.erwarteteEinnahmen += amount
          monthData.offeneForderungen += amount
          monthData.anzahlRechnungen++
        }
      }

      // Group overdue by due_date month
      if (invoice.calculatedStatus === 'overdue') {
        const monthKey = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`
        const monthData = monthlyMap.get(monthKey)
        if (monthData) {
          monthData.ueberfaellig += amount
          monthData.offeneForderungen += amount
          monthData.anzahlRechnungen++
        }
      }
    })

    // Calculate success rate for each month
    monthlyMap.forEach(monthData => {
      const total = monthData.erwarteteEinnahmen + monthData.tatsaechlicheEinnahmen
      if (total > 0) {
        monthData.erfolgsrate = (monthData.tatsaechlicheEinnahmen / total) * 100
      }
    })

    // Convert to array and sort by month
    const monthlyData = Array.from(monthlyMap.values()).sort((a, b) => 
      a.month.localeCompare(b.month)
    )

    // Calculate summary
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
        const date = new Date(inv.created_at || inv.invoice_date)
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

