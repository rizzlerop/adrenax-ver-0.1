import { CartPage } from '@/components/cart-page'
import { createClient } from '@/utils/supabase/server'
import { getSupabaseConfig } from '@/utils/supabase/env'
export const metadata = { title: 'Your bag' }
export default async function CartRoute() {
  let userEmail: string | null = null
  if (getSupabaseConfig()) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    userEmail = user?.email ?? null
  }
  return <CartPage userEmail={userEmail} />
}
