export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Simuliere Sync-Prozess
    await new Promise(resolve => setTimeout(resolve, 1500))

    // In Zukunft: Hier würden SevDesk und Reonic APIs aufgerufen werden
    // und die Daten in der Datenbank gespeichert

    const result = {
      success: true,
      message: 'Synchronisation erfolgreich',
      data: {
        invoices: 6,
        payments: 3,
        timestamp: new Date().toISOString(),
      },
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error during sync:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Fehler bei der Synchronisation' 
      },
      { status: 500 }
    )
  }
}

