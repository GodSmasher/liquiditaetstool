/**
 * Payment Matching Algorithm
 * 
 * Calculates confidence score (0-100) for matching a payment to an invoice
 * Based on:
 * - Amount match (50 points)
 * - Date proximity (30 points)
 * - Reference text match (20 points)
 */

interface Payment {
  amount: number
  date: string
  reference?: string | null
}

interface Invoice {
  amount: number
  due_date: string
  invoice_number: string
}

export function calculateMatchScore(payment: Payment, invoice: Invoice): number {
  let score = 0

  // 1. Exact amount match: 50 points
  if (Math.abs(payment.amount - invoice.amount) < 0.01) {
    score += 50
  }

  // 2. Date proximity: up to 30 points
  const daysDiff = Math.abs(daysBetween(payment.date, invoice.due_date))
  if (daysDiff <= 7) {
    score += 30
  } else if (daysDiff <= 14) {
    score += 20
  } else if (daysDiff <= 30) {
    score += 10
  }

  // 3. Reference contains invoice number: 20 points
  if (payment.reference && invoice.invoice_number) {
    const reference = payment.reference.toLowerCase()
    const invoiceNumber = invoice.invoice_number.toLowerCase()
    
    // Check if invoice number appears in reference
    if (reference.includes(invoiceNumber)) {
      score += 20
    } else {
      // Check for partial matches (e.g., "RE-2943" vs "2943")
      const invoiceNumberDigits = invoiceNumber.replace(/\D/g, '')
      if (invoiceNumberDigits.length >= 4 && reference.includes(invoiceNumberDigits)) {
        score += 15
      }
    }
  }

  return Math.min(score, 100) // Cap at 100
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Find best matching invoice for a payment
 */
export function findBestMatch(
  payment: Payment,
  invoices: Invoice[]
): { invoice: Invoice; score: number } | null {
  let bestMatch: { invoice: Invoice; score: number } | null = null

  for (const invoice of invoices) {
    const score = calculateMatchScore(payment, invoice)
    
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { invoice, score }
    }
  }

  // Only return matches with reasonable confidence (> 40%)
  if (bestMatch && bestMatch.score > 40) {
    return bestMatch
  }

  return null
}

/**
 * Find all possible matches for a payment (for uncertain cases)
 */
export function findPossibleMatches(
  payment: Payment,
  invoices: Invoice[],
  minScore: number = 40
): Array<{ invoice: Invoice; score: number }> {
  const matches: Array<{ invoice: Invoice; score: number }> = []

  for (const invoice of invoices) {
    const score = calculateMatchScore(payment, invoice)
    
    if (score >= minScore) {
      matches.push({ invoice, score })
    }
  }

  // Sort by score descending
  return matches.sort((a, b) => b.score - a.score)
}

/**
 * Classify confidence level
 */
export function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 95) return 'high'
  if (score >= 70) return 'medium'
  return 'low'
}

