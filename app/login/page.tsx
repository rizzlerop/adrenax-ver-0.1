import type { Metadata } from 'next'
import { LoginForm } from '@/components/login-form'

export const metadata: Metadata = { title: 'Sign in' }
type Props = { searchParams: Promise<{ next?: string; setup?: string; denied?: string }> }

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams
  return <LoginForm next={params.next ?? ''} setup={Boolean(params.setup)} denied={Boolean(params.denied)} />
}
