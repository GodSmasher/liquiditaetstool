export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateInvoiceStatus } from '@/lib/utils/invoice-helpers'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
    const supabase = await createClient()

    // Versuche zunächst nach invoice_number zu suchen
    let { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_number', id)
      .single()

    // Falls nicht gefunden, versuche nach UUID zu suchen
    if (error || !invoice) {
      const result = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single()
      
      invoice = result.data
      error = result.error
    }

    if (error || !invoice) {
      console.error('Invoice not found:', error)
      return NextResponse.json(
        { error: 'Rechnung nicht gefunden' },
        { status: 404 }
      )
    }

    // Berechne aktuellen Status
    const calculatedStatus = calculateInvoiceStatus({
      status: invoice.status,
      due_date: invoice.due_date
    })

    // Formatiere für Frontend (mit Mock-Daten für fehlende Felder)
    const invoiceDetails = {
      id: invoice.invoice_number,
      invoice_number: invoice.invoice_number,
      customer_name: invoice.customer_name,
      customer_email: 'kontakt@kunde.de', // TODO: Aus Datenbank wenn vorhanden
      customer_address: invoice.customer_address || 'Keine Adresse hinterlegt',
      amount: parseFloat(invoice.amount as any),
      due_date: invoice.due_date,
      created_at: invoice.invoice_date || invoice.created_at,
      status: calculatedStatus,
      reminder_level: invoice.reminder_count || 0,
      source: invoice.source,
      // Mock-Daten für noch nicht implementierte Felder
      invoice_items: [
        {
          description: 'Rechnungsposition',
          quantity: 1,
          unit_price: parseFloat(invoice.amount as any),
          total: parseFloat(invoice.amount as any)
        }
      ],
      timeline: [
        {
          status: 'created',
          date: invoice.created_at,
          label: 'Erstellt'
        },
        ...(invoice.status === 'paid' ? [{
          status: 'paid',
          date: invoice.created_at,
          label: 'Bezahlt'
        }] : []),
        ...(invoice.last_reminder_sent ? [{
          status: 'reminder',
          date: invoice.last_reminder_sent,
          label: `${invoice.reminder_count}. Mahnung`
        }] : [])
      ]
    }

    return NextResponse.json(invoiceDetails)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Rechnung' },
      { status: 500 }
    )
  }
}

