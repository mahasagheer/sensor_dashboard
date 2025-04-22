'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import ProximityChart from '@/components/ProximityChart'
import CustomHeatmap from '@/components/CustomHeatmap'
import LineChart from '@/components/LineChart.js'
import { ChevronDown } from 'lucide-react'

export default function DaySelector({ initialUploads, initialProfile }) {
  const supabase = createClientComponentClient()
  const [selectedDay, setSelectedDay] = useState('4')
  const [sensorData, setSensorData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Load default day data on component mount
  useEffect(() => {
    handleDaySelect('4')
  }, [])

  // Handle day selection
  const handleDaySelect = async (dayId) => {
    setIsLoading(true)
    setSelectedDay(dayId)
    setIsOpen(false)
    
    try {
      const { data: uploads, error } = await supabase
        .from('user_uploads')
        .select('*')
        .eq('user_id', initialProfile.user_id)
      
      if (error) throw error

      const dayData = uploads?.[0]?.day_data
      const parsedDayData = typeof dayData === 'string' ? JSON.parse(dayData) : dayData || {}
      
      let matchedDay = Object.values(parsedDayData).find(day => day.id === dayId)
      
      if (matchedDay?.measurements?.length > 0) {
        const newSensorData = matchedDay.measurements.map(entry => ({
          Timestamp: entry.timestamp,
          Near: entry.near,
          Far: entry.far,
          Medium: entry.medium,
          Battery: entry.battery
        }))
        setSensorData(newSensorData)
      } else {
        if (initialProfile?.csv_data) {
          const parsedData = parseCSVData(initialProfile.csv_data)
          setSensorData(parsedData)
        } else {
          setSensorData([])
        }
      }
    } catch (err) {
      console.error('Error loading day data:', err)
      if (initialProfile?.csv_data) {
        const parsedData = parseCSVData(initialProfile.csv_data)
        setSensorData(parsedData)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // CSV Parser
  const parseCSVData = (csvString) => {
    if (!csvString) return []
    
    const lines = csvString.split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    const result = []

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue
      const values = lines[i].split(',')
      const entry = {}

      for (let j = 0; j < headers.length; j++) {
        let value = values[j]?.trim() || ''
        const header = headers[j]
        if (header !== 'Timestamp') {
          value = value.split(':')[1]?.trim()
          if (header === 'Battery') {
            value = parseFloat(value.replace('%', ''))
          } else {
            value = parseInt(value, 10)
          }
        }
        entry[header] = value
      }
      result.push(entry)
    }

    return result
  }

  const filteredData = sensorData.filter(entry => {
    const timestamp = new Date(entry.Timestamp)
    const hour = timestamp.getHours()
    return hour >= 6 && hour <= 22
  })

  // Get all available days
  const days = initialUploads?.[0]?.day_data ? Object.values(initialUploads[0].day_data) : []
  const selectedDayName = days.find(day => day.id === selectedDay)?.name || `${selectedDay}`

  return (
    <>
      <div className="mb-6 relative right-0">
        
        {/* Custom dropdown button */}
        <button
          id="day-select"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className={`w-[10%] flex right-0 items-center justify-between px-4 py-3 bg-white border rounded-lg shadow-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
            isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:border-gray-400'
          }`}
        >
          <span className="truncate text-sm">{selectedDayName || 'Select a day'}</span>
          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Custom dropdown menu */}
        {isOpen && (
          <div className="absolute z-10 mt-1 w-[10%] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <div 
              className="py-1 overflow-y-auto"
              style={{ maxHeight: '210px' }} // Height for 7 items (approx. 30px each)
            >
              {days.map(day => (
                <button
                  key={day.id}
                  onClick={() => handleDaySelect(day.id)}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                    selectedDay === day.id ? 'bg-blue-100 text-blue-700' : 'text-gray-800'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="truncate text-sm">{day.name || `${day.id}`}</span>
                    {selectedDay === day.id && (
                      <span className="ml-auto text-blue-600">
                        ✓
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading data...</p>
        </div>
      ) : filteredData.length > 0 ? (
        <>
          <div className="mb-10 rounded-xl border border-gray-100">
            <ProximityChart data={filteredData} />
          </div>
          
          <div className="mb-10 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <CustomHeatmap sensorData={filteredData} />
          </div>
          
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <LineChart data={filteredData} />
          </div>
        </>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
          <p className="text-gray-600">No sensor data available for the selected day.</p>
        </div>
      )}
    </>
  )
}