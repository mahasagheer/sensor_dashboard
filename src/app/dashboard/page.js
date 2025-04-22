import { createServerSupabaseClient } from '@/utlis/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import ProximityChart from '@/components/ProximityChart'
import CustomHeatmap from '@/components/CustomHeatmap'
import LineChart from '@/components/LineChart.js'
import LogoutButton from '@/components/logout'
import DownloadCsvButton from '@/components/DownloadCsvButton'
import FileUploader from '@/components/FileUploader'
import DaySelector from '@/components/DaySelector'
import Link from 'next/link'

export default async function PrivatePage() {
  const supabase = await createServerSupabaseClient()

  // Get user session - don't redirect immediately
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return redirect('/login')
  }

  const userID = session.user.id
  const userEmail = session.user.email

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq("user_id", userID)
    .single()

  if (!profile || profileError) {
    return redirect('/complete-profile')
  }

  // Check for incomplete profile
  if (!profile?.company_name || !profile?.client_name) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className='bg-white p-6 rounded-lg shadow-md'>
            <div className="flex justify-between items-start">
              <div>
                <h1 className='text-2xl font-semibold'>Welcome to Your Dashboard</h1>
                <h2 className='py-2 text-3xl'>Hi, {userEmail}</h2>
              </div>
              <LogoutButton />
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Your profile is incomplete. You need to complete your profile to access all dashboard features.
                    <Link href="/complete-profile" className="ml-2 font-medium text-yellow-700 underline hover:text-yellow-600 transition-colors">
                      Complete your profile now →
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Get basic uploads data
  const { data: uploads } = await supabase
    .from('user_uploads')
    .select('*')
    .eq('user_id', userID)

  // Main dashboard view
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className='flex justify-between items-center mb-10'>
          <h1 className='text-4xl font-bold text-gray-800'>{profile.company_name}</h1>
          <LogoutButton />
        </div>
        
        {/* User Info Section */}
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-lg shadow-sm mb-10'>
          <div>
            <h2 className='text-2xl font-medium text-gray-700'>Hi, {profile.full_name}</h2>
            <h2 className='py-2 text-4xl font-semibold text-gray-900'>{profile.client_name}</h2>
          </div>
          <div className='flex flex-col sm:flex-row gap-3'>
            <FileUploader userId={profile.user_id} />
            <DownloadCsvButton initialCsvData={profile.csv_data} />
          </div>
        </div>

        {/* Day Selector */}
        <DaySelector 
          initialUploads={uploads} 
          initialProfile={profile} 
        />

        {/* Charts Section */}
        <DashboardCharts initialProfile={profile} initialUploads={uploads} />
      </div>
    </div>
  )
}

// Client component for charts
async function DashboardCharts({ initialProfile, initialUploads }) {
  return (
    <div className="mt-10">
      {/* Chart components will be rendered here */}
    </div>
  )
}