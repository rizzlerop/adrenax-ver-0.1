'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { getSupabaseConfig } from './env'

let client: SupabaseClient<Database> | undefined

export function createClient() {
  if (client) return client
  const config = getSupabaseConfig()
  if (!config) throw new Error('Add your Supabase URL and publishable key to .env.local.')
  client = createBrowserClient<Database>(config.url, config.key)
  return client
}
