// src/utlis/supabase/getUserProfile.js
import { createServerSupabaseClient } from '@/utlis/supabase/server'

export async function getUserProfile() {
  try {
    // Initialize Supabase client
    const supabase = createServerSupabaseClient()
    
    if (!supabase.auth) {
      throw new Error('Supabase auth not available')
    }

    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return null
    }

    if (!session) {
      console.log('No active session found')
      return null
    }

    // Get user details
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('User error:', userError)
      return null
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return { user, profile: null }
    }

    return { user, profile }
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return null
  }
}