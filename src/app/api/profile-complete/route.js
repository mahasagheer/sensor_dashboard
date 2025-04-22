import { createServerSupabaseClient } from '@/utlis/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token') // Changed from 'code' to 'token'
  
  if (!token) {
    return NextResponse.redirect(new URL('/error?message=Invalid token', request.url))
  }

  const supabase = createServerSupabaseClient()
  
  try {
    const { error } = await supabase.auth.verifyOtp({
      type: 'signup',
      token_hash: token,
    })

    if (error) {
      console.error('OTP verification error:', error)
      return NextResponse.redirect(new URL(`/error?message=${encodeURIComponent(error.message)}`, request.url))
    }

    // Success - redirect to complete-profile
    return NextResponse.redirect(new URL('/complete-profile', request.url))
    
  } catch (err) {
    console.error('Error in verification:', err)
    return NextResponse.redirect(new URL('/error', request.url))
  }
}