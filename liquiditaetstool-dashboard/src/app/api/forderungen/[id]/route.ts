export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'

// Mock-Daten für einzelne Rechnungsdetails
const mockInvoiceDetails: Record<string, any> = {
  'SV-2024-0012': {
    id: 'SV-2024-0012',
    invoice_number: 'SV-2024-0012',
    customer_name: 'Musterfirma GmbH',
    amount: 4200,
    due_date: '2024-11-15',
    created_at: '2024-10-15T10:30:00Z',
    status: 'overdue',
    reminder_level: 1,
    source: 'sevdesk',
    customer_email: 'kontakt@musterfirma.de',
    customer_address: 'Musterstraße 123, 12345 Berlin',
    invoice_items: [
      { description: 'Beratungsleistung', quantity: 20, unit_price: 150, total: 3000 },
      { description: 'Projektmanagement', quantity: 8, unit_price: 150, total: 1200 }
    ],
    timeline: [
      { status: 'created', date: '2024-10-15T10:30:00Z', label: 'Erstellt' },
      { status: 'sent', date: '2024-10-15T14:20:00Z', label: 'Versendet' },
    ]
  },
  'SV-2024-0013': {
    id: 'SV-2024-0013',
    invoice_number: 'SV-2024-0013',
    customer_name: 'Tech Solutions AG',
    amount: 8500,
    due_date: '2024-12-20',
    created_at: '2024-10-20T09:15:00Z',
    status: 'open',
    reminder_level: 0,
    source: 'sevdesk',
    customer_email: 'info@techsolutions.com',
    customer_address: 'Technologiepark 45, 80331 München',
    invoice_items: [
      { description: 'Software-Entwicklung', quantity: 40, unit_price: 180, total: 7200 },
      { description: 'Code Review', quantity: 10, unit_price: 130, total: 1300 }
    ],
    timeline: [
      { status: 'created', date: '2024-10-20T09:15:00Z', label: 'Erstellt' },
      { status: 'sent', date: '2024-10-20T11:45:00Z', label: 'Versendet' },
    ]
  },
  'RE-2024-0501': {
    id: 'RE-2024-0501',
    invoice_number: 'RE-2024-0501',
    customer_name: 'Solar Energy GmbH',
    amount: 12500,
    due_date: '2024-11-25',
    created_at: '2024-10-25T08:00:00Z',
    status: 'open',
    reminder_level: 0,
    source: 'reonic',
    customer_email: 'buchhaltung@solar-energy.de',
    customer_address: 'Sonnenallee 89, 60314 Frankfurt',
    invoice_items: [
      { description: 'PV-Anlage Installation', quantity: 1, unit_price: 10000, total: 10000 },
      { description: 'Wartungsvertrag (1 Jahr)', quantity: 1, unit_price: 2500, total: 2500 }
    ],
    timeline: [
      { status: 'created', date: '2024-10-25T08:00:00Z', label: 'Erstellt' },
      { status: 'sent', date: '2024-10-25T10:30:00Z', label: 'Versendet' },
    ]
  },
  'RE-2024-0502': {
    id: 'RE-2024-0502',
    invoice_number: 'RE-2024-0502',
    customer_name: 'Green Power Systems',
    amount: 6800,
    due_date: '2024-12-01',
    created_at: '2024-10-28T13:45:00Z',
    status: 'open',
    reminder_level: 0,
    source: 'reonic',
    customer_email: 'info@greenpower.com',
    customer_address: 'Ökologieweg 12, 50667 Köln',
    invoice_items: [
      { description: 'Energieberatung', quantity: 16, unit_price: 200, total: 3200 },
      { description: 'Machbarkeitsstudie', quantity: 1, unit_price: 3600, total: 3600 }
    ],
    timeline: [
      { status: 'created', date: '2024-10-28T13:45:00Z', label: 'Erstellt' },
      { status: 'sent', date: '2024-10-28T15:00:00Z', label: 'Versendet' },
    ]
  },
  'SV-2024-0010': {
    id: 'SV-2024-0010',
    invoice_number: 'SV-2024-0010',
    customer_name: 'Energie Plus GmbH',
    amount: 3200,
    due_date: '2024-10-30',
    created_at: '2024-10-01T11:00:00Z',
    status: 'overdue',
    reminder_level: 2,
    source: 'sevdesk',
    customer_email: 'zahlung@energieplus.de',
    customer_address: 'Kraftwerkstraße 78, 20095 Hamburg',
    invoice_items: [
      { description: 'Wartung Windkraftanlage', quantity: 8, unit_price: 400, total: 3200 }
    ],
    timeline: [
      { status: 'created', date: '2024-10-01T11:00:00Z', label: 'Erstellt' },
      { status: 'sent', date: '2024-10-01T14:30:00Z', label: 'Versendet' },
      { status: 'reminder_1', date: '2024-11-07T10:00:00Z', label: '1. Mahnung' },
      { status: 'reminder_2', date: '2024-11-14T10:00:00Z', label: '2. Mahnung' },
    ]
  },
  'RE-2024-0499': {
    id: 'RE-2024-0499',
    invoice_number: 'RE-2024-0499',
    customer_name: 'Öko Systems AG',
    amount: 15000,
    due_date: '2024-10-15',
    created_at: '2024-09-15T09:00:00Z',
    status: 'paid',
    reminder_level: 0,
    source: 'reonic',
    customer_email: 'finanzen@oeko-systems.com',
    customer_address: 'Naturweg 34, 70173 Stuttgart',
    invoice_items: [
      { description: 'Solarthermie-System', quantity: 1, unit_price: 12000, total: 12000 },
      { description: 'Installation & Inbetriebnahme', quantity: 1, unit_price: 3000, total: 3000 }
    ],
    timeline: [
      { status: 'created', date: '2024-09-15T09:00:00Z', label: 'Erstellt' },
      { status: 'sent', date: '2024-09-15T11:00:00Z', label: 'Versendet' },
      { status: 'paid', date: '2024-10-10T14:22:00Z', label: 'Bezahlt' },
    ]
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
    // Rechnung aus Mock-Daten abrufen
    const invoice = mockInvoiceDetails[id]

    if (!invoice) {
      return NextResponse.json(
        { error: 'Rechnung nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Rechnung' },
      { status: 500 }
    )
  }
}

