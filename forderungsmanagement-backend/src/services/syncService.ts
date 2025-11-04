import pool from '../config/database';
import sevdeskConnector from '../connectors/sevdeskConnector';
import reonicConnector from '../connectors/reonicConnector';
import receivablesService from './receivablesService';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class SyncService {
  
  async syncAllData(): Promise<{ invoices: number; payments: number }> {
    logger.info('🔄 Starting synchronization...');
    
    const startTime = Date.now();
    let invoiceCount = 0;
    let paymentCount = 0;

    try {
      // Sync SevDesk invoices
      const sevdeskInvoices = await this.syncSevDeskInvoices();
      invoiceCount += sevdeskInvoices;
      logger.info(`✅ Synced ${sevdeskInvoices} SevDesk invoices`);

      // Sync Reonic invoices
      const reonicInvoices = await this.syncReonicInvoices();
      invoiceCount += reonicInvoices;
      logger.info(`✅ Synced ${reonicInvoices} Reonic invoices`);

      // Update all invoice statuses
      await this.updateAllInvoiceStatuses();
      logger.info('✅ Updated invoice statuses');

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`✅ Sync completed in ${duration}s: ${invoiceCount} invoices, ${paymentCount} payments`);

      return { invoices: invoiceCount, payments: paymentCount };
    } catch (error) {
      logger.error('❌ Sync failed:', error);
      throw error;
    }
  }

  private async syncSevDeskInvoices(): Promise<number> {
    try {
      const invoices = await sevdeskConnector.fetchInvoices();
      let count = 0;

      for (const invoice of invoices) {
        await this.upsertInvoice({
          id: uuidv4(),
          invoice_number: invoice.invoiceNumber,
          customer_id: invoice.contact.id,
          customer_name: invoice.contact.name,
          amount: invoice.sumGross,
          net_amount: invoice.sumNet,
          tax_amount: invoice.sumTax,
          currency: invoice.currency,
          issue_date: new Date(invoice.invoiceDate),
          due_date: new Date(invoice.dueDate),
          source: 'sevdesk',
          source_id: invoice.id,
        });
        count++;
      }

      return count;
    } catch (error) {
      logger.error('Error syncing SevDesk invoices:', error);
      throw error;
    }
  }

  private async syncReonicInvoices(): Promise<number> {
    try {
      const invoices = await reonicConnector.fetchInvoices();
      let count = 0;

      for (const invoice of invoices) {
        await this.upsertInvoice({
          id: uuidv4(),
          invoice_number: invoice.invoice_number,
          customer_id: invoice.customer.id,
          customer_name: invoice.customer.name,
          amount: invoice.amount,
          net_amount: invoice.net_amount,
          tax_amount: invoice.tax_amount,
          currency: invoice.currency,
          issue_date: new Date(invoice.issue_date),
          due_date: new Date(invoice.due_date),
          source: 'reonic',
          source_id: invoice.id,
        });
        count++;
      }

      return count;
    } catch (error) {
      logger.error('Error syncing Reonic invoices:', error);
      throw error;
    }
  }

  private async upsertInvoice(data: any): Promise<void> {
    const client = await pool.connect();
    try {
      // Check if invoice exists by source_id
      const existing = await client.query(
        'SELECT id FROM invoices WHERE source = $1 AND source_id = $2',
        [data.source, data.source_id]
      );

      const status = receivablesService.calculateStatus(data.due_date, data.payment_date);

      if (existing.rows.length > 0) {
        // Update existing invoice
        await client.query(
          `UPDATE invoices SET 
            invoice_number = $1,
            customer_id = $2,
            customer_name = $3,
            amount = $4,
            net_amount = $5,
            tax_amount = $6,
            currency = $7,
            issue_date = $8,
            due_date = $9,
            status = $10,
            updated_at = CURRENT_TIMESTAMP
          WHERE source = $11 AND source_id = $12`,
          [
            data.invoice_number,
            data.customer_id,
            data.customer_name,
            data.amount,
            data.net_amount,
            data.tax_amount,
            data.currency,
            data.issue_date,
            data.due_date,
            status,
            data.source,
            data.source_id,
          ]
        );
      } else {
        // Insert new invoice
        await client.query(
          `INSERT INTO invoices (
            id, invoice_number, customer_id, customer_name,
            amount, net_amount, tax_amount, currency,
            issue_date, due_date, status, source, source_id,
            reminder_level, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            uuidv4(),
            data.invoice_number,
            data.customer_id,
            data.customer_name,
            data.amount,
            data.net_amount,
            data.tax_amount,
            data.currency,
            data.issue_date,
            data.due_date,
            status,
            data.source,
            data.source_id,
          ]
        );
      }
    } finally {
      client.release();
    }
  }

  private async updateAllInvoiceStatuses(): Promise<void> {
    const client = await pool.connect();
    try {
      const invoices = await client.query(
        'SELECT id, due_date, payment_date FROM invoices WHERE status != $1',
        ['paid']
      );

      for (const invoice of invoices.rows) {
        const status = receivablesService.calculateStatus(
          invoice.due_date,
          invoice.payment_date
        );
        await receivablesService.updateInvoiceStatus(invoice.id, status);
      }
    } finally {
      client.release();
    }
  }
}

export default new SyncService();

