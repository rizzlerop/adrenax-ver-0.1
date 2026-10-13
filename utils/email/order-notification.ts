import 'server-only'
import { createServiceClient } from '@/utils/supabase/service'
import type { Json } from '@/types/database.types'

type ShippingAddress = {
  email?: string
  name?: string
  phone?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

function asAddress(value: Json): ShippingAddress {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as ShippingAddress : {}
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character)
}

function safeImageUrl(value: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

const money = (amountPaise: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amountPaise / 100)

export async function sendOrderNotification(orderId: string) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  const to = process.env.ORDER_NOTIFICATION_EMAIL?.trim() || 'adrenaxindia@gmail.com'
  if (!apiKey || !from) throw new Error('Order email is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.')

  const supabase = createServiceClient()
  const { data: order, error: orderError } = await supabase.from('orders')
    .select('id,amount_paise,currency,status,created_at,shipping_address')
    .eq('id', orderId)
    .maybeSingle()
  if (orderError || !order) throw new Error('Could not load the order for its email notification.')

  const { data: items, error: itemsError } = await supabase.from('order_items')
    .select('product_id,product_name,unit_price_paise,quantity')
    .eq('order_id', orderId)
  if (itemsError) throw new Error('Could not load the order items for its email notification.')

  const productIds = [...new Set((items ?? []).flatMap((item) => item.product_id ? [item.product_id] : []))]
  const { data: products, error: productsError } = productIds.length
    ? await supabase.from('products').select('id,image_url').in('id', productIds)
    : { data: [], error: null }
  if (productsError) throw new Error('Could not load product images for the order email.')
  const images = new Map((products ?? []).map((product) => [product.id, safeImageUrl(product.image_url)]))
  const address = asAddress(order.shipping_address)
  const orderLabel = order.id.slice(0, 8).toUpperCase()
  const statusLabel = order.status === 'refund_required' ? 'Payment captured · needs review' : 'Payment confirmed'
  const itemRows = (items ?? []).map((item) => {
    const imageUrl = item.product_id ? images.get(item.product_id) : null
    const image = imageUrl
      ? `<img src="${escapeHtml(imageUrl)}" width="72" height="72" alt="${escapeHtml(item.product_name)}" style="display:block;width:72px;height:72px;object-fit:cover;border-radius:10px;background:#17131c" />`
      : '<div style="width:72px;height:72px;border-radius:10px;background:#17131c"></div>'
    return `<tr>
      <td style="padding:14px 0;border-bottom:1px solid #302b35;width:84px">${image}</td>
      <td style="padding:14px 10px;border-bottom:1px solid #302b35;color:#f5f2f8;font-size:14px">${escapeHtml(item.product_name)}<br /><span style="color:#aaa2b3;font-size:12px">Qty ${item.quantity} · ${money(item.unit_price_paise)} each</span></td>
      <td style="padding:14px 0;border-bottom:1px solid #302b35;color:#f5f2f8;font-size:14px;text-align:right;white-space:nowrap">${money(item.unit_price_paise * item.quantity)}</td>
    </tr>`
  }).join('')
  const addressLines = [address.address_line_1, address.address_line_2, [address.city, address.state, address.postal_code].filter(Boolean).join(', '), address.country === 'IN' ? 'India' : address.country].filter(Boolean)
    .map((line) => `<div>${escapeHtml(line ?? '')}</div>`).join('')
  const html = `<!doctype html><html><body style="margin:0;background:#09070a;color:#f5f2f8;font-family:Arial,sans-serif;padding:28px 12px">
    <div style="max-width:640px;margin:0 auto;border:1px solid #302b35;border-radius:18px;background:#110e15;padding:28px">
      <div style="color:#c5ff42;font-size:12px;font-weight:bold;letter-spacing:3px">ADRENAX · STORE ORDER</div>
      <h1 style="margin:16px 0 6px;font-size:25px">New order ${orderLabel}</h1>
      <div style="color:#c5ff42;font-size:13px">${statusLabel}</div>
      <div style="margin-top:24px;border-top:1px solid #302b35;border-bottom:1px solid #302b35">
        <table role="presentation" style="width:100%;border-collapse:collapse">${itemRows}</table>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:18px;font-size:16px;font-weight:bold"><span>Total</span><span>${money(order.amount_paise)}</span></div>
      <h2 style="margin:28px 0 8px;font-size:15px">Customer and delivery</h2>
      <div style="color:#d2ccd7;font-size:13px;line-height:1.7">${escapeHtml(address.name || 'Customer')}<br />${escapeHtml(address.email || '')}${address.phone ? `<br />${escapeHtml(address.phone)}` : ''}<br />${addressLines}</div>
      <div style="margin-top:24px;color:#8e8795;font-size:11px">Placed ${new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(order.created_at))} · ${escapeHtml(order.currency)}</div>
    </div>
  </body></html>`

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `adrenax-order-notification-${order.id}`,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `${order.status === 'refund_required' ? 'Order needs review' : 'New order'} · ${orderLabel}`,
      html,
    }),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(`Order email provider rejected the notification (${response.status}): ${error?.message ?? 'unknown error'}`)
  }
}
