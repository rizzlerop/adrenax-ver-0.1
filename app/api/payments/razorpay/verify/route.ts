import { createClient as createSessionClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { getRazorpayConfig, razorpayRequest, verifyCheckoutSignature } from '@/utils/razorpay'

export const runtime = 'nodejs'

type RazorpayPayment = { id: string; order_id: string; amount: number; currency: string; status: string }
type Completion = { status?: string; order_id?: string }

export async function POST(request: Request) {
  const config = getRazorpayConfig()
  if (!config) return Response.json({ error: 'payment_setup_required' }, { status: 503 })

  const sessionClient = await createSessionClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!user) return Response.json({ error: 'sign_in_required' }, { status: 401 })

  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const orderId = body?.razorpay_order_id
  const paymentId = body?.razorpay_payment_id
  const signature = body?.razorpay_signature
  if (typeof orderId !== 'string' || typeof paymentId !== 'string' || typeof signature !== 'string' || orderId.length > 80 || paymentId.length > 80 || signature.length !== 64) {
    return Response.json({ error: 'invalid_payment_response' }, { status: 400 })
  }

  try {
    const serviceClient = createServiceClient()
    const { data: order, error: orderError } = await serviceClient
      .from('orders')
      .select('id,user_id,amount_paise,currency,status,razorpay_payment_id')
      .eq('razorpay_order_id', orderId)
      .maybeSingle()
    if (orderError || !order || order.user_id !== user.id) return Response.json({ error: 'order_not_found' }, { status: 404 })
    if (!verifyCheckoutSignature(orderId, paymentId, signature, config.keySecret)) return Response.json({ error: 'payment_signature_invalid' }, { status: 400 })
    if (order.status === 'paid' && order.razorpay_payment_id === paymentId) return Response.json({ status: 'paid', orderId: order.id })

    let payment = await razorpayRequest<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`)
    if (payment.order_id !== orderId || payment.amount !== order.amount_paise || payment.currency !== order.currency) {
      return Response.json({ error: 'payment_details_mismatch' }, { status: 400 })
    }
    if (payment.status === 'authorized') {
      payment = await razorpayRequest<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}/capture`, {
        method: 'POST',
        body: JSON.stringify({ amount: order.amount_paise, currency: order.currency }),
      })
    }
    if (payment.status !== 'captured') return Response.json({ status: 'processing', orderId: order.id }, { status: 202 })

    const { data, error } = await serviceClient.rpc('complete_adrenax_order', {
      p_razorpay_order_id: orderId,
      p_payment_id: paymentId,
      p_amount_paise: payment.amount,
      p_currency: payment.currency,
    })
    if (error) throw error
    const completion = data as Completion
    if (completion.status === 'paid') return Response.json({ status: 'paid', orderId: completion.order_id ?? order.id })
    if (completion.status === 'refund_required') return Response.json({ status: 'refund_required', orderId: completion.order_id ?? order.id }, { status: 409 })
    return Response.json({ error: 'payment_verification_failed' }, { status: 409 })
  } catch (error) {
    console.error('Razorpay payment verification failed', error)
    return Response.json({ error: 'payment_verification_failed' }, { status: 503 })
  }
}
