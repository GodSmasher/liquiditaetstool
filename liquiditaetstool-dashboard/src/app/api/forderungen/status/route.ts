export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateInvoiceStatus } from '@/lib/utils/invoice-helpers'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Statistiken' },
        { status: 500 }
      )
    }

    if (!invoices) {
      return NextResponse.json({
        total_invoices: 0,
        open_invoices: 0,
        overdue_invoices: 0,
        paid_invoices: 0,
        total_open_amount: 0,
        total_overdue_amount: 0,
      })
    }

    // Berechne Statistiken
    let openCount = 0
    let overdueCount = 0
    let paidCount = 0
    let totalOpenAmount = 0
    let totalOverdueAmount = 0

    invoices.forEach(invoice => {
      const status = calculateInvoiceStatus({
        status: invoice.status,
        due_date: invoice.due_date
      })
      
      const amount = parseFloat(invoice.amount as any)

      if (status === 'paid') {
        paidCount++
      } else if (status === 'overdue') {
        overdueCount++
        totalOverdueAmount += amount
      } else if (status === 'pending') {
        openCount++
        totalOpenAmount += amount
      }
    })

    // Berechne bezahlte Beträge
    let totalPaidAmount = 0
    invoices.forEach(invoice => {
      const status = calculateInvoiceStatus({
        status: invoice.status,
        due_date: invoice.due_date
      })
      if (status === 'paid') {
        totalPaidAmount += parseFloat(invoice.amount as any)
      }
    })

    return NextResponse.json({
      total_invoices: invoices.length,
      open_invoices: openCount,
      overdue_invoices: overdueCount,
      paid_invoices: paidCount,
      total_open_amount: totalOpenAmount,
      total_overdue_amount: totalOverdueAmount,
      total_paid_amount: totalPaidAmount,
    })
  } catch (error) {
    console.error('Error fetching status:', error)
    return NextResponse.json(
      { error: 'Fehler beim Berechnen der Statistiken' },
      { status: 500 }
    )
  }
}
