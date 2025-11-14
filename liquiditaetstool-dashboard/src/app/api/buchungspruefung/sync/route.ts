export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { findBestMatch, findPossibleMatches } from '@/lib/utils/payment-matching'

// POST - Sync transactions from SevDesk and create payment matches
// This will fetch transactions from SevDesk and match them to invoices
// For MVP, we'll implement manual trigger
// Later: Automatic daily sync via cron
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // CRITICAL: Load ALL invoices from database, no date filters!
    // Payments can be for old invoices (2020-2024), so we need complete history
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, invoice_number, customer_name, amount, due_date, status')
      .order('invoice_date', { ascending: false })
      // ✅ NO date filters like .gte('invoice_date', '2025-01-01')
      // ✅ Only filter by status if needed (e.g., exclude drafts)
      // .neq('status', 'draft') // Optional: exclude drafts if needed

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError)
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }

    // TODO: Implement SevDesk transaction fetch
    // TODO: For each transaction, use matching algorithm with ALL invoices
    // Example:
    // const payment = { amount: 1234.56, date: '2025-11-15', reference: 'RE-2943' }
    // const match = findBestMatch(payment, invoices)
    // if (match) {
    //   // Create payment_match record with suggested_invoice_id
    // }
    
    return NextResponse.json({ 
      message: 'Sync-Funktion wird in Phase 2 implementiert',
      status: 'coming_soon',
      info: 'Derzeit können Payment-Matches manuell in der Datenbank angelegt werden. Die automatische Synchronisation von SevDesk-Transaktionen folgt in Kürze.',
      invoicesLoaded: invoices?.length || 0,
      note: 'Alle Rechnungen werden geladen (keine Datumsfilter) für vollständiges Matching'
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

