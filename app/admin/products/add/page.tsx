import { ProductForm } from '@/components/admin/product-form'
import { requireAdmin } from '@/utils/supabase/admin'

export const metadata = { title: 'Add product' }
type Props = { searchParams: Promise<{ error?: string; category?: string }> }

export default async function AddProductPage({ searchParams }: Props) {
  const [{ supabase }, query] = await Promise.all([requireAdmin(), searchParams])
  const { data: categories } = await supabase.from('categories').select('id,name').order('name')
  const selectedCategory = (categories ?? []).find((category) => category.id === query.category)
  return <ProductForm categories={categories ?? []} error={query.error} defaultCategoryId={selectedCategory?.id} collectionName={selectedCategory?.name} />
}
