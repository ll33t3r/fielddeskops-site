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
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get session from Supabase
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Define public routes (no auth required)
  const publicRoutes = ['/welcome', '/auth/login', '/auth/signup', '/auth/callback']
  const publicApiRoutes = ['/api/stripe/checkout']
  
  // Define protected routes
  const protectedRoutes = ['/dashboard', '/apps', '/settings', '/command']
  const { pathname } = request.nextUrl

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route))
  const isPublicApiRoute = publicApiRoutes.some((route) => pathname.startsWith(route))

  // Allow public routes and API routes
  if (isPublicRoute || isPublicApiRoute) {
    return response
  }

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // If accessing a protected route without a session, redirect to welcome
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/welcome', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // If session exists, allow access
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
