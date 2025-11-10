'use client'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface FormData {
  invoice_number: string
  customer_name: string
  customer_email: string
  customer_address: string
  amount: string
  due_date: string
  status: 'paid' | 'pending' | 'overdue'
  description: string
  tax_rate: string
}

export default function NeueRechnungPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<FormData>({
    invoice_number: `RE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
    customer_name: '',
    customer_email: '',
    customer_address: '',
    amount: '',
    due_date: '',
    status: 'pending',
    description: '',
    tax_rate: '19',
  })

  const [errors, setErrors] = useState<Partial<FormData>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user types
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.invoice_number.trim()) {
      newErrors.invoice_number = 'Rechnungsnummer ist erforderlich'
    }

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Kundenname ist erforderlich'
    }

    if (!formData.customer_email.trim()) {
      newErrors.customer_email = 'E-Mail ist erforderlich'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      newErrors.customer_email = 'Ungültige E-Mail-Adresse'
    }

    if (!formData.amount.trim()) {
      newErrors.amount = 'Betrag ist erforderlich'
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Betrag muss eine positive Zahl sein'
    }

    if (!formData.due_date) {
      newErrors.due_date = 'Fälligkeitsdatum ist erforderlich'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const amount = Number(formData.amount)
      const taxRate = Number(formData.tax_rate) / 100
      const netAmount = amount / (1 + taxRate)
      const taxAmount = amount - netAmount

      const invoiceData = {
        invoice_number: formData.invoice_number,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_address: formData.customer_address,
        amount: amount,
        net_amount: netAmount,
        tax_amount: taxAmount,
        tax_rate: Number(formData.tax_rate),
        due_date: formData.due_date,
        status: formData.status,
        description: formData.description,
        created_at: new Date().toISOString(),
      }

      const { error: insertError } = await supabase
        .from('invoices')
        .insert([invoiceData])

      if (insertError) {
        throw insertError
      }

      setSuccess(true)
      
      // Redirect nach 2 Sekunden
      setTimeout(() => {
        router.push('/dashboard/rechnungen')
      }, 2000)

    } catch (err: any) {
      console.error('Error creating invoice:', err)
      setError(err.message || 'Fehler beim Erstellen der Rechnung')
    } finally {
      setLoading(false)
    }
  }

  const calculateGross = () => {
    if (!formData.amount || !formData.tax_rate) return { net: 0, tax: 0, gross: 0 }
    
    const gross = Number(formData.amount)
    const taxRate = Number(formData.tax_rate) / 100
    const net = gross / (1 + taxRate)
    const tax = gross - net
    
    return { net, tax, gross }
  }

  const { net, tax, gross } = calculateGross()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  if (success) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-12 text-center border-2 border-green-200">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Rechnung erfolgreich erstellt!</h2>
          <p className="text-gray-600 mb-6">Die Rechnung wurde erfolgreich gespeichert.</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => router.push('/dashboard/rechnungen')}
              className="px-6 py-3 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-400 transition-all shadow-md font-medium"
            >
              Zur Rechnungsübersicht
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-900 text-amber-500 rounded-lg hover:bg-gray-800 transition-all shadow-md font-medium"
            >
              Weitere Rechnung erstellen
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Neue Rechnung erstellen</h1>
          <p className="mt-2 text-gray-600">Erstelle eine neue Rechnung für deinen Kunden</p>
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Zurück
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rechnungsinformationen */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            Rechnungsinformationen
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rechnungsnummer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechnungsnummer *
              </label>
              <input
                type="text"
                name="invoice_number"
                value={formData.invoice_number}
                onChange={handleChange}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all ${
                  errors.invoice_number ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="RE-2024-0001"
              />
              {errors.invoice_number && (
                <p className="mt-1 text-sm text-red-600">{errors.invoice_number}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              >
                <option value="pending">Ausstehend</option>
                <option value="paid">Bezahlt</option>
                <option value="overdue">Überfällig</option>
              </select>
            </div>
          </div>
        </div>

        {/* Kundeninformationen */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            Kundeninformationen
          </h2>
          
          <div className="space-y-4">
            {/* Kundenname */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kundenname *
              </label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all ${
                  errors.customer_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Max Mustermann GmbH"
              />
              {errors.customer_name && (
                <p className="mt-1 text-sm text-red-600">{errors.customer_name}</p>
              )}
            </div>

            {/* E-Mail */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-Mail-Adresse *
              </label>
              <input
                type="email"
                name="customer_email"
                value={formData.customer_email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all ${
                  errors.customer_email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="kunde@beispiel.de"
              />
              {errors.customer_email && (
                <p className="mt-1 text-sm text-red-600">{errors.customer_email}</p>
              )}
            </div>

            {/* Adresse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse (optional)
              </label>
              <textarea
                name="customer_address"
                value={formData.customer_address}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                placeholder="Musterstraße 123&#10;12345 Musterstadt"
              />
            </div>
          </div>
        </div>

        {/* Rechnungsdetails */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Rechnungsdetails
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bruttobetrag */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bruttobetrag (inkl. MwSt.) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-gray-500">€</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  className={`w-full pl-8 pr-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            {/* MwSt.-Satz */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MwSt.-Satz *
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="tax_rate"
                  value={formData.tax_rate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                />
                <span className="absolute right-4 top-2.5 text-gray-500">%</span>
              </div>
            </div>

            {/* Fälligkeitsdatum */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fälligkeitsdatum *
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all ${
                  errors.due_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.due_date && (
                <p className="mt-1 text-sm text-red-600">{errors.due_date}</p>
              )}
            </div>

            {/* Berechnung Anzeige */}
            <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Berechnung:</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nettobetrag:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(net)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">MwSt. ({formData.tax_rate}%):</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-amber-300">
                  <span className="font-semibold text-gray-900">Bruttobetrag:</span>
                  <span className="font-bold text-amber-700">{formatCurrency(gross)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Beschreibung */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beschreibung / Leistungen (optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              placeholder="Beschreibe die erbrachten Leistungen..."
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-400 transition-all shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                Wird erstellt...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Rechnung erstellen
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

