export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 60 // Cache for 60 seconds

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateInvoiceStatus } from '@/lib/utils/invoice-helpers'
import type { DailyData, CashflowData, CashflowSummary } from '@/lib/types/cashflow'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Fetch all invoices
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .order('due_date', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { success: false, error: 'Fehler beim Laden der Rechnungen' },
        { status: 500 }
      )
    }

    if (!invoices || invoices.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          dailyData: [],
          summary: {
            totalExpected: 0,
            totalOpen: 0,
            totalOverdue: 0,
            todayExpected: 0,
            tomorrowExpected: 0,
            thisWeekExpected: 0,
            nextWeekExpected: 0
          },
          period: {
            from: new Date().toISOString().split('T')[0],
            to: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        }
      })
    }

    // Calculate date range: next 14 days
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const twoWeeksFromNow = new Date(today)
    twoWeeksFromNow.setDate(today.getDate() + 14)

    // Process invoices with calculated status
    const processedInvoices = invoices.map(invoice => ({
      ...invoice,
      calculatedStatus: calculateInvoiceStatus({
        status: invoice.status,
        due_date: invoice.due_date
      }),
      amount: parseFloat(invoice.amount as any)
    }))

    // Filter: Only invoices with due_date in next 14 days
    const relevantInvoices = processedInvoices.filter(invoice => {
      const dueDate = new Date(invoice.due_date)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate >= today && dueDate <= twoWeeksFromNow
    })

    // Generate all days in the 14-day period
    const dailyMap: Record<string, DailyData> = {}
    const todayStr = today.toISOString().split('T')[0]
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      const weekday = date.toLocaleDateString('de-DE', { weekday: 'long' })
      const weekdayShort = date.toLocaleDateString('de-DE', { weekday: 'short' })
      const day = date.getDate()
      const month = date.getMonth() + 1
      const dateLabel = `${weekdayShort} ${day}.${month.toString().padStart(2, '0')}`
      
      const isToday = i === 0
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

      dailyMap[dateStr] = {
        date: dateStr,
        dateLabel,
        weekday,
        erwarteteEinnahmen: 0,
        bezahlt: 0,
        offen: 0,
        ueberfaellig: 0,
        anzahlRechnungen: 0,
        isToday,
        isWeekend
      }
    }

    // Aggregate invoices into days
    relevantInvoices.forEach(invoice => {
      const dueDate = new Date(invoice.due_date)
      dueDate.setHours(0, 0, 0, 0)
      const dateStr = dueDate.toISOString().split('T')[0]
      
      // Skip if date is not in our range
      if (!dailyMap[dateStr]) return

      const amount = invoice.amount
      dailyMap[dateStr].anzahlRechnungen++

      if (invoice.calculatedStatus === 'paid') {
        dailyMap[dateStr].bezahlt += amount
        dailyMap[dateStr].erwarteteEinnahmen += amount // Paid is part of expected
      } else if (invoice.calculatedStatus === 'pending') {
        dailyMap[dateStr].erwarteteEinnahmen += amount
        dailyMap[dateStr].offen += amount
      } else if (invoice.calculatedStatus === 'overdue') {
        dailyMap[dateStr].erwarteteEinnahmen += amount
        dailyMap[dateStr].ueberfaellig += amount
        dailyMap[dateStr].offen += amount
      }
    })

    // Convert to array and sort by date
    const dailyData = Object.values(dailyMap).sort((a, b) => 
      a.date.localeCompare(b.date)
    )

    // Calculate summary statistics
    const totalExpected = dailyData.reduce((sum, d) => sum + d.erwarteteEinnahmen, 0)
    const totalOpen = dailyData.reduce((sum, d) => sum + d.offen, 0)
    const totalOverdue = dailyData.reduce((sum, d) => sum + d.ueberfaellig, 0)
    
    // Today and tomorrow
    const todayData = dailyData.find(d => d.isToday)
    const tomorrowData = dailyData.find((d, i) => i === 1)
    const todayExpected = todayData?.erwarteteEinnahmen || 0
    const tomorrowExpected = tomorrowData?.erwarteteEinnahmen || 0

    // This week (first 7 days) and next week (days 8-14)
    const thisWeekExpected = dailyData.slice(0, 7).reduce((sum, d) => sum + d.erwarteteEinnahmen, 0)
    const nextWeekExpected = dailyData.slice(7, 14).reduce((sum, d) => sum + d.erwarteteEinnahmen, 0)

    const summary: CashflowSummary = {
      totalExpected,
      totalOpen,
      totalOverdue,
      todayExpected,
      tomorrowExpected,
      thisWeekExpected,
      nextWeekExpected
    }

    const cashflowData: CashflowData = {
      dailyData,
      summary,
      period: {
        from: today.toISOString().split('T')[0],
        to: twoWeeksFromNow.toISOString().split('T')[0]
      }
    }

    // Debug output in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Cashflow Daily Data:', dailyData.length, 'days')
      console.log('Today:', todayData)
      console.log('Summary:', summary)
      console.log('═══════════════════════════════')
    }

    return NextResponse.json({
      success: true,
      data: cashflowData
    })

  } catch (error) {
    console.error('Error in cashflow API:', error)
    return NextResponse.json(
      { success: false, error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
