export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateInvoiceStatus } from '@/lib/utils/invoice-helpers'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const customerSearch = searchParams.get('customer')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    const supabase = await createClient()

    // Basis-Query
    let query = supabase
      .from('invoices')
      .select('*')
      .order('due_date', { ascending: false })

    // Filter nach Kunde (optional)
    if (customerSearch) {
      query = query.ilike('customer_name', `%${customerSearch}%`)
    }

    // Filter nach Datumsbereich (optional)
    if (dateFrom) {
      query = query.gte('due_date', dateFrom)
    }
    if (dateTo) {
      query = query.lte('due_date', dateTo)
    }

    const { data: invoices, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Forderungen aus der Datenbank' },
        { status: 500 }
      )
    }

    if (!invoices) {
      return NextResponse.json([])
    }

    // Berechne Status für jede Rechnung und mappe auf Frontend-Format
    let receivables = invoices.map(invoice => {
      const calculatedStatus = calculateInvoiceStatus({
        status: invoice.status,
        due_date: invoice.due_date
      })

      return {
        invoice_id: invoice.invoice_number,
        customer: invoice.customer_name,
        amount: parseFloat(invoice.amount as any),
        due_date: invoice.due_date,
        status: calculatedStatus,
        reminder_level: invoice.reminder_count || 0,
        source: invoice.source,
        id: invoice.id // Füge ID für Detail-Navigation hinzu
      }
    })

    // Filter nach Status wenn angegeben (nach Status-Berechnung)
    if (statusFilter && statusFilter !== 'all') {
      receivables = receivables.filter(r => r.status === statusFilter)
    }

    return NextResponse.json(receivables)
  } catch (error) {
    console.error('Error fetching receivables:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Forderungen' },
      { status: 500 }
    )
  }
}

