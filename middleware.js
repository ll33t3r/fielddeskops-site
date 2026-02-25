import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Setup Supabase Client for session management
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

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

  const pathname = request.nextUrl.pathname

  // Define public routes (no auth required)
  const publicRoutes = ['/', '/welcome', '/auth/login', '/auth/signup', '/auth/callback', '/pricing', '/sign']
  const publicApiRoutes = ['/api/stripe/checkout', '/api/stripe/webhook']

  // Define protected routes
  const protectedRoutes = ['/dashboard', '/apps', '/settings', '/command', '/account']

  const isPublicRoute = publicRoutes.some((route) =>
    route === '/' ? pathname === '/' : pathname === route || pathname.startsWith(`${route}/`)
  )
  const isPublicApiRoute = publicApiRoutes.some((route) => pathname.startsWith(route))

  // Root: send new users to Welcome, logged-in to Dashboard
  if (pathname === '/') {
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.redirect(new URL('/welcome', request.url))
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
  // Exclude webhook so middleware never touches the request body (Stripe signature verification needs raw body).
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth/.*|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
