export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const search = searchParams.get('search')

    const supabase = await createClient()

    // Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build Query - nur bezahlte Rechnungen
    let query = supabase
      .from('invoices')
      .select('*')
      .eq('status', 'paid')
      .order('created_at', { ascending: false })

    // Date filters
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    // Search filter (Kunde oder Rechnungsnummer)
    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,invoice_number.ilike.%${search}%`)
    }

    const { data: transactions, error } = await query

    if (error) {
      console.error('Supabase error fetching transactions:', error)
      return NextResponse.json(
        { error: 'Fehler beim Laden der Transaktionen' },
        { status: 500 }
      )
    }

    if (!transactions) {
      return NextResponse.json({
        transactions: [],
        summary: {
          total: 0,
          thisMonth: 0,
          count: 0,
          thisMonthCount: 0
        }
      })
    }

    // Calculate summary
    const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0)

    // This month calculations
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthTransactions = transactions.filter(
      t => new Date(t.created_at) >= monthStart
    )
    const thisMonth = thisMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0)

    return NextResponse.json({
      transactions,
      summary: {
        total,
        thisMonth,
        count: transactions.length,
        thisMonthCount: thisMonthTransactions.length
      }
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

