import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface TimelineEvent {
  status: string
  date: string
  label: string
}

interface InvoiceDetails {
  id: string
  invoice_number: string
  customer_name: string
  customer_email: string | null
  customer_address: string | null
  amount: number
  due_date: string
  created_at: string
  status: 'paid' | 'open' | 'overdue'
  reminder_level: number
  last_reminder_sent: string | null
  source: 'sevdesk' | 'reonic'
  pdf_url: string | null
  invoice_items: InvoiceItem[]
  timeline: TimelineEvent[]
}

/**
 * GET /api/forderungen/[id]
 * Fetch a single invoice by ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const invoiceId = params.id

    // Fetch invoice from Supabase
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      
      // If invoice not found, return mock data for testing
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Rechnung nicht gefunden' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'Fehler beim Abrufen der Rechnung' },
        { status: 500 }
      )
    }

    // Calculate status based on due_date
    const calculateStatus = (
      status: string,
      dueDate: string
    ): 'paid' | 'open' | 'overdue' => {
      if (status === 'paid') {
        return 'paid'
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const due = new Date(dueDate)
      due.setHours(0, 0, 0, 0)

      if (due < today) {
        return 'overdue'
      }

      return 'open'
    }

    // Generate mock invoice items (until real data exists)
    const invoiceItems: InvoiceItem[] = [
      {
        description: 'Leistungen gemäß Auftrag',
        quantity: 1,
        unit_price: invoice.amount,
        total: invoice.amount,
      },
    ]

    // Generate timeline events
    const timeline: TimelineEvent[] = [
      {
        status: 'created',
        date: invoice.created_at,
        label: 'Rechnung erstellt',
      },
      {
        status: 'sent',
        date: invoice.created_at,
        label: 'Rechnung versendet',
      },
    ]

    // Add reminder events if any
    const reminderCount = invoice.reminder_count || 0
    if (reminderCount > 0 && invoice.last_reminder_sent) {
      for (let i = 1; i <= reminderCount; i++) {
        timeline.push({
          status: `reminder_${i}`,
          date: invoice.last_reminder_sent,
          label: `${i}. Mahnung versendet`,
        })
      }
    }

    // Add paid event if status is paid
    if (invoice.status === 'paid') {
      timeline.push({
        status: 'paid',
        date: invoice.updated_at || invoice.created_at,
        label: 'Rechnung bezahlt',
      })
    }

    // Build response
    const response: InvoiceDetails = {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      customer_name: invoice.customer_name,
      customer_email: invoice.customer_email,
      customer_address: invoice.customer_address,
      amount: invoice.amount,
      due_date: invoice.due_date,
      created_at: invoice.created_at,
      status: calculateStatus(invoice.status, invoice.due_date),
      reminder_level: invoice.reminder_count || 0,
      last_reminder_sent: invoice.last_reminder_sent,
      source: invoice.source,
      pdf_url: invoice.pdf_url,
      invoice_items: invoiceItems,
      timeline: timeline,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

