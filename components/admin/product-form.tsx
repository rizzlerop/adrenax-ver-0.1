import Link from 'next/link'
import { ArrowLeft, ImagePlus } from 'lucide-react'
import { Input, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { addProductAction, updateProductAction } from '@/app/admin/products/actions'
import { CollectionPicker } from '@/components/admin/collection-picker'

type Category = { id: string; name: string }
type Product = { id: string; name: string; description: string; price: number; stock_quantity: number; image_url: string | null; category_id: string | null }

export function ProductForm({ categories, product, error, defaultCategoryId, collectionName }: { categories: Category[]; product?: Product; error?: string; defaultCategoryId?: string; collectionName?: string }) {
  const action = product ? updateProductAction : addProductAction
  const errors: Record<string, string> = {
    fields: 'Check the product details and try again.',
    'collection-name': 'Enter a collection name between 2 and 80 characters.',
    'collection-exists': 'That collection already exists. Choose it from the existing collections option.',
    'collection-save': 'The collection could not be created. Please try again.',
    'image-required': 'Choose a product image before saving.',
    'image-too-large': 'Images must be 4 MB or smaller.',
    'image-type': 'Use a JPG, PNG, or WebP image.',
    'image-upload': 'The image upload failed. Check the product-images bucket and its storage policies.',
    save: 'The product could not be saved. Check your database policies and try again.',
  }
  return <div className="mx-auto max-w-3xl">
    <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white"><ArrowLeft size={15} /> Back to inventory</Link>
    <div className="mt-7"><p className="eyebrow">Inventory</p><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{product ? 'Edit product' : collectionName ? `Add to ${collectionName}` : 'Add a product'}</h1><p className="mt-2 text-sm text-white/40">Product details appear on the public storefront. You can choose or change its collection below.</p></div>
    <form action={action} className="mt-7 space-y-5 rounded-2xl border border-white/[.08] bg-panel p-5 sm:p-7">
      {product && <input type="hidden" name="id" value={product.id} />}
      {error && <p role="alert" className="rounded-xl border border-red-300/20 bg-red-200/[.05] px-4 py-3 text-sm text-red-100/80">{errors[error] ?? errors.save}</p>}
      <label className="block text-xs font-medium text-white/55">Product name<Input name="name" required maxLength={120} defaultValue={product?.name} placeholder="Everyday training tee" className="mt-2" /></label>
      <label className="block text-xs font-medium text-white/55">Description<Textarea name="description" required maxLength={5000} defaultValue={product?.description} placeholder="What makes this piece a keeper?" className="mt-2" /></label>
      <div className="grid gap-4 sm:grid-cols-2"><label className="block text-xs font-medium text-white/55">Price (INR)<Input name="price" type="number" min="0" step="0.01" required defaultValue={product?.price} placeholder="1499" className="mt-2" /></label><label className="block text-xs font-medium text-white/55">Stock quantity<Input name="stock_quantity" type="number" min="0" step="1" required defaultValue={product?.stock_quantity ?? 0} placeholder="24" className="mt-2" /></label></div>
      <CollectionPicker categories={categories} defaultCategoryId={product?.category_id ?? defaultCategoryId} allowNewCollection={!product} />
      <label className="block text-xs font-medium text-white/55">{product ? 'Replace product image (optional)' : 'Product image'}<span className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/15 bg-black/10 px-4 py-4 transition hover:border-neon/50"><ImagePlus className="shrink-0 text-neon" size={19} /><span className="min-w-0 flex-1"><span className="block truncate text-sm text-white/70">Choose JPG, PNG, or WebP</span><span className="mt-1 block text-xs text-white/30">Up to 4 MB</span></span><input name="image" type="file" accept="image/jpeg,image/png,image/webp" required={!product} className="sr-only" /></span></label>
      <div className="flex flex-col-reverse justify-end gap-3 border-t border-white/[.08] pt-5 sm:flex-row"><Link href="/admin/products" className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white/65 hover:text-white">Cancel</Link><Button type="submit">{product ? 'Save changes' : 'Save product'}</Button></div>
    </form>
  </div>
}
