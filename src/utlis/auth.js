'use server'

import { cookies } from 'next/headers'
import { createServerSupabaseClient } from './supabase/server'

export async function getUserFromCookies() {
  try {
    const cookieStore = cookies()
    const userId = cookieStore.get('user_id')?.value
    const userEmail = cookieStore.get('user_email')?.value

    if (!userId || !userEmail) {
      return null
    }

    // Initialize Supabase client
    const supabase = createServerSupabaseClient()
    
    // Verify client is properly initialized
    if (!supabase || typeof supabase.from !== 'function') {
      throw new Error('Supabase client not properly initialized')
    }

    // Get profile data
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return {
        id: userId,
        email: userEmail,
        profile: null
      }
    }

    return {
      id: userId,
      email: userEmail,
      profile
    }
  } catch (error) {
    console.error('Error in getUserFromCookies:', error)
    return null
  }
}