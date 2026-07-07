import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const BYPASS_SECRET = 'hrreply_admin'
const BYPASS_COOKIE = 'maintenance_bypass'

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // ── Maintenance mode ──────────────────────────────────────────────────────
  if (process.env.MAINTENANCE_MODE === 'true') {
    const isMaintenancePage = pathname === '/maintenance'
    const isAsset = pathname.startsWith('/_next/') || pathname.startsWith('/api/')
    const hasBypassCookie = request.cookies.get(BYPASS_COOKIE)?.value === BYPASS_SECRET
    const bypassParam = searchParams.get('bypass')

    // Grant bypass via query param and set cookie
    if (bypassParam === BYPASS_SECRET) {
      const url = request.nextUrl.clone()
      url.searchParams.delete('bypass')
      const res = NextResponse.redirect(url)
      res.cookies.set(BYPASS_COOKIE, BYPASS_SECRET, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 8, // 8 hours
        path: '/',
      })
      return res
    }

    if (!isMaintenancePage && !isAsset && !hasBypassCookie) {
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isPublic =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/reset-password' ||
    pathname === '/maintenance' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.startsWith('/guides') ||
    pathname.startsWith('/join/') ||
    pathname.startsWith('/api/')

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect logged-in users away from landing/login to dashboard
  if (user && (pathname === '/login' || pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
}
