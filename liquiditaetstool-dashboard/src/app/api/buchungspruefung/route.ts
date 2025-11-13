export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch unmatched payments with suggestions
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch payment matches with related invoices
    const { data: matches, error } = await supabase
      .from('payment_matches')
      .select(`
        *,
        suggested_invoice:invoices!payment_matches_suggested_invoice_id_fkey(
          id,
          invoice_number,
          customer_name,
          amount,
          due_date
        ),
        matched_invoice:invoices!payment_matches_matched_invoice_id_fkey(
          id,
          invoice_number,
          customer_name
        )
      `)
      .order('payment_date', { ascending: false })

    if (error) {
      console.error('Error fetching payment matches:', error)
      return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
    }

    // Group by status
    const pending = matches?.filter(m => m.status === 'pending') || []
    const matched = matches?.filter(m => m.status === 'matched') || []
    const ignored = matches?.filter(m => m.status === 'ignored') || []

    return NextResponse.json({
      pending,
      matched,
      ignored,
      counts: {
        pending: pending.length,
        matched: matched.length,
        ignored: ignored.length
      }
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Update match status
export async function POST(request: Request) {
  try {
    const { matchId, status, invoiceId, notes } = await request.json()
    
    const supabase = await createClient()
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build update object dynamically
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Only update status if provided and not 'pending'
    if (status && status !== 'pending') {
      updateData.status = status
      updateData.matched_by = user.email
      updateData.matched_at = new Date().toISOString()
    }

    // Update invoice ID if provided
    if (invoiceId !== undefined) {
      updateData.matched_invoice_id = invoiceId
    }

    // Update notes if provided
    if (notes !== undefined) {
      updateData.notes = notes
    }

    // Update match
    const { data, error } = await supabase
      .from('payment_matches')
      .update(updateData)
      .eq('id', matchId)
      .select()
      .single()

    if (error) {
      console.error('Error updating match:', error)
      return NextResponse.json({ error: 'Failed to update match' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

