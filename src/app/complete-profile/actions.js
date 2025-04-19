'use server'

import { createClient } from '@/utlis/supabase/server'
import { redirect } from 'next/navigation'

export async function completeProfile(prevState, formData) {
  const supabase = await createClient()
  
  // Get the session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session?.user) {
    return { error: 'User not authenticated. Please try logging in again.' }
  }

  // Read CSV file
  const csvFile = formData.get('csv_file')
  let csvData = null
  if (csvFile) {
    csvData = await csvFile.text()
  }

  // Check if profile exists, if not create it
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single()

  if (profileError || !profile) {
    // Create profile if it doesn't exist
    const { error: createError } = await supabase
      .from('profiles')
      .insert({
        user_id: session.user.id,
        full_name: session.user.user_metadata?.full_name || '',
        company_name: formData.get('company_name'),
        client_name: formData.get('client_name'),
        csv_data: csvData,
      })

    if (createError) {
      return { error: 'Failed to create profile' }
    }
  } else {
    // Update existing profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        company_name: formData.get('company_name'),
        client_name: formData.get('client_name'),
        csv_data: csvData,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', session.user.id)

    if (updateError) {
      return { error: 'Failed to update profile' }
    }
  }

  redirect('/login')
}