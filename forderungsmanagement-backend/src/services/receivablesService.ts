import pool from '../config/database';
import { Invoice, InvoiceStatus } from '../models/Invoice';
import logger from '../utils/logger';

export class ReceivablesService {
  
  async getAllReceivables(status?: string): Promise<Invoice[]> {
    try {
      let query = 'SELECT * FROM invoices';
      const params: any[] = [];
      
      if (status) {
        query += ' WHERE status = $1';
        params.push(status);
      }
      
      query += ' ORDER BY due_date ASC';
      
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching receivables:', error);
      throw error;
    }
  }

  async getReceivableById(id: string): Promise<Invoice | null> {
    try {
      const result = await pool.query('SELECT * FROM invoices WHERE id = $1', [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching receivable by id:', error);
      throw error;
    }
  }

  async getReceivablesStatus(): Promise<InvoiceStatus> {
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_invoices,
          COUNT(*) FILTER (WHERE status = 'open') as open_invoices,
          COUNT(*) FILTER (WHERE status = 'overdue') as overdue_invoices,
          COUNT(*) FILTER (WHERE status = 'paid') as paid_invoices,
          COALESCE(SUM(amount) FILTER (WHERE status = 'open'), 0) as total_open_amount,
          COALESCE(SUM(amount) FILTER (WHERE status = 'overdue'), 0) as total_overdue_amount
        FROM invoices
      `);
      
      return {
        total_invoices: parseInt(result.rows[0].total_invoices),
        open_invoices: parseInt(result.rows[0].open_invoices),
        overdue_invoices: parseInt(result.rows[0].overdue_invoices),
        paid_invoices: parseInt(result.rows[0].paid_invoices),
        total_open_amount: parseFloat(result.rows[0].total_open_amount),
        total_overdue_amount: parseFloat(result.rows[0].total_overdue_amount),
      };
    } catch (error) {
      logger.error('Error fetching receivables status:', error);
      throw error;
    }
  }

  async updateInvoiceStatus(id: string, status: string): Promise<void> {
    try {
      await pool.query(
        'UPDATE invoices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [status, id]
      );
      logger.info(`Invoice ${id} status updated to ${status}`);
    } catch (error) {
      logger.error('Error updating invoice status:', error);
      throw error;
    }
  }

  calculateStatus(dueDate: Date, paymentDate?: Date): string {
    if (paymentDate) {
      return 'paid';
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    if (due < today) {
      return 'overdue';
    }
    
    return 'open';
  }
}

export default new ReceivablesService();

