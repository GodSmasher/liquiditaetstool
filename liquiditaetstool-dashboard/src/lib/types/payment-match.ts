export interface PaymentMatch {
  id: string
  
  // Payment Info (from SevDesk transaction)
  payment_id: string
  payment_amount: number
  payment_date: string
  payment_reference?: string | null
  payment_account?: string | null
  
  // Suggested Match
  suggested_invoice_id?: string | null
  confidence_score?: number | null // 0-100
  
  // Manual Decision
  matched_invoice_id?: string | null
  matched_by?: string | null
  matched_at?: string | null
  status: 'pending' | 'matched' | 'ignored'
  
  // Meta
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface PaymentMatchWithInvoices extends PaymentMatch {
  suggested_invoice?: {
    id: string
    invoice_number: string
    customer_name: string
    amount: number
    due_date: string
  } | null
  matched_invoice?: {
    id: string
    invoice_number: string
    customer_name: string
  } | null
}

export interface PaymentMatchesResponse {
  pending: PaymentMatchWithInvoices[]
  matched: PaymentMatchWithInvoices[]
  ignored: PaymentMatchWithInvoices[]
  counts: {
    pending: number
    matched: number
    ignored: number
  }
}

export interface UpdateMatchRequest {
  matchId: string
  status?: 'matched' | 'ignored' | 'pending'
  invoiceId?: string | null
  notes?: string
}

