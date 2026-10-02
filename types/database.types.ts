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
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
