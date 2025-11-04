import { NextResponse } from 'next/server'

// Mock-Daten für Status (würde normalerweise aus DB berechnet)
const mockReceivables = [
  { status: 'overdue', amount: 7400 },
  { status: 'open', amount: 27800 },
  { status: 'paid', amount: 15000 },
  { status: 'open', amount: 0 },
  { status: 'overdue', amount: 0 },
]

export async function GET() {
  try {
    // Berechne Status aus Mock-Daten
    const totalInvoices = 6
    const openInvoices = 3
    const overdueInvoices = 2
    const paidInvoices = 1
    const totalOpenAmount = 27800
    const totalOverdueAmount = 7400

    const status = {
      total_invoices: totalInvoices,
      open_invoices: openInvoices,
      overdue_invoices: overdueInvoices,
      paid_invoices: paidInvoices,
      total_open_amount: totalOpenAmount,
      total_overdue_amount: totalOverdueAmount,
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error('Error fetching status:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden des Status' },
      { status: 500 }
    )
  }
}

