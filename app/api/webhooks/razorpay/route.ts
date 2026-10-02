import { createServiceClient } from '@/utils/supabase/service'
import { getRazorpayConfig, verifyWebhookSignature } from '@/utils/razorpay'

export const runtime = 'nodejs'

type RazorpayPaymentEvent = {
  event?: string
  payload?: { payment?: { entity?: { id?: string; order_id?: string; amount?: number; currency?: string; status?: string } } }
}

export async function POST(request: Request) {
  const webhookSecret = getRazorpayConfig()?.webhookSecret
  if (!webhookSecret) return Response.json({ error: 'webhook_not_configured' }, { status: 503 })

  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature') ?? ''
  if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) return Response.json({ error: 'invalid_webhook_signature' }, { status: 400 })

  let event: RazorpayPaymentEvent
  try { event = JSON.parse(rawBody) as RazorpayPaymentEvent }
  catch { return Response.json({ error: 'invalid_webhook_body' }, { status: 400 }) }

  if (event.event !== 'payment.captured') return Response.json({ received: true })
  const payment = event.payload?.payment?.entity
  if (!payment?.id || !payment.order_id || typeof payment.amount !== 'number' || !payment.currency) {
    return Response.json({ error: 'invalid_payment_event' }, { status: 400 })
  }

  try {
    const serviceClient = createServiceClient()
    const { data, error } = await serviceClient.rpc('complete_adrenax_order', {
      p_razorpay_order_id: payment.order_id,
      p_payment_id: payment.id,
      p_amount_paise: payment.amount,
      p_currency: payment.currency,
    })
    if (error) throw error
    return Response.json({ received: true, status: (data as { status?: string }).status ?? 'ignored' })
  } catch (error) {
    console.error('Razorpay webhook order update failed', error)
    return Response.json({ error: 'webhook_processing_failed' }, { status: 500 })
  }
}
