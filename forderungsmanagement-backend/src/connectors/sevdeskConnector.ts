import axios, { AxiosInstance } from 'axios';
import logger from '../utils/logger';

export class SevDeskConnector {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.SEVDESK_API_URL || 'https://my.sevdesk.de/api/v1',
      headers: {
        'Authorization': process.env.SEVDESK_API_KEY || '',
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  async fetchInvoices(): Promise<any[]> {
    try {
      logger.info('Fetching invoices from SevDesk...');
      
      // TODO: Implementierung mit echter API
      // const response = await this.api.get('/Invoice');
      // return response.data.objects || [];
      
      // Dummy-Daten für Entwicklung
      return [
        {
          id: 'sevdesk_1',
          invoiceNumber: 'SV-2024-0012',
          contact: { name: 'Musterfirma GmbH', id: 'sevdesk_customer_1' },
          sumGross: 4200,
          sumNet: 3529.41,
          sumTax: 670.59,
          invoiceDate: '2024-10-15',
          dueDate: '2024-11-15',
          status: 100, // 100 = Draft, 200 = Open, 1000 = Paid
          currency: 'EUR',
        },
        {
          id: 'sevdesk_2',
          invoiceNumber: 'SV-2024-0013',
          contact: { name: 'Tech Solutions AG', id: 'sevdesk_customer_2' },
          sumGross: 8500,
          sumNet: 7142.86,
          sumTax: 1357.14,
          invoiceDate: '2024-10-20',
          dueDate: '2024-11-20',
          status: 200,
          currency: 'EUR',
        },
      ];
    } catch (error) {
      logger.error('Error fetching SevDesk invoices:', error);
      throw error;
    }
  }

  async fetchPayments(invoiceId: string): Promise<any[]> {
    try {
      logger.info(`Fetching payments for invoice ${invoiceId} from SevDesk...`);
      
      // TODO: Implementierung mit echter API
      // const response = await this.api.get(`/Invoice/${invoiceId}/getPayments`);
      // return response.data.objects || [];
      
      return [];
    } catch (error) {
      logger.error('Error fetching SevDesk payments:', error);
      throw error;
    }
  }
}

export default new SevDeskConnector();

