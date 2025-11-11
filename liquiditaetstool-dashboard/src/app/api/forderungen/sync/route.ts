export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3001'

export async function POST() {
  try {
    console.log('🔄 Starte Synchronisation mit Backend...')
    
    // Rufe das Backend auf, um Sync zu triggern
    const backendResponse = await fetch(`${BACKEND_URL}/api/sync/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Timeout nach 30 Sekunden
      signal: AbortSignal.timeout(30000)
    })

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      console.error('Backend Sync fehlgeschlagen:', errorText)
      
      return NextResponse.json({
        success: false,
        error: 'Backend-Synchronisation fehlgeschlagen',
        message: 'Stelle sicher, dass das Backend (Port 3001) läuft',
        details: errorText
      }, { status: 502 })
    }

    const backendData = await backendResponse.json()
    console.log('✅ Backend Sync erfolgreich:', backendData)

    return NextResponse.json({
      success: true,
      message: 'Synchronisation erfolgreich abgeschlossen',
      data: {
        invoices: backendData.data?.invoices || 0,
        payments: backendData.data?.payments || 0,
        source: 'backend',
        timestamp: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error('Error during sync:', error)

    // Spezifische Fehlerbehandlung
    if (error.name === 'AbortError') {
      return NextResponse.json({
        success: false,
        error: 'Synchronisation Timeout',
        message: 'Die Synchronisation hat zu lange gedauert (>30s)'
      }, { status: 504 })
    }

    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json({
        success: false,
        error: 'Backend nicht erreichbar',
        message: 'Das Backend ist nicht erreichbar. Stelle sicher, dass es läuft (npm run dev in forderungsmanagement-backend/)',
        details: `Backend URL: ${BACKEND_URL}`
      }, { status: 503 })
    }

    return NextResponse.json({
      success: false,
      error: 'Fehler bei der Synchronisation',
      message: error.message || 'Unbekannter Fehler',
      details: error.toString()
    }, { status: 500 })
  }
}
