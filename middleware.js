import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  console.log(`Middleware: ${request.method} ${pathname}`);
  
  // Skip middleware for debug page
  if (pathname.startsWith('/debug')) {
    return NextResponse.next();
  }
  
  // Skip middleware for auth pages
  if (pathname.startsWith('/auth')) {
    return NextResponse.next();
  }
  
  // For now, let all other requests through
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
