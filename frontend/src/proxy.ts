import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { rateLimiter } from './lib/rateLimit'

interface RoleCacheRecord {
  role: string;
  expiry: number;
}

const roleCache = new Map<string, RoleCacheRecord>();
const ROLE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
             request.headers.get('x-real-ip') || 
             (request as any).ip || 
             '127.0.0.1';

  // Log all incoming requests caught by the middleware
  console.log(`[REQUEST] ${request.method} ${path} from ${ip}`);

  // Apply rate limiting for API authentication/books endpoints
  if (path.startsWith('/api/auth/') || path.startsWith('/api/books')) {
    // Max 15 attempts per minute for auth/upload actions
    const limitResult = rateLimiter(ip, {
      windowMs: 60 * 1000,
      max: 15,
    });

    if (!limitResult.success) {
      console.log(`[RESPONSE] 429 Too Many Requests for ${request.method} ${path}`);
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((limitResult.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': limitResult.limit.toString(),
            'X-RateLimit-Remaining': limitResult.remaining.toString(),
          }
        }
      );
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

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
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This will refresh session if expired - essential for persistence
  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes list (Any logged-in user can access)
  const protectedRoutes = ['/profile', '/dashboard', '/write', '/admin', '/read/pdf']
  const isProtectedRoute = protectedRoutes.some(path => request.nextUrl.pathname.startsWith(path))

  if (isProtectedRoute && !user) {
    console.log(`[RESPONSE] 307 Redirect (Unauthenticated) for ${request.method} ${path}`);
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Server-side guard for /admin routes
  if (user && request.nextUrl.pathname.startsWith('/admin')) {
    const now = Date.now();
    const cached = roleCache.get(user.id);
    let role = '';

    if (cached && now < cached.expiry) {
      console.log(`[ROLE CACHE] HIT for user ${user.id} (role: ${cached.role})`);
      role = cached.role;
    } else {
      console.log(`[ROLE CACHE] MISS for user ${user.id} (fetching role from DB)`);
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!dbError && userData) {
        role = userData.role;
        roleCache.set(user.id, {
          role,
          expiry: now + ROLE_CACHE_DURATION
        });
      }
    }

    if (role !== 'Admin') {
      console.warn(`[RESPONSE] 307 Redirect (Unauthorized Admin Access Attempt) for ${request.method} ${path}`);
      const url = request.nextUrl.clone()
      url.pathname = '/profile'
      return NextResponse.redirect(url)
    }
  }

  console.log(`[RESPONSE] ${request.method} ${path} -> 200 OK`);
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files and favicon.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
