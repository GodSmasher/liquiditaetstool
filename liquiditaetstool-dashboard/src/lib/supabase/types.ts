// Supabase Database Types
export type Database = {
  public: {
    Tables: {
      invoices: {
        Row: {
          id: string
          invoice_number: string
          customer_name: string
          amount: number
          due_date: string
          status: 'paid' | 'pending' | 'overdue'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
      }
      offers: {
        Row: {
          id: string
          offer_number: string
          customer_name: string
          amount: number
          offer_date: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['offers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['offers']['Insert']>
      }
    }
  }
}

