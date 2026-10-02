import { notFound } from 'next/navigation'
import { ProductForm } from '@/components/admin/product-form'
import { requireAdmin } from '@/utils/supabase/admin'

export const metadata = { title: 'Edit product' }
type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }

export default async function EditProductPage({ params, searchParams }: Props) {
  const [{ id }, query, { supabase }] = await Promise.all([params, searchParams, requireAdmin()])
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from('products').select('id,name,description,price,stock_quantity,image_url,category_id').eq('id', id).eq('is_deleted', false).maybeSingle(),
    supabase.from('categories').select('id,name').order('name'),
  ])
  if (!product) notFound()
  return <ProductForm categories={categories ?? []} product={product} error={query.error} />
}
