'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/utils/supabase/admin'

export async function addCollectionAction(formData: FormData) {
  const { supabase } = await requireAdmin()
  const name = String(formData.get('name') ?? '').trim().replace(/\s+/g, ' ')

  if (name.length < 2 || name.length > 80) redirect('/admin/collections?notice=invalid')

  const { data: existing, error: lookupError } = await supabase.from('categories').select('name')
  if (lookupError) redirect('/admin/collections?notice=error')
  if ((existing ?? []).some((category) => category.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase())) {
    redirect('/admin/collections?notice=duplicate')
  }

  const { error } = await supabase.from('categories').insert({ name })
  if (error) redirect('/admin/collections?notice=error')

  revalidatePath('/admin/collections')
  revalidatePath('/admin/products')
  revalidatePath('/admin/products/add')
  revalidatePath('/collections')
  revalidatePath('/')
  redirect('/admin/collections?notice=added')
}
