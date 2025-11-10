export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'

// Mock-Daten für Forderungen (später aus Datenbank/SevDesk/Reonic)
const mockReceivables = [
  {
    invoice_id: 'SV-2024-0012',
    customer: 'Musterfirma GmbH',
    amount: 4200,
    due_date: '2024-11-15',
    status: 'overdue',
    reminder_level: 1,
    source: 'sevdesk'
  },
  {
    invoice_id: 'SV-2024-0013',
    customer: 'Tech Solutions AG',
    amount: 8500,
    due_date: '2024-12-20',
    status: 'open',
    reminder_level: 0,
    source: 'sevdesk'
  },
  {
    invoice_id: 'RE-2024-0501',
    customer: 'Solar Energy GmbH',
    amount: 12500,
    due_date: '2024-11-25',
    status: 'open',
    reminder_level: 0,
    source: 'reonic'
  },
  {
    invoice_id: 'RE-2024-0502',
    customer: 'Green Power Systems',
    amount: 6800,
    due_date: '2024-12-01',
    status: 'open',
    reminder_level: 0,
    source: 'reonic'
  },
  {
    invoice_id: 'SV-2024-0010',
    customer: 'Energie Plus GmbH',
    amount: 3200,
    due_date: '2024-10-30',
    status: 'overdue',
    reminder_level: 2,
    source: 'sevdesk'
  },
  {
    invoice_id: 'RE-2024-0499',
    customer: 'Öko Systems AG',
    amount: 15000,
    due_date: '2024-10-15',
    status: 'paid',
    reminder_level: 0,
    source: 'reonic'
  },
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let receivables = mockReceivables

    // Filter nach Status wenn angegeben
    if (status && status !== 'all') {
      receivables = receivables.filter(r => r.status === status)
    }

    return NextResponse.json(receivables)
  } catch (error) {
    console.error('Error fetching receivables:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Forderungen' },
      { status: 500 }
    )
  }
}

