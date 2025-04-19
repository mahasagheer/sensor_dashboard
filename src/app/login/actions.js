'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '../../utlis/supabase/server'

export async function login(prevState, formData) {
  const supabase = await createClient()
  
  const email = formData.get('email')?.toString() || ''
  const password = formData.get('password')?.toString() || ''

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return { error: error.message }
    }

    console.log("user data ",data)
    // Set user data in cookies
    const cookieStore = cookies()
    cookieStore.set('user_id', data.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    })
    
    cookieStore.set('user_email', data.user.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    revalidatePath('/', 'layout')
    return { 
      success: true, 
      user: {
        id: data.user.id,
        email: data.user.email,
      }
    }
  } catch (error) {
    return { error: 'An unexpected error occurred' }
  }
}