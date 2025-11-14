// Cashflow TypeScript Interfaces

export interface DailyData {
  date: string // Format: "2025-11-15"
  dateLabel: string // Format: "Mo 11.11"
  weekday: string // Format: "Montag"
  erwarteteEinnahmen: number // Expected income from pending invoices
  bezahlt: number // Actual income from paid invoices
  offen: number // Still open
  ueberfaellig: number // Overdue amount
  anzahlRechnungen: number // Total invoice count
  isToday: boolean // Is this today?
  isWeekend: boolean // Is this weekend?
}

export interface CashflowSummary {
  totalExpected: number // Total expected in next 14 days
  totalOpen: number // Total open in next 14 days
  totalOverdue: number // Total overdue in next 14 days
  todayExpected: number // Expected today
  tomorrowExpected: number // Expected tomorrow
  thisWeekExpected: number // Expected this week (7 days)
  nextWeekExpected: number // Expected next week (days 8-14)
}

export interface CashflowData {
  dailyData: DailyData[]
  summary: CashflowSummary
  period: {
    from: string // Start date (today)
    to: string // End date (14 days from today)
  }
}

// Legacy types for backwards compatibility (deprecated)
export interface MonthlyData {
  month: string
  monthLabel: string
  erwarteteEinnahmen: number
  tatsaechlicheEinnahmen: number
  offeneForderungen: number
  ueberfaellig: number
  anzahlRechnungen: number
  erfolgsrate: number
}

export type TimePeriod = '2weeks' // Only 2-week view now

export interface CashflowApiResponse {
  success: boolean
  data?: CashflowData
  error?: string
}


