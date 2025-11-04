export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  amount: number;
  net_amount: number;
  tax_amount: number;
  currency: string;
  issue_date: Date;
  due_date: Date;
  status: 'paid' | 'open' | 'overdue' | 'cancelled';
  source: 'sevdesk' | 'reonic';
  source_id: string;
  payment_date?: Date;
  reminder_level: number;
  created_at: Date;
  updated_at: Date;
}

export interface InvoiceCreateDTO {
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  amount: number;
  net_amount: number;
  tax_amount: number;
  currency: string;
  issue_date: Date;
  due_date: Date;
  source: 'sevdesk' | 'reonic';
  source_id: string;
}

export interface InvoiceStatus {
  total_invoices: number;
  open_invoices: number;
  overdue_invoices: number;
  paid_invoices: number;
  total_open_amount: number;
  total_overdue_amount: number;
}

