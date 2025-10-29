import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types für unsere Datenbank
export interface CashflowEntry {
  id: string;
  datum: string;
  bezeichnung: string;
  quelle: string;
  typ: 'Einnahme' | 'Ausgabe';
  status: 'Getätigt' | 'Geplant' | 'Angebot' | 'Risiko';
  brutto_betrag: number;
  wahrscheinlichkeit: number;
  gewichteter_betrag: number;
  referenz_id: string;
  created_at: string;
}

export interface LiquiditaetsSaldo {
  einnahmen_getaetigt: number;
  einnahmen_geplant: number;
  ausgaben_getaetigt: number;
  ausgaben_geplant: number;
  saldo_gesamt: number;
}

export interface Forecast14Tage {
  datum: string;
  bezeichnung: string;
  quelle: string;
  typ: 'Einnahme' | 'Ausgabe';
  status: string;
  brutto_betrag: number;
  wahrscheinlichkeit: number;
  gewichteter_betrag: number;
  referenz_id: string;
}