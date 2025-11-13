export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // TODO: Implement SevDesk transaction fetch
    // TODO: Implement matching algorithm
    // For now, return placeholder message
    
    return NextResponse.json({ 
      message: 'Sync-Funktion wird in Phase 2 implementiert',
      status: 'coming_soon',
      info: 'Derzeit können Payment-Matches manuell in der Datenbank angelegt werden. Die automatische Synchronisation von SevDesk-Transaktionen folgt in Kürze.'
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

