import { NextResponse } from 'next/server'

export function middleware(request) {
  // THE RED WALL: Redirect EVERYONE to the login page immediately.
  // We are not checking Supabase. We are just checking if the file works.
  
  if (request.nextUrl.pathname === '/') {
    console.log("⛔ RED WALL HIT: Blocking access to Dashboard")
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|auth).*)'],
}