'use client'

import { createBrowserSupabaseClient } from '@/utlis/supabase/client'
import { useState } from 'react'
import { DownloadIcon } from 'lucide-react'

export default function DownloadCsvButton({ initialCsvData }) {
  const [csvData, setCsvData] = useState(initialCsvData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const formatCsvData = (rawData) => {
    if (!rawData) return null
    
    const lines = rawData.split('\n')
    if (lines.length < 2) return rawData // Return as-is if no data to format
    
    const headers = ['Timestamp', 'Near', 'Medium', 'Far', 'Battery', 'BeaconID']
    let formattedLines = [headers.join(',')]
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue
      
      const parts = lines[i].split(',')
      if (parts.length < 5) continue
      
      // Extract values from each field
      const timestamp = parts[0].trim()
      const near = parts[1].split(':')[1].trim()
      const medium = parts[2].split(':')[1].trim()
      const far = parts[3].split(':')[1].trim()
      const battery = parts[4].split(':')[1].trim()
      const beaconId = '1' // Static value as per your example
      
      formattedLines.push([timestamp, near, medium, far, battery, beaconId].join(','))
    }
    
    return formattedLines.join('\n')
  }

  const handleDownload = async () => {
    try {
      setLoading(true)
      
      let dataToDownload = csvData
      
      // If no initial data, fetch from Supabase
      if (!dataToDownload) {
        const supabase = createBrowserSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) throw new Error('User not authenticated')

        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('csv_data')
          .eq('user_id', user.id)
          .single()

        if (profileError) throw profileError
        if (!profiles?.csv_data) throw new Error('No CSV data found')
        
        dataToDownload = profiles.csv_data
        setCsvData(dataToDownload)
      }
      
      // Format the data before downloading
      const formattedData = formatCsvData(dataToDownload)
      if (!formattedData) throw new Error('No valid data to download')
      
      downloadCsv(formattedData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadCsv = (data) => {
    const blob = new Blob([data], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sensor_data.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <button disabled className="px-4 py-2 bg-gray-300 text-gray-600 rounded">Loading...</button>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <button 
      onClick={handleDownload}
      className="px-3 py-2 bg-blue-500 rounded-full text-white hover:bg-blue-600 transition-colors"
    >
      
      <DownloadIcon className="w-5 h-5"/>
    </button>
  )
}