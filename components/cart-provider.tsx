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

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setItems(JSON.parse(saved) as CartItem[])
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, ready])

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
