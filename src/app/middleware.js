import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_name')
    .eq('id', user?.id)
    .single();

  // If user is logged in but missing profile data
  if (user && !profile?.company_name && !req.nextUrl.pathname.startsWith('/profile-complete')) {
    return NextResponse.redirect(new URL('/profile-complete', req.url));
  }

  return res;
}