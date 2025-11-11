// Helper Functions für Rechnungen

import { Invoice } from '../types/invoice'

/**
 * Berechnet den Status einer Rechnung basierend auf Fälligkeitsdatum
 */
export function calculateInvoiceStatus(invoice: {
  status: string
  due_date: string
}): 'paid' | 'pending' | 'overdue' {
  if (invoice.status === 'paid') return 'paid'
  
  const dueDate = new Date(invoice.due_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalisiere auf Tagesbeginn
  dueDate.setHours(0, 0, 0, 0)
  
  if (dueDate < today) return 'overdue'
  
  return 'pending'
}

/**
 * Formatiert Währungsbeträge im deutschen Format
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Formatiert Datum im deutschen Format (DD.MM.YYYY)
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Formatiert Datum und Uhrzeit im deutschen Format
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Berechnet Tage bis Fälligkeit
 */
export function getDaysUntilDue(dueDate: string): number {
  const today = new Date()
  const due = new Date(dueDate)
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  
  const diffTime = due.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Berechnet Tage überfällig
 */
export function getDaysOverdue(dueDate: string): number {
  const days = getDaysUntilDue(dueDate)
  return days < 0 ? Math.abs(days) : 0
}

