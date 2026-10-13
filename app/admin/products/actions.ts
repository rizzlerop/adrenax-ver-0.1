'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/utils/supabase/admin'

function productFields(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const rawPrice = formData.get('price')
  const rawStock = formData.get('stock_quantity')
  if (typeof rawPrice !== 'string' || !rawPrice.trim() || typeof rawStock !== 'string' || !rawStock.trim()) return null
  const price = Number(rawPrice)
  const stock = Number(rawStock)
  const categoryValue = String(formData.get('category_id') ?? '')
  if (!name || name.length > 120 || !description || description.length > 5000 || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) return null
  return { name, description, price, stock_quantity: stock, category_id: categoryValue || null }
}

async function uploadProductImage(supabase: Awaited<ReturnType<typeof requireAdmin>>['supabase'], file: File) {
  if (file.size > 4 * 1024 * 1024) throw new Error('image-too-large')
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) throw new Error('image-type')
  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp'
  const path = `${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from('product-images').upload(path, file, { contentType: file.type, cacheControl: '3600', upsert: false })
  if (error) throw new Error('image-upload')
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
}

export async function addProductAction(formData: FormData) {
  const { supabase } = await requireAdmin()
  const fields = productFields(formData)
  if (!fields) redirect('/admin/products/add?error=fields')
  const collectionMode = String(formData.get('collection_mode') ?? 'existing')
  let newCollectionName = ''
  if (collectionMode === 'new') {
    newCollectionName = String(formData.get('new_collection_name') ?? '').trim().replace(/\s+/g, ' ')
    if (newCollectionName.length < 2 || newCollectionName.length > 80) redirect('/admin/products/add?error=collection-name')
    const { data: categories, error: categoryLookupError } = await supabase.from('categories').select('name')
    if (categoryLookupError) redirect('/admin/products/add?error=collection-save')
    if ((categories ?? []).some((category) => category.name.trim().toLocaleLowerCase() === newCollectionName.toLocaleLowerCase())) {
      redirect('/admin/products/add?error=collection-exists')
    }
  } else if (collectionMode !== 'existing') {
    redirect('/admin/products/add?error=fields')
  }
  const image = formData.get('image')
  if (!(image instanceof File) || image.size === 0) redirect('/admin/products/add?error=image-required')

  let imageUrl: string
  try { imageUrl = await uploadProductImage(supabase, image) }
  catch (error) {
    const code = error instanceof Error ? error.message : 'image-upload'
    redirect(`/admin/products/add?error=${encodeURIComponent(code)}`)
  }

  let categoryId = fields.category_id
  let createdCategoryId: string | undefined
  if (collectionMode === 'new') {
    const { data: newCategory, error: categoryError } = await supabase.from('categories').insert({ name: newCollectionName }).select('id').single()
    if (categoryError || !newCategory) {
      await supabase.storage.from('product-images').remove([new URL(imageUrl).pathname.split('/').slice(-1)[0]])
      redirect('/admin/products/add?error=collection-save')
    }
    categoryId = newCategory.id
    createdCategoryId = newCategory.id
  }

  const { error } = await supabase.from('products').insert({ ...fields, category_id: categoryId, image_url: imageUrl, is_deleted: false })
  if (error) {
    const pathname = new URL(imageUrl).pathname.split('/').slice(-1)[0]
    await supabase.storage.from('product-images').remove([pathname])
    if (createdCategoryId) await supabase.from('categories').delete().eq('id', createdCategoryId)
    redirect('/admin/products/add?error=save')
  }
  revalidatePath('/')
  revalidatePath('/shop')
  revalidatePath('/collections')
  if (fields.category_id) revalidatePath(`/collections/${fields.category_id}`)
  revalidatePath('/admin')
  revalidatePath('/admin/products')
  if (createdCategoryId) revalidatePath('/admin/collections')
  redirect('/admin/products?notice=added')
}

export async function updateProductAction(formData: FormData) {
  const { supabase } = await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const fields = productFields(formData)
  if (!id) redirect('/admin/products')
  if (!fields) redirect(`/admin/products/${id}/edit?error=fields`)

  const image = formData.get('image')
  let imageUrl: string | undefined
  if (image instanceof File && image.size > 0) {
    try { imageUrl = await uploadProductImage(supabase, image) }
    catch (error) {
      const code = error instanceof Error ? error.message : 'image-upload'
      redirect(`/admin/products/${id}/edit?error=${encodeURIComponent(code)}`)
    }
  }
  const { data: previousProduct } = await supabase.from('products').select('category_id').eq('id', id).maybeSingle()
  const { error } = await supabase.from('products').update({ ...fields, ...(imageUrl ? { image_url: imageUrl } : {}) }).eq('id', id).eq('is_deleted', false)
  if (error) redirect(`/admin/products/${id}/edit?error=save`)
  revalidatePath('/')
  revalidatePath('/shop')
  revalidatePath('/collections')
  if (fields.category_id) revalidatePath(`/collections/${fields.category_id}`)
  if (previousProduct?.category_id) revalidatePath(`/collections/${previousProduct.category_id}`)
  revalidatePath(`/shop/${id}`)
  revalidatePath('/admin')
  revalidatePath('/admin/products')
  redirect('/admin/products?notice=updated')
}

export async function softDeleteProductAction(formData: FormData) {
  const { supabase } = await requireAdmin()
  const id = String(formData.get('id') ?? '')
  if (!id) redirect('/admin/products?notice=error')
  const { error } = await supabase.from('products').update({ is_deleted: true }).eq('id', id).eq('is_deleted', false)
  if (error) redirect('/admin/products?notice=error')
  revalidatePath('/')
  revalidatePath('/shop')
  revalidatePath(`/shop/${id}`)
  revalidatePath('/admin')
  revalidatePath('/admin/products')
  redirect('/admin/products?notice=deleted')
}
