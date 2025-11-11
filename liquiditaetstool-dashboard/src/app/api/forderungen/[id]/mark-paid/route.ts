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

    // Finde die Rechnung (erst nach invoice_number, dann nach UUID)
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

    // Update invoice status to paid
    const { data, error } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .eq('id', invoice.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating invoice:', error)
      return NextResponse.json(
        { error: 'Fehler beim Aktualisieren der Rechnung', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Rechnung wurde als bezahlt markiert',
      invoice: data
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}