import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // If there's an error from the OAuth provider, log it and redirect
  if (error) {
    console.error('Auth error:', error, error_description)
    return NextResponse.redirect(`${requestUrl.origin}?error=${encodeURIComponent(error_description || error)}`)
  }

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Session exchange error:', exchangeError)
      return NextResponse.redirect(`${requestUrl.origin}?error=${encodeURIComponent(exchangeError.message)}`)
    }
  }

  // Successful authentication - redirect to home
  return NextResponse.redirect(requestUrl.origin)
}
