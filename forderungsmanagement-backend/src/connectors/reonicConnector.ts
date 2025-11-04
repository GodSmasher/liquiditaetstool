import axios, { AxiosInstance } from 'axios';
import logger from '../utils/logger';

export class ReonicConnector {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REONIC_API_URL || 'https://api.reonic.de/v1',
      headers: {
        'Authorization': `Bearer ${process.env.REONIC_API_KEY || ''}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  async fetchInvoices(): Promise<any[]> {
    try {
      logger.info('Fetching invoices from Reonic...');
      
      // TODO: Implementierung mit echter API
      // const response = await this.api.get('/invoices');
      // return response.data || [];
      
      // Dummy-Daten für Entwicklung
      return [
        {
          id: 'reonic_1',
          invoice_number: 'RE-2024-0501',
          customer: {
            id: 'reonic_customer_1',
            name: 'Solar Energy GmbH',
          },
          amount: 12500,
          net_amount: 10504.20,
          tax_amount: 1995.80,
          issue_date: '2024-10-25',
          due_date: '2024-11-25',
          status: 'open',
          currency: 'EUR',
        },
        {
          id: 'reonic_2',
          invoice_number: 'RE-2024-0502',
          customer: {
            id: 'reonic_customer_2',
            name: 'Green Power Systems',
          },
          amount: 6800,
          net_amount: 5714.29,
          tax_amount: 1085.71,
          issue_date: '2024-11-01',
          due_date: '2024-12-01',
          status: 'open',
          currency: 'EUR',
        },
      ];
    } catch (error) {
      logger.error('Error fetching Reonic invoices:', error);
      throw error;
    }
  }

  async fetchPayments(invoiceId: string): Promise<any[]> {
    try {
      logger.info(`Fetching payments for invoice ${invoiceId} from Reonic...`);
      
      // TODO: Implementierung mit echter API
      // const response = await this.api.get(`/invoices/${invoiceId}/payments`);
      // return response.data || [];
      
      return [];
    } catch (error) {
      logger.error('Error fetching Reonic payments:', error);
      throw error;
    }
  }
}

export default new ReonicConnector();

