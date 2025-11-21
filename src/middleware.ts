import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const rateLimitMap = new Map()

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwarded ? forwarded.split(',')[0] : realIp || 'unknown'
    
    const now = Date.now()
    const windowMs = 15 * 60 * 1000 
    const maxRequests = 100 
    
    const requestData = rateLimitMap.get(ip) || { count: 0, lastReset: now }

    if (now - requestData.lastReset > windowMs) {
      requestData.count = 0
      requestData.lastReset = now
    }

    if (requestData.count >= maxRequests) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
    
    requestData.count++
    rateLimitMap.set(ip, requestData)

    for (const [key, data] of rateLimitMap.entries()) {
      if (now - data.lastReset > windowMs) {
        rateLimitMap.delete(key)
      }
    }

    response.headers.set('x-client-ip', ip)
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*'
  ]
}