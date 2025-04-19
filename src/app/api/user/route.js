import { createClient } from '@/utlis/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    const cookieStore = cookies()
    
    const userId = cookieStore.get('user_id')?.value
    const userEmail = cookieStore.get('user_email')?.value
    console.log("userEmail",userEmail);

    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) throw error

    return NextResponse.json({
      id: userId,
      email: userEmail,
      profile
    })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}