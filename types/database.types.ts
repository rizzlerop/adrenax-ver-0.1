export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: { id: string; name: string; created_at: string }
        Insert: { id?: string; name: string; created_at?: string }
        Update: { id?: string; name?: string; created_at?: string }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          stock_quantity: number
          image_url: string | null
          category_id: string | null
          is_deleted: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          stock_quantity?: number
          image_url?: string | null
          category_id?: string | null
          is_deleted?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          stock_quantity?: number
          image_url?: string | null
          category_id?: string | null
          is_deleted?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      user_roles: {
        Row: { id: string; is_admin: boolean }
        Insert: { id: string; is_admin?: boolean }
        Update: { id?: string; is_admin?: boolean }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          user_id: string
          razorpay_order_id: string
          razorpay_payment_id: string | null
          amount_paise: number
          currency: string
          status: string
          shipping_address: Json
          created_at: string
          paid_at: string | null
          refunded_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          amount_paise: number
          currency?: string
          status?: string
          shipping_address: Json
          created_at?: string
          paid_at?: string | null
          refunded_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          amount_paise?: number
          currency?: string
          status?: string
          shipping_address?: Json
          created_at?: string
          paid_at?: string | null
          refunded_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          unit_price_paise: number
          quantity: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          unit_price_paise: number
          quantity: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          unit_price_paise?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      create_adrenax_order: {
        Args: {
          p_user_id: string
          p_razorpay_order_id: string
          p_amount_paise: number
          p_shipping_address: Json
          p_items: Json
        }
        Returns: string
      }
      complete_adrenax_order: {
        Args: {
          p_razorpay_order_id: string
          p_payment_id: string
          p_amount_paise: number
          p_currency: string
        }
        Returns: Json
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
