'use client'

import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { useCart } from '@/components/cart-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type CheckoutPayload = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
type CheckoutOrder = { keyId: string; providerOrderId: string; localOrderId: string; amount: number; currency: string; email: string }
type CheckoutOptions = {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill: { name: string; email: string; contact: string }
  theme: { color: string }
  handler: (response: CheckoutPayload) => void
  modal: { ondismiss: () => void }
}
type CheckoutInstance = { open: () => void; on: (event: 'payment.failed', handler: (response: { error?: { description?: string } }) => void) => void }

declare global {
  interface Window { Razorpay?: new (options: CheckoutOptions) => CheckoutInstance }
}

const messageForError: Record<string, string> = {
  payment_setup_required: 'Online payment is not configured yet. Please try again later.',
  payment_setup_or_provider_error: 'The payment service is unavailable right now. Please try again shortly.',
  sign_in_required: 'Sign in to your customer account before checkout.',
  shipping_details_required: 'Enter a valid delivery name, phone, address, city, state, and six-digit PIN code.',
  product_unavailable: 'One or more items are no longer available in the selected quantity. Review your cart and try again.',
  order_save_failed: 'We could not save this order. Please try again.',
  order_total_too_low: 'The order total is below the payment provider minimum.',
}

export function RazorpayCheckout({ userEmail }: { userEmail: string }) {
  const { items, clearCart } = useCart()
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [scriptReady, setScriptReady] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const Razorpay = window.Razorpay
    if (!scriptReady || !Razorpay) {
      setError('Secure checkout is still loading. Please wait a moment and try again.')
      return
    }
    if (!items.length) return

    setPending(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const shipping = {
      name: String(form.get('name') ?? ''),
      phone: String(form.get('phone') ?? ''),
      addressLine1: String(form.get('addressLine1') ?? ''),
      addressLine2: String(form.get('addressLine2') ?? ''),
      city: String(form.get('city') ?? ''),
      state: String(form.get('state') ?? ''),
      postalCode: String(form.get('postalCode') ?? ''),
    }

    try {
      const createResponse = await fetch('/api/payments/razorpay/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map(({ id, quantity }) => ({ product_id: id, quantity })), shipping }),
      })
      const orderResult = await createResponse.json() as CheckoutOrder & { error?: string }
      if (!createResponse.ok) {
        setError(messageForError[orderResult.error ?? ''] ?? 'We could not start checkout. Please review your details and try again.')
        setPending(false)
        return
      }

      const instance = new Razorpay({
        key: orderResult.keyId,
        amount: orderResult.amount,
        currency: orderResult.currency,
        name: 'ADRENAX',
        description: 'Store order',
        order_id: orderResult.providerOrderId,
        prefill: { name: shipping.name, email: orderResult.email, contact: shipping.phone },
        theme: { color: '#c44dff' },
        modal: { ondismiss: () => setPending(false) },
        handler: async (payment) => {
          setError('Verifying your payment…')
          try {
            const verifyResponse = await fetch('/api/payments/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payment),
            })
            const result = await verifyResponse.json() as { status?: string; orderId?: string; error?: string }
            if (result.status === 'paid' || result.status === 'processing' || result.status === 'refund_required') {
              clearCart()
              router.push(`/checkout/success?order=${encodeURIComponent(result.orderId ?? orderResult.localOrderId)}`)
              return
            }
            setError('We could not confirm this payment yet. Check your profile orders before trying to pay again.')
            setPending(false)
          } catch {
            setError('Payment confirmation is delayed. Check your profile orders before trying to pay again.')
            setPending(false)
          }
        },
      })
      instance.on('payment.failed', () => {
        setError('The payment did not complete. Your cart is still saved; you can try again.')
        setPending(false)
      })
      instance.open()
    } catch {
      setError('We could not connect to secure checkout. Please try again shortly.')
      setPending(false)
    }
  }

  return <>
    <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onReady={() => setScriptReady(true)} onError={() => setError('Secure checkout could not load. Refresh the page and try again.')} />
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div className="border-t border-white/10 pt-5">
        <h4 className="text-sm font-semibold">Delivery details</h4>
        <p className="mt-1 text-xs text-white/35">Payment receipt will be sent to {userEmail}.</p>
        <div className="mt-4 space-y-3">
          <Input name="name" autoComplete="name" maxLength={100} required placeholder="Full name" aria-label="Full name" />
          <Input name="phone" type="tel" autoComplete="tel" maxLength={24} required placeholder="Indian mobile number" aria-label="Indian mobile number" />
          <Input name="addressLine1" autoComplete="address-line1" maxLength={160} required placeholder="Address line 1" aria-label="Address line 1" />
          <Input name="addressLine2" autoComplete="address-line2" maxLength={160} placeholder="Apartment, landmark (optional)" aria-label="Apartment or landmark, optional" />
          <div className="grid grid-cols-2 gap-3">
            <Input name="city" autoComplete="address-level2" maxLength={80} required placeholder="City" aria-label="City" />
            <Input name="state" autoComplete="address-level1" maxLength={80} required placeholder="State" aria-label="State" />
          </div>
          <Input name="postalCode" inputMode="numeric" autoComplete="postal-code" maxLength={6} minLength={6} pattern="[0-9]{6}" required placeholder="PIN code" aria-label="Six-digit PIN code" />
        </div>
      </div>
      {error && <p role="status" className={`text-sm ${error.startsWith('Verifying') ? 'text-white/55' : 'text-red-300'}`}>{error}</p>}
      <Button className="w-full" disabled={pending || !items.length}>
        {pending ? 'Opening secure checkout…' : <>Pay securely <ArrowRight size={15} /></>}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-white/35"><LockKeyhole size={12} /> Payments are processed securely by Razorpay</p>
    </form>
  </>
}
