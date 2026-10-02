import { createClient as createSessionClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import type { Json } from '@/types/database.types'
import { getRazorpayConfig, razorpayRequest } from '@/utils/razorpay'

export const runtime = 'nodejs'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
type CartLine = { product_id: string; quantity: number }
type RazorpayOrder = { id: string; amount: number; currency: string }

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

export async function POST(request: Request) {
  const config = getRazorpayConfig()
  if (!config || !config.webhookSecret) return Response.json({ error: 'payment_setup_required' }, { status: 503 })

  const sessionClient = await createSessionClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!user || !user.email) return Response.json({ error: 'sign_in_required' }, { status: 401 })

  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const rawItems = body?.items
  const rawShipping = body?.shipping
  if (!Array.isArray(rawItems) || rawItems.length < 1 || rawItems.length > 30 || !rawShipping || typeof rawShipping !== 'object') {
    return Response.json({ error: 'invalid_checkout' }, { status: 400 })
  }

  const items: CartLine[] = []
  for (const item of rawItems) {
    if (!item || typeof item !== 'object') return Response.json({ error: 'invalid_checkout' }, { status: 400 })
    const productId = (item as Record<string, unknown>).product_id
    const quantity = (item as Record<string, unknown>).quantity
    if (typeof productId !== 'string' || !uuidPattern.test(productId) || typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      return Response.json({ error: 'invalid_checkout' }, { status: 400 })
    }
    items.push({ product_id: productId, quantity })
  }
  if (new Set(items.map((item) => item.product_id)).size !== items.length) return Response.json({ error: 'invalid_checkout' }, { status: 400 })

  const shippingInput = rawShipping as Record<string, unknown>
  const shipping = {
    email: user.email,
    name: cleanText(shippingInput.name, 100),
    phone: cleanText(shippingInput.phone, 24),
    address_line_1: cleanText(shippingInput.addressLine1, 160),
    address_line_2: cleanText(shippingInput.addressLine2, 160),
    city: cleanText(shippingInput.city, 80),
    state: cleanText(shippingInput.state, 80),
    postal_code: cleanText(shippingInput.postalCode, 12),
    country: 'IN',
  }
  const phoneDigits = shipping.phone.replace(/\D/g, '')
  if (!shipping.name || !shipping.address_line_1 || !shipping.city || !shipping.state || !/^\d{6}$/.test(shipping.postal_code) || !(/^[6-9]\d{9}$/.test(phoneDigits) || /^91[6-9]\d{9}$/.test(phoneDigits))) {
    return Response.json({ error: 'shipping_details_required' }, { status: 400 })
  }
  shipping.phone = phoneDigits.length === 12 ? `+${phoneDigits}` : phoneDigits

  try {
    const serviceClient = createServiceClient()
    const productIds = items.map((item) => item.product_id)
    const { data: products, error: productError } = await serviceClient
      .from('products')
      .select('id,name,price,stock_quantity,is_deleted')
      .in('id', productIds)

    if (productError || !products || products.length !== items.length) return Response.json({ error: 'product_unavailable' }, { status: 409 })

    const productById = new Map(products.map((product) => [product.id, product]))
    let amountPaise = 0
    for (const item of items) {
      const product = productById.get(item.product_id)
      if (!product || product.is_deleted || product.stock_quantity < item.quantity) return Response.json({ error: 'product_unavailable' }, { status: 409 })
      const pricePaise = Math.round(Number(product.price) * 100)
      if (!Number.isSafeInteger(pricePaise) || pricePaise < 0) return Response.json({ error: 'invalid_product_price' }, { status: 409 })
      amountPaise += pricePaise * item.quantity
    }
    if (!Number.isSafeInteger(amountPaise) || amountPaise < 100) return Response.json({ error: 'order_total_too_low' }, { status: 400 })

    const providerOrder = await razorpayRequest<RazorpayOrder>('/orders', {
      method: 'POST',
      body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt: crypto.randomUUID() }),
    })
    if (providerOrder.amount !== amountPaise || providerOrder.currency !== 'INR') throw new Error('Razorpay order amount did not match the server total.')

    const { data: localOrderId, error: saveError } = await serviceClient.rpc('create_adrenax_order', {
      p_user_id: user.id,
      p_razorpay_order_id: providerOrder.id,
      p_amount_paise: amountPaise,
      p_shipping_address: shipping as unknown as Json,
      p_items: items as unknown as Json,
    })
    if (saveError || !localOrderId) {
      const message = saveError?.message ?? ''
      const status = /product_unavailable|amount_changed/i.test(message) ? 409 : 500
      return Response.json({ error: status === 409 ? 'product_unavailable' : 'order_save_failed' }, { status })
    }

    return Response.json({
      keyId: config.keyId,
      providerOrderId: providerOrder.id,
      localOrderId,
      amount: providerOrder.amount,
      currency: providerOrder.currency,
      email: user.email,
    })
  } catch (error) {
    console.error('Razorpay order creation failed', error)
    return Response.json({ error: 'payment_setup_or_provider_error' }, { status: 503 })
  }
}
