
import { createClient } from '@/utlis/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import ProximityChart from '@/components/ProximityChart'
import CustomHeatmap from '@/components/CustomHeatmap'
import LineChart from '@/components/LineChart.js'
import LogoutButton from '@/components/logout'
import Link from 'next/link'
import DownloadCsvButton from '@/components/DownloadCsvButton'

export default async function PrivatePage() {
  const supabase = await createClient()
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession()

  // Get user email from session
  const userEmail = session?.user?.email
  console.log(userEmail)
  const userID = session?.user?.id

  let { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq("user_id", userID);
    
  console.log("profile data:", profiles);

  // Function to handle CSV download
  const downloadCSV = () => {
    if (!profiles || !profiles[0]?.csv_data) return;
    
    // Create a Blob with the CSV data
    const blob = new Blob([profiles[0].csv_data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element to trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = `sensor_data_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // If no profile exists, show the complete profile prompt
  if (profiles[0]?.company_name === null || profiles[0]?.client_name === null) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className='bg-white px-5 py-4 rounded-lg shadow-md my-10'>
            <LogoutButton/>
            <h1 className='text-2xl'>Welcome to Your Dashboard</h1>
            <h2 className='py-3 text-4xl'>Hi, {userEmail}</h2>
            <div className="mt-6 p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    You need to complete your profile to access the full dashboard. 
                    <Link href="/complete-profile" className="ml-2 font-medium text-yellow-700 underline hover:text-yellow-600">
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

  // Parse CSV data from profiles
  const parseCSVData = (csvString) => {
    const lines = csvString.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',');
      const entry = {};
      
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        let value = values[j].trim();
        
        // Extract numeric values from strings like "Near: 0"
        if (header !== 'Timestamp') {
          value = value.split(':')[1].trim();
          if (header === 'Battery') {
            value = parseFloat(value.replace('%', ''));
          } else {
            value = parseInt(value, 10);
          }
        }
        
        entry[header] = value;
      }
      
      result.push(entry);
    }
    
    return result;
  };

  let sensorData = [];
  if (profiles[0]?.csv_data) {
    sensorData = parseCSVData(profiles[0].csv_data);
  }

  // Filter sensor data to include only entries between 6AM and 10PM
  const filteredData = sensorData.filter((entry) => {
    const timestamp = new Date(entry.Timestamp)
    const hour = timestamp.getHours()
    return hour >= 6 && hour <= 22 // 6 AM to 10 PM
  });
          
  // If profile exists, show the dashboard
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
      <h1 className='text-3xl text-center'>{profiles[0]?.company_name}</h1>

        <div className='bg-white px-5 flex flex-row justify-between py-4 rounded-lg shadow-md my-10'>
<div>
<h2 className=' text-2xl'>Hi, {profiles[0]?.full_name}</h2>
<h2 className='py-3 text-4xl'>{profiles[0]?.client_name}</h2>
</div>
<div>  
            <LogoutButton/>
          <DownloadCsvButton initialCsvData={profiles[0]?.csv_data} /></div>
        
        </div>
        {filteredData.length > 0 ? (
          <>
            <div className="mb-10">
              <ProximityChart data={filteredData}/>
            </div>
            <CustomHeatmap sensorData={filteredData} />
            <div className="bg-white p-6 rounded-lg shadow-md my-10">
              <LineChart data={filteredData} />
            </div>
          </>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md my-10">
            <p>No sensor data available. Please upload data to see visualizations.</p>
          </div>
        )}
      </div>
    </div>
  )
}