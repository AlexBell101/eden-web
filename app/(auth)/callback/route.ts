import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/feed'

  console.log('[callback] received code:', !!code)

  if (code) {
    console.log('[callback] creating supabase client...')
    const supabase = await createClient()
    console.log('[callback] exchanging code for session...')
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    console.log('[callback] exchange result - error:', error?.message ?? 'none')
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
