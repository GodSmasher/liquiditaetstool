// liquiditaetstool-dashboard/src/app/api/forderungen/[id]/send-reminder/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const invoiceId = params.id;
    
    // Parse request body
    const body = await request.json();
    const { recipientEmail, customMessage } = body;

    // Validate email
    if (!recipientEmail || !recipientEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Ungültige E-Mail-Adresse' },
        { status: 400 }
      );
    }

    // Fetch invoice data
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) {
      return NextResponse.json(
        { error: 'Rechnung nicht gefunden' },
        { status: 404 }
      );
    }

    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Rechnung ist bereits bezahlt' },
        { status: 400 }
      );
    }

    // Determine reminder level
    const reminderLevel = (invoice.reminder_count || 0) + 1;

    // Check if we should send (max 3 reminders)
    if (reminderLevel > 3) {
      return NextResponse.json(
        { error: 'Maximale Anzahl an Mahnungen erreicht' },
        { status: 400 }
      );
    }

    // Prepare email content
    const emailSubject = getReminderSubject(reminderLevel, invoice.invoice_number);
    const emailBody = getReminderBody(reminderLevel, invoice, customMessage);

    // Send email via Resend
    try {
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'rechnungen@volta-solaranlagen.de',
        to: recipientEmail,
        subject: emailSubject,
        html: emailBody,
      });

      if (emailError) {
        console.error('Email error:', emailError);
        return NextResponse.json(
          { error: 'E-Mail konnte nicht versendet werden', details: emailError },
          { status: 500 }
        );
      }

      // Update invoice with reminder count
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          reminder_count: reminderLevel,
          last_reminder_sent: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (updateError) {
        console.error('Update error:', updateError);
      }

      // Log reminder in database
      const { error: logError } = await supabase
        .from('invoice_reminders')
        .insert({
          invoice_id: invoiceId,
          reminder_level: reminderLevel,
          sent_via: 'email',
          email_to: recipientEmail,
          status: 'sent',
          notes: customMessage || null
        });

      if (logError) {
        console.error('Log error:', logError);
      }

      return NextResponse.json({
        success: true,
        message: `${getReminderLevelText(reminderLevel)} erfolgreich versendet`,
        reminderLevel,
        emailId: emailData?.id,
        sentTo: recipientEmail
      });

    } catch (emailErr: any) {
      console.error('Email sending failed:', emailErr);
      return NextResponse.json(
        { error: 'E-Mail konnte nicht versendet werden', details: emailErr.message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper Functions
function getReminderLevelText(level: number): string {
  const texts = {
    1: 'Zahlungserinnerung',
    2: '1. Mahnung',
    3: '2. Mahnung'
  };
  return texts[level as keyof typeof texts] || 'Mahnung';
}

function getReminderSubject(level: number, invoiceNumber: string): string {
  const subjects = {
    1: `Zahlungserinnerung - Rechnung ${invoiceNumber}`,
    2: `1. Mahnung - Rechnung ${invoiceNumber}`,
    3: `2. Mahnung - Letzte Aufforderung - Rechnung ${invoiceNumber}`
  };
  return subjects[level as keyof typeof subjects] || `Mahnung - Rechnung ${invoiceNumber}`;
}

function getReminderBody(level: number, invoice: any, customMessage?: string): string {
  const dueDate = formatDate(invoice.due_date);
  const amount = formatCurrency(invoice.amount);
  const invoiceNumber = invoice.invoice_number;
  const customerName = invoice.customer_name || 'Sehr geehrte Damen und Herren';

  const templates = {
    1: generateTemplate1(customerName, invoiceNumber, amount, dueDate, customMessage),
    2: generateTemplate2(customerName, invoiceNumber, amount, dueDate, customMessage),
    3: generateTemplate3(customerName, invoiceNumber, amount, dueDate, customMessage)
  };

  return templates[level as keyof typeof templates] || templates[1];
}

function generateTemplate1(customerName: string, invoiceNumber: string, amount: string, dueDate: string, customMessage?: string): string {
  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: #F59E0B; color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px 20px; background-color: #ffffff; }
        .highlight { background-color: #FEF3C7; padding: 20px; border-left: 4px solid #F59E0B; margin: 20px 0; }
        .highlight strong { color: #92400E; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; background-color: #F9FAFB; border-top: 1px solid #E5E7EB; }
        p { margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Zahlungserinnerung</h1>
        </div>
        <div class="content">
          <p>${customerName},</p>
          <p>wir möchten Sie freundlich an die Zahlung der folgenden Rechnung erinnern:</p>
          <div class="highlight">
            <p><strong>Rechnungsnummer:</strong> ${invoiceNumber}</p>
            <p><strong>Betrag:</strong> ${amount}</p>
            <p><strong>Fälligkeitsdatum:</strong> ${dueDate}</p>
          </div>
          ${customMessage ? `<p><em>${customMessage}</em></p>` : ''}
          <p>Falls Sie die Rechnung bereits beglichen haben, betrachten Sie diese E-Mail bitte als gegenstandslos.</p>
          <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
          <p><strong>Mit freundlichen Grüßen</strong><br>Ihr Volta Energietechnik Team</p>
        </div>
        <div class="footer">
          <p><strong>Volta Energietechnik GmbH</strong></p>
          <p>Musterstraße 123 | 04105 Leipzig</p>
          <p>Tel: +49 (0) 123 456789 | info@volta-solaranlagen.de</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateTemplate2(customerName: string, invoiceNumber: string, amount: string, dueDate: string, customMessage?: string): string {
  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: #DC2626; color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px 20px; background-color: #ffffff; }
        .highlight { background-color: #FEE2E2; padding: 20px; border-left: 4px solid #DC2626; margin: 20px 0; }
        .highlight strong { color: #991B1B; }
        .warning { background-color: #FEF3C7; padding: 15px; margin: 20px 0; border: 2px solid #F59E0B; border-radius: 5px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; background-color: #F9FAFB; border-top: 1px solid #E5E7EB; }
        p { margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ 1. Mahnung</h1>
        </div>
        <div class="content">
          <p>${customerName},</p>
          <p>leider haben wir trotz Zahlungserinnerung noch keinen Zahlungseingang feststellen können.</p>
          <div class="highlight">
            <p><strong>Rechnungsnummer:</strong> ${invoiceNumber}</p>
            <p><strong>Offener Betrag:</strong> ${amount}</p>
            <p><strong>Ursprüngliches Fälligkeitsdatum:</strong> ${dueDate}</p>
          </div>
          <div class="warning">
            <p><strong>⏰ Wir bitten Sie, den Betrag innerhalb von 7 Tagen zu begleichen.</strong></p>
          </div>
          ${customMessage ? `<p><em>${customMessage}</em></p>` : ''}
          <p>Sollte die Zahlung bereits erfolgt sein, betrachten Sie diese Mahnung bitte als gegenstandslos.</p>
          <p><strong>Mit freundlichen Grüßen</strong><br>Ihr Volta Energietechnik Team</p>
        </div>
        <div class="footer">
          <p><strong>Volta Energietechnik GmbH</strong></p>
          <p>Musterstraße 123 | 04105 Leipzig</p>
          <p>Tel: +49 (0) 123 456789 | info@volta-solaranlagen.de</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateTemplate3(customerName: string, invoiceNumber: string, amount: string, dueDate: string, customMessage?: string): string {
  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: #991B1B; color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px 20px; background-color: #ffffff; }
        .highlight { background-color: #FEE2E2; padding: 20px; border-left: 4px solid #991B1B; margin: 20px 0; }
        .highlight strong { color: #7F1D1D; }
        .warning { background-color: #FEF3C7; padding: 20px; margin: 20px 0; border: 3px solid #DC2626; border-radius: 5px; }
        .warning strong { color: #DC2626; font-size: 16px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; background-color: #F9FAFB; border-top: 1px solid #E5E7EB; }
        p { margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 2. Mahnung - Letzte Aufforderung</h1>
        </div>
        <div class="content">
          <p>${customerName},</p>
          <p>leider konnten wir trotz mehrfacher Zahlungserinnerung noch keinen Zahlungseingang verzeichnen.</p>
          <div class="highlight">
            <p><strong>Rechnungsnummer:</strong> ${invoiceNumber}</p>
            <p><strong>Offener Betrag:</strong> ${amount}</p>
            <p><strong>Ursprüngliches Fälligkeitsdatum:</strong> ${dueDate}</p>
          </div>
          <div class="warning">
            <p><strong>⚠️ WICHTIG: Dies ist unsere letzte Zahlungsaufforderung vor Einleitung rechtlicher Schritte.</strong></p>
            <p>Bitte begleichen Sie den offenen Betrag <strong>innerhalb von 5 Werktagen</strong>.</p>
            <p>Bei ausbleibender Zahlung sehen wir uns gezwungen, ein Inkassoverfahren einzuleiten.</p>
          </div>
          ${customMessage ? `<p><em>${customMessage}</em></p>` : ''}
          <p>Bei Zahlungsschwierigkeiten kontaktieren Sie uns bitte umgehend, um gemeinsam eine Lösung zu finden.</p>
          <p><strong>Mit freundlichen Grüßen</strong><br>Ihr Volta Energietechnik Team</p>
        </div>
        <div class="footer">
          <p><strong>Volta Energietechnik GmbH</strong></p>
          <p>Musterstraße 123 | 04105 Leipzig</p>
          <p>Tel: +49 (0) 123 456789 | info@volta-solaranlagen.de</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

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