import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
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

  const pathname = request.nextUrl.pathname
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin')
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Admin routes need a member check at the edge. Dashboard member status is
  // enforced in the dashboard layout to avoid a duplicate DB query on every nav.
  if (user && pathname.startsWith('/admin')) {
    const { data: member } = await supabase
      .from('members')
      .select('status, is_admin')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!member?.is_admin || member.status !== 'active') {
      const url = request.nextUrl.clone()
      url.pathname = member?.status === 'active' ? '/dashboard' : '/pending-approval'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
