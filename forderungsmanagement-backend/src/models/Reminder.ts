export interface Reminder {
  id: string;
  invoice_id: string;
  level: number; // 1 = erste Mahnung, 2 = zweite Mahnung, 3 = letzte Mahnung
  sent_date: Date;
  due_date: Date;
  amount: number;
  fee: number;
  status: 'sent' | 'pending' | 'cancelled';
  source: 'sevdesk' | 'reonic' | 'manual';
  created_at: Date;
  updated_at: Date;
}

export interface ReminderCreateDTO {
  invoice_id: string;
  level: number;
  sent_date: Date;
  due_date: Date;
  amount: number;
  fee: number;
  source: 'sevdesk' | 'reonic' | 'manual';
}

export interface ReminderConfig {
  level_1_days: number; // z.B. 7 Tage nach Fälligkeit
  level_2_days: number; // z.B. 14 Tage nach Fälligkeit
  level_3_days: number; // z.B. 21 Tage nach Fälligkeit
  fee_level_1: number;
  fee_level_2: number;
  fee_level_3: number;
}

