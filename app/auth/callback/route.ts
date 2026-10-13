import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect(new URL('/login?oauthError=1', request.url))

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) return NextResponse.redirect(new URL('/login?oauthError=1', request.url))

  const { data: role } = await supabase.from('user_roles').select('is_admin').eq('id', data.user.id).maybeSingle()
  return NextResponse.redirect(new URL(role?.is_admin ? '/admin' : '/profile', request.url))
}
