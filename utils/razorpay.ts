import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

type RazorpayConfig = { keyId: string; keySecret: string; mode: 'test' | 'live'; webhookSecret?: string }

export function getRazorpayConfig(): RazorpayConfig | null {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  const mode = process.env.RAZORPAY_MODE === 'live' ? 'live' : 'test'
  if (!keyId || !keySecret || !keyId.startsWith(`rzp_${mode}_`)) return null
  return { keyId, keySecret, mode, webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET }
}

export async function razorpayRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const config = getRazorpayConfig()
  if (!config) throw new Error('Razorpay test credentials are not configured.')
  const authorization = Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64')
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Authorization: `Basic ${authorization}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) throw new Error(`Razorpay request failed with status ${response.status}.`)
  return response.json() as Promise<T>
}

export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string, secret: string) {
  const expected = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest()
  let actual: Buffer
  try { actual = Buffer.from(signature, 'hex') } catch { return false }
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export function verifyWebhookSignature(body: string, signature: string, secret: string) {
  const expected = createHmac('sha256', secret).update(body).digest()
  let actual: Buffer
  try { actual = Buffer.from(signature, 'hex') } catch { return false }
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
