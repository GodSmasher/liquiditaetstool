export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const invoiceId = params.id

    // Finde die Rechnung (erst nach invoice_number, dann nach UUID)
    let { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_number', invoiceId)
      .single()

    if (error || !invoice) {
      const result = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single()
      
      invoice = result.data
      error = result.error
    }

    if (error || !invoice) {
      return NextResponse.json(
        { error: 'Rechnung nicht gefunden' },
        { status: 404 }
      )
    }

    // Check if PDF already exists in storage
    if (invoice.pdf_url) {
      try {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('invoice-pdfs')
          .download(invoice.pdf_url);

        if (!downloadError && fileData) {
          const arrayBuffer = await fileData.arrayBuffer();
          return new NextResponse(new Uint8Array(arrayBuffer), {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="Rechnung-${invoice.invoice_number}.pdf"`
            }
          });
        }
      } catch (err) {
        console.log('Existing PDF not found, generating new one');
      }
    }

    // Generate new PDF
    const pdfBuffer = await generateInvoicePDF(invoice);

    // Upload to Supabase Storage
    const fileName = `${invoice.invoice_number}-${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from('invoice-pdfs')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      // Continue anyway, return PDF even if upload fails
    } else {
      // Update invoice with PDF URL
      await supabase
        .from('invoices')
        .update({
          pdf_url: fileName,
          pdf_generated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);
    }

    // Return PDF (convert Buffer to Uint8Array for NextResponse)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Rechnung-${invoice.invoice_number}.pdf"`
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PDF Generation Function
async function generateInvoicePDF(invoice: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header with Company Logo Area
    doc
      .fontSize(24)
      .fillColor('#F59E0B')
      .text('RECHNUNG', { align: 'center' })
      .fillColor('#000000')
      .moveDown();

    // Company Info
    doc
      .fontSize(10)
      .text('Volta Energietechnik GmbH', { align: 'right' })
      .text('Musterstraße 123', { align: 'right' })
      .text('04105 Leipzig', { align: 'right' })
      .text('Tel: +49 (0) 123 456789', { align: 'right' })
      .text('info@volta-solaranlagen.de', { align: 'right' })
      .moveDown(2);

    // Invoice Header Info
    const infoStartY = doc.y;
    doc
      .fontSize(10)
      .text(`Rechnungsnummer:`, 50, infoStartY, { continued: true })
      .font('Helvetica-Bold')
      .text(` ${invoice.invoice_number}`)
      .font('Helvetica');

    doc
      .text(`Rechnungsdatum:`, 50, doc.y, { continued: true })
      .font('Helvetica-Bold')
      .text(` ${formatDate(invoice.created_at)}`)
      .font('Helvetica');

    doc
      .text(`Fälligkeitsdatum:`, 50, doc.y, { continued: true })
      .font('Helvetica-Bold')
      .fillColor(invoice.status === 'overdue' ? '#DC2626' : '#000000')
      .text(` ${formatDate(invoice.due_date)}`)
      .fillColor('#000000')
      .font('Helvetica');

    doc.moveDown(2);

    // Customer Info
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Rechnungsempfänger:', 50, doc.y)
      .font('Helvetica')
      .fontSize(10)
      .text(invoice.customer_name || 'Unbekannt', 50, doc.y)
      .moveDown(3);

    // Table Header
    const tableTop = doc.y;
    doc
      .rect(50, tableTop, 500, 30)
      .fillAndStroke('#F59E0B', '#F59E0B');

    doc
      .fillColor('#000000')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Position', 60, tableTop + 10, { width: 250 })
      .text('Menge', 320, tableTop + 10, { width: 60, align: 'right' })
      .text('Einzelpreis', 390, tableTop + 10, { width: 70, align: 'right' })
      .text('Gesamt', 470, tableTop + 10, { width: 70, align: 'right' })
      .font('Helvetica');

    // Table Content
    let yPosition = tableTop + 40;
    
    // Simplified: One line item (you can expand this based on your data structure)
    doc
      .fontSize(10)
      .text('Leistungen gemäß Auftragsbestätigung', 60, yPosition, { width: 250 })
      .text('1', 320, yPosition, { width: 60, align: 'right' })
      .text(`${formatCurrency(invoice.amount)}`, 390, yPosition, { width: 70, align: 'right' })
      .text(`${formatCurrency(invoice.amount)}`, 470, yPosition, { width: 70, align: 'right' });

    yPosition += 30;

    // Total Line
    doc
      .moveTo(50, yPosition)
      .lineTo(550, yPosition)
      .stroke();

    yPosition += 15;

    // Total Amount
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Gesamtbetrag:', 350, yPosition)
      .fillColor('#F59E0B')
      .fontSize(14)
      .text(`${formatCurrency(invoice.amount)}`, 470, yPosition - 2, { width: 80, align: 'right' })
      .fillColor('#000000')
      .font('Helvetica');

    yPosition += 50;

    // Payment Terms
    doc
      .fontSize(10)
      .text('Zahlungsbedingungen:', 50, yPosition)
      .font('Helvetica')
      .text('Zahlbar innerhalb von 14 Tagen ohne Abzug.', 50, doc.y)
      .moveDown();

    // Bank Details
    doc
      .font('Helvetica-Bold')
      .text('Bankverbindung:', 50, doc.y)
      .font('Helvetica')
      .text('IBAN: DE89 3704 0044 0532 0130 00', 50, doc.y)
      .text('BIC: COBADEFFXXX', 50, doc.y)
      .text('Bank: Commerzbank AG', 50, doc.y)
      .moveDown(2);

    // Footer
    doc
      .fontSize(8)
      .fillColor('#666666')
      .text(
        'Geschäftsführer: Max Mustermann | Handelsregister: Amtsgericht Leipzig HRB 12345',
        50,
        doc.page.height - 100,
        { align: 'center', width: 500 }
      )
      .text(
        'USt-IdNr.: DE123456789 | Steuernummer: 123/456/78901',
        50,
        doc.y,
        { align: 'center', width: 500 }
      )
      .moveDown()
      .fillColor('#F59E0B')
      .text('Vielen Dank für Ihr Vertrauen!', { align: 'center', width: 500 })
      .fillColor('#000000');

    doc.end();
  });
}

// Helper Functions
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(numAmount);
}