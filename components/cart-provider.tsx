'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type CartItem = { id: string; name: string; price: number; image_url: string | null; quantity: number; stock_quantity: number }
type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  updateQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'adrenax-cart-v1'
const GUEST_STORAGE_KEY = `${STORAGE_KEY}:guest`

function readCart(key: string): CartItem[] {
  try {
    const saved = localStorage.getItem(key) ?? (key === GUEST_STORAGE_KEY ? localStorage.getItem(STORAGE_KEY) : null)
    const parsed: unknown = saved ? JSON.parse(saved) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is CartItem =>
      Boolean(item) &&
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.price === 'number' &&
      (typeof item.image_url === 'string' || item.image_url === null) &&
      typeof item.quantity === 'number' &&
      typeof item.stock_quantity === 'number'
    )
  } catch {
    return []
  }
}

function mergeCarts(accountItems: CartItem[], guestItems: CartItem[]): CartItem[] {
  const merged = new Map(accountItems.map((item) => [item.id, item]))
  for (const guestItem of guestItems) {
    const accountItem = merged.get(guestItem.id)
    const stockQuantity = accountItem
      ? Math.min(accountItem.stock_quantity, guestItem.stock_quantity)
      : guestItem.stock_quantity
    merged.set(guestItem.id, {
      ...(accountItem ?? guestItem),
      quantity: Math.min(stockQuantity, (accountItem?.quantity ?? 0) + guestItem.quantity),
      stock_quantity: stockQuantity,
    })
  }
  return [...merged.values()].filter((item) => item.quantity > 0 && item.stock_quantity > 0)
}

export function CartProvider({ children, userId }: { children: ReactNode; userId: string | null }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)
  const storageKey = userId ? `${STORAGE_KEY}:${userId}` : GUEST_STORAGE_KEY

  useEffect(() => {
    let saved = readCart(storageKey)
    if (userId) {
      const guestItems = readCart(GUEST_STORAGE_KEY)
      if (guestItems.length) {
        saved = mergeCarts(saved, guestItems)
        try {
          localStorage.setItem(storageKey, JSON.stringify(saved))
          localStorage.removeItem(GUEST_STORAGE_KEY)
          localStorage.removeItem(STORAGE_KEY)
        } catch {
          // Keep the in-memory cart available if browser storage is full or blocked.
        }
      }
    }
    setItems(saved)
    setReady(true)
  }, [storageKey, userId])

  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(items))
      } catch {
        // Keep the in-memory cart available if browser storage is full or blocked.
      }
    }
  }, [items, ready, storageKey])

  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    addItem(item, quantity = 1) {
      setItems((current) => {
        const existing = current.find((line) => line.id === item.id)
        const nextQuantity = Math.min(item.stock_quantity, (existing?.quantity ?? 0) + quantity)
        if (nextQuantity < 1) return current
        return existing
          ? current.map((line) => line.id === item.id ? { ...line, quantity: nextQuantity } : line)
          : [...current, { ...item, quantity: Math.min(quantity, item.stock_quantity) }]
      })
    },
    updateQuantity(id, quantity) {
      setItems((current) => current.flatMap((item) => item.id !== id ? [item] : quantity > 0 ? [{ ...item, quantity: Math.min(quantity, item.stock_quantity) }] : []))
    },
    removeItem(id) { setItems((current) => current.filter((item) => item.id !== id)) },
    clearCart() { setItems([]) },
  }), [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider')
  return context
}
