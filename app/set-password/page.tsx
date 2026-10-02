import type { Metadata } from 'next'
import { SetPasswordForm } from '@/components/set-password-form'

export const metadata: Metadata = { title: 'Set your password' }

type Props = { searchParams: Promise<{ link?: string }> }

export default async function SetPasswordPage({ searchParams }: Props) {
  const params = await searchParams
  return <SetPasswordForm invalidLink={params.link === 'invalid'} />
}
