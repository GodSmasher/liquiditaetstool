// Cashflow TypeScript Interfaces

export interface MonthlyData {
  month: string // Format: "2025-11"
  monthLabel: string // Format: "Nov 2025"
  erwarteteEinnahmen: number // Expected income from pending invoices
  tatsaechlicheEinnahmen: number // Actual income from paid invoices
  offeneForderungen: number // Still open
  ueberfaellig: number // Overdue amount
  anzahlRechnungen: number // Total invoice count
  erfolgsrate: number // Percentage of paid vs expected
}

export interface CashflowSummary {
  totalPending: number
  totalPaid: number
  totalOverdue: number
  riskPercentage: number
  paidThisMonth: number
  avgInvoiceAmount: number
}

export interface CashflowData {
  monthlyData: MonthlyData[]
  summary: CashflowSummary
  period: {
    startDate: string
    endDate: string
    months: number
  }
}

export type TimePeriod = '3months' | '6months' | '12months' | 'ytd'

export interface CashflowApiResponse {
  success: boolean
  data?: CashflowData
  error?: string
}

