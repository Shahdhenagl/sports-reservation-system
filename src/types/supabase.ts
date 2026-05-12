export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          phone: string | null
          role: 'admin' | 'staff'
          created_at: string
        }
        Insert: {
          id: string
          name: string
          phone?: string | null
          role?: 'admin' | 'staff'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          role?: 'admin' | 'staff'
          created_at?: string
        }
      }
      branches: {
        Row: {
          id: string
          name: string
          address: string
          phone: string | null
          opening_hours: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          phone?: string | null
          opening_hours?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          phone?: string | null
          opening_hours?: Json | null
          created_at?: string
        }
      }
      courts: {
        Row: {
          id: string
          branch_id: string
          name: string
          sport_type: 'football' | 'padel' | 'other'
          default_duration: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          branch_id: string
          name: string
          sport_type: 'football' | 'padel' | 'other'
          default_duration?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          branch_id?: string
          name?: string
          sport_type?: 'football' | 'padel' | 'other'
          default_duration?: number
          is_active?: boolean
          created_at?: string
        }
      }
      pricing_rules: {
        Row: {
          id: string
          court_id: string
          day_of_week: number
          start_time: string
          end_time: string
          price: number
          deposit_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          court_id: string
          day_of_week: number
          start_time: string
          end_time: string
          price: number
          deposit_amount?: number
          created_at?: string
        }
        Update: {
          id?: string
          court_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          price?: number
          deposit_amount?: number
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          booking_code: string
          branch_id: string
          court_id: string
          customer_name: string
          customer_phone: string
          start_datetime: string
          end_datetime: string
          duration: number
          total_price: number
          deposit_amount: number
          payment_method: 'instapay' | 'cash' | null
          payment_status: 'pending' | 'paid' | 'failed'
          booking_status: 'pending_payment' | 'confirmed' | 'cancelled' | 'expired' | 'completed' | 'no_show'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_code: string
          branch_id: string
          court_id: string
          customer_name: string
          customer_phone: string
          start_datetime: string
          end_datetime: string
          duration: number
          total_price: number
          deposit_amount?: number
          payment_method?: 'instapay' | 'cash' | null
          payment_status?: 'pending' | 'paid' | 'failed'
          booking_status?: 'pending_payment' | 'confirmed' | 'cancelled' | 'expired' | 'completed' | 'no_show'
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_code?: string
          branch_id?: string
          court_id?: string
          customer_name?: string
          customer_phone?: string
          start_datetime?: string
          end_datetime?: string
          duration?: number
          total_price?: number
          deposit_amount?: number
          payment_method?: 'instapay' | 'cash' | null
          payment_status?: 'pending' | 'paid' | 'failed'
          booking_status?: 'pending_payment' | 'confirmed' | 'cancelled' | 'expired' | 'completed' | 'no_show'
          notes?: string | null
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          method: string
          amount: number
          transaction_reference: string | null
          screenshot_url: string | null
          status: 'pending' | 'confirmed' | 'rejected'
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          method: string
          amount: number
          transaction_reference?: string | null
          screenshot_url?: string | null
          status?: 'pending' | 'confirmed' | 'rejected'
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          method?: string
          amount?: number
          transaction_reference?: string | null
          screenshot_url?: string | null
          status?: 'pending' | 'confirmed' | 'rejected'
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
      }
      blocked_slots: {
        Row: {
          id: string
          court_id: string
          start_datetime: string
          end_datetime: string
          reason: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          court_id: string
          start_datetime: string
          end_datetime: string
          reason?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          court_id?: string
          start_datetime?: string
          end_datetime?: string
          reason?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      settings: {
        Row: {
          id: number
          app_name: string
          logo_url: string | null
          whatsapp_number: string | null
          instapay_id: string | null
          instapay_name: string | null
          deposit_percentage: number
          cash_on_arrival_enabled: boolean
          updated_at: string
        }
        Insert: {
          id?: number
          app_name?: string
          logo_url?: string | null
          whatsapp_number?: string | null
          instapay_id?: string | null
          instapay_name?: string | null
          deposit_percentage?: number
          cash_on_arrival_enabled?: boolean
          updated_at?: string
        }
        Update: {
          id?: number
          app_name?: string
          logo_url?: string | null
          whatsapp_number?: string | null
          instapay_id?: string | null
          instapay_name?: string | null
          deposit_percentage?: number
          cash_on_arrival_enabled?: boolean
          updated_at?: string
        }
      }
    }
  }
}
