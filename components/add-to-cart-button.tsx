'use client'

import { useState } from 'react'
import { Check, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/components/cart-provider'

export function AddToCartButton({ item, disabled = false }: { item: { id: string; name: string; price: number; image_url: string | null; stock_quantity: number }; disabled?: boolean }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  return <Button disabled={disabled} className="w-full sm:w-auto" onClick={() => { addItem(item); setAdded(true); window.setTimeout(() => setAdded(false), 1600) }}>{added ? <Check size={17} /> : <ShoppingBag size={17} />}{added ? 'Added to bag' : 'Add to bag'}</Button>
}
