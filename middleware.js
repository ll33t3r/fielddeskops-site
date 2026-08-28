import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const pathname = request.nextUrl.pathname

  // Never run auth/session checks for password recovery entry points.
  if (pathname === '/reset-password' || pathname.startsWith('/reset-password/')) {
    return NextResponse.next()
  }
  if (pathname === '/forgot-password' || pathname.startsWith('/forgot-password/')) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Guard: Supabase env vars required for auth (Edge runtime needs NEXT_PUBLIC_ vars)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  // Setup Supabase Client for session management
  // Note: request.cookies is read-only in Next.js middleware; only set cookies on response
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options ?? {})
        })
      },
    },
  })

  const clearSupabaseAuthCookies = () => {
    const authCookies = request.cookies.getAll().filter((cookie) => cookie.name.startsWith('sb-'))
    authCookies.forEach(({ name }) => {
      response.cookies.set(name, '', { maxAge: 0, path: '/' })
    })
  }

  let user = null
  try {
    const {
      data: { user: activeUser },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      const isMissingRefreshToken =
        userError.code === 'refresh_token_not_found' || userError.status === 400
      if (isMissingRefreshToken) {
        clearSupabaseAuthCookies()
      }
      user = null
    } else {
      user = activeUser ?? null
    }
  } catch {
    clearSupabaseAuthCookies()
    user = null
  }

  // Define public routes (no auth required)
  const publicRoutes = [
    '/',
    '/welcome',
    '/reviews',
    '/kit',
    '/auth/login',
    '/auth/signup',
    '/auth/callback',
    '/forgot-password',
    '/reset-password',
    '/pricing',
    '/sign',
  ]
  const publicApiRoutes = ['/api/stripe/checkout', '/api/stripe/webhook']

  // Define protected routes
  const protectedRoutes = ['/dashboard', '/apps', '/settings', '/command', '/account']

  const isPublicRoute = publicRoutes.some((route) =>
    route === '/' ? pathname === '/' : pathname === route || pathname.startsWith(`${route}/`)
  )
  const isPublicApiRoute = publicApiRoutes.some((route) => pathname.startsWith(route))

  // Root: logged-in users go to Dashboard; guests get Welcome content at /
  // (rewrite keeps URL as / so the home page stays indexable — no 307 hop).
  if (pathname === '/') {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.rewrite(new URL('/welcome', request.url))
  }

  // Allow public routes and API routes
  if (isPublicRoute || isPublicApiRoute) {
    return response
  }

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  // If accessing a protected route without a session, redirect to login
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    redirectUrl.searchParams.set('message', 'Please log in to continue.')
    return NextResponse.redirect(redirectUrl)
  }

  // If session exists, allow access
  return response
}

export const config = {
  matcher: ['/((?!reset-password|forgot-password|_next|favicon|api).*)'],
}
