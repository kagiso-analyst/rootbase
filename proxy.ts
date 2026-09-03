import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { checkApiRateLimit, rateLimitHeaders } from '@/lib/rate-limit'

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const isPublic = [
    '/', '/login', '/register', '/faq', '/privacy', '/terms',
    '/refund-policy', '/accept-invitation', '/subscription/success',
    '/subscription/cancel', '/api/payfast/notify',
  ].includes(pathname)

  if (pathname.startsWith('/api/')) {
    const rateLimit = await checkApiRateLimit(request, user?.id)
    const headers = rateLimitHeaders(rateLimit.limit, rateLimit.remaining, rateLimit.reset)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000) },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.reset - Date.now()) / 1000)), ...headers } }
      )
    }

    Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
  }

  if (isPublic) return response

  if (pathname.startsWith('/api/') && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname === '/support/admin') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|css|js)$).*)'],
}