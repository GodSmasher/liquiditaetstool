export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const invoiceId = params.id

    // Finde die Rechnung
    let { data: invoice, error: findError } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_number', invoiceId)
      .single()

    if (findError || !invoice) {
      const result = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single()
      
      invoice = result.data
      findError = result.error
    }

    if (findError || !invoice) {
      return NextResponse.json(
        { error: 'Rechnung nicht gefunden' },
        { status: 404 }
      )
    }

    // Aktualisiere reminder_count und last_reminder_sent
    const newReminderCount = (invoice.reminder_count || 0) + 1
    const { data, error } = await supabase
      .from('invoices')
      .update({
        reminder_count: newReminderCount,
        last_reminder_sent: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invoice.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating invoice:', error)
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren der Rechnung' },
        { status: 500 }
      )
    }

    // TODO: Hier später E-Mail-Versand mit Resend oder Backend-Integration
    // Momentan nur DB-Update
    
    return NextResponse.json({
      success: true,
      message: `${newReminderCount}. Mahnung wurde versendet`,
      invoice: data,
      reminder_level: newReminderCount
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// Helper Functions für später (wenn Resend aktiviert wird)
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(numAmount);
}
