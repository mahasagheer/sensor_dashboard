// app/private/page.jsx (Server Component)
import { createClient } from '@/utlis/supabase/server'
import { redirect } from 'next/navigation'
import ProximityChart from '@/components/ProximityChart'
import CustomHeatmap from '@/components/CustomHeatmap'
import LineChart from '@/components/LineChart.js'

export default async function PrivatePage() {
  const supabase = await createClient()
  const { data: sensor_data} = await supabase.from("sensor_data_duplicate").select("*")

  // Filter sensor data to include only entries between 6AM and 10PM
  const filteredData = sensor_data.filter((entry) => {
    const timestamp = new Date(entry.Timestamp)
    const hour = timestamp.getHours()
    return hour >= 6 && hour <= 22 // 6 AM to 10 PM
  })
  const { data, error } = await supabase.auth.getUser()
  
  if (error || !data?.user) {
    redirect('/login')
  }

  return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className='bg-white px-5 py-4 rounded-lg shadow-md my-10'>
            <h1 className=' text-2xl'>Company Name</h1>
            <h2 className='py-3 text-4xl'>Hi, Sherway Gardens</h2>
            </div>
            <div className="mb-10">
            {/* <FileUploader/> */}
            <ProximityChart data={filteredData}/>
    
            </div>
            <CustomHeatmap sensorData={filteredData} />
    
            <div className="bg-white p-6 rounded-lg shadow-md my-10" >
            <LineChart data={filteredData} />
    
            </div>
    
          </div>
        </div>
  )
}