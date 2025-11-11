// Invoice TypeScript Interfaces

export interface Invoice {
  id: string
  external_id: string
  invoice_number: string
  customer_name: string
  customer_address: string | null
  amount: number
  status: 'pending' | 'paid' | 'overdue'
  invoice_date: string
  due_date: string
  source: string
  reminder_count: number
  last_reminder_sent: string | null
  pdf_url: string | null
  pdf_generated_at: string | null
  created_at: string
  // customer_email removed - NOT stored in database
}

export interface InvoiceStats {
  total_invoices: number
  open_invoices: number
  overdue_invoices: number
  paid_invoices: number
  total_open_amount: number
  total_overdue_amount: number
}

// Für API Responses
export interface ApiResponse<T> {
  data?: T
  error?: string
}

