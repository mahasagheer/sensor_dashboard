'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../utlis/supabase/server'

export async function signup(formData) {
  const supabase = await createClient()

  const signUpData = {
    email: formData.get('email'),
    password: formData.get('password'),
    options: {
      data: {
        full_name: formData.get('name'),
      }
    }
  }

  const { data, error } = await supabase.auth.signUp(signUpData)

  if (error) {
    console.error('Signup error:', error)
    redirect('/error?message=' + encodeURIComponent(error.message))
  }

  // Only create profile if email confirmation is not required
  // or if you want to create it immediately
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: data.user.id,
        full_name: formData.get('name'),
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
    }
  }

  redirect('/')
}