export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: Date;
  payment_method: 'bank_transfer' | 'card' | 'cash' | 'other';
  reference: string;
  source: 'sevdesk' | 'reonic' | 'manual';
  source_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentCreateDTO {
  invoice_id: string;
  amount: number;
  payment_date: Date;
  payment_method: 'bank_transfer' | 'card' | 'cash' | 'other';
  reference: string;
  source: 'sevdesk' | 'reonic' | 'manual';
  source_id?: string;
}

