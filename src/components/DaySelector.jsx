'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import ProximityChart from '@/components/ProximityChart'
import CustomHeatmap from '@/components/CustomHeatmap'
import LineChart from '@/components/LineChart.js'
import { ChevronDown } from 'lucide-react'

export default function DaySelector({ initialUploads, initialProfile }) {
  const supabase = createClientComponentClient()
  const [selectedOption, setSelectedOption] = useState('all-days')
  const [sensorData, setSensorData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [viewMode, setViewMode] = useState('hourly')

  // Load default data on component mount
  useEffect(() => {
    handleOptionSelect('all-days')
  }, [])

  // Handle option selection
  const handleOptionSelect = async (option) => {
    setIsLoading(true)
    setSelectedOption(option)
    setIsOpen(false)
    setViewMode(option === 'all-days' ? 'daily' : 'hourly')
    
    try {
      const { data: uploads, error } = await supabase
        .from('user_uploads')
        .select('*')
        .eq('user_id', initialProfile.user_id)
      
      if (error) throw error

      const dayData = uploads?.[0]?.day_data
      const parsedDayData = typeof dayData === 'string' ? JSON.parse(dayData) : dayData || {}
      const daysArray = Object.values(parsedDayData)

      let processedData = []

      if (option === 'all-days') {
        processedData = daysArray.flatMap(day => 
          day.measurements?.map(entry => formatMeasurement(entry)) || []
        )
      } else if (option === 'aggregate') {
        processedData = calculateAverages(daysArray)
      } else {
        const matchedDay = daysArray.find(day => day.id === option)
        processedData = matchedDay?.measurements?.map(entry => formatMeasurement(entry)) || []
      }

      setSensorData(processedData.length > 0 ? processedData : 
        initialProfile?.csv_data ? parseCSVData(initialProfile.csv_data) : []
      )

    } catch (err) {
      console.error('Error loading data:', err)
      setSensorData(initialProfile?.csv_data ? parseCSVData(initialProfile.csv_data) : [])
    } finally {
      setIsLoading(false)
    }
  }

  const formatMeasurement = (entry) => ({
    Timestamp: entry.timestamp,
    Near: entry.near,
    Far: entry.far,
    Medium: entry.medium,
    Battery: entry.battery
  })

  const calculateAverages = (daysArray) => {
    const measurementsByHour = {}

    daysArray.forEach(day => {
      day.measurements?.forEach(measurement => {
        const hour = new Date(measurement.timestamp).getHours()
        if (!measurementsByHour[hour]) {
          measurementsByHour[hour] = []
        }
        measurementsByHour[hour].push(measurement)
      })
    })

    return Object.entries(measurementsByHour).map(([hour, measurements]) => {
      const count = measurements.length
      const sum = measurements.reduce((acc, curr) => ({
        near: acc.near + curr.near,
        far: acc.far + curr.far,
        medium: acc.medium + curr.medium,
        battery: acc.battery + curr.battery
      }), { near: 0, far: 0, medium: 0, battery: 0 })

      return {
        Timestamp: `2000-01-01T${hour.toString().padStart(2, '0')}:00:00.000Z`,
        Near: Math.round(sum.near / count),
        Far: Math.round(sum.far / count),
        Medium: Math.round(sum.medium / count),
        Battery: sum.battery / count
      }
    })
  }

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

  const days = initialUploads?.[0]?.day_data ? Object.values(initialUploads[0].day_data) : []

  const getSelectedDisplayName = () => {
    switch(selectedOption) {
      case 'all-days': return 'All Days'
      case 'aggregate': return 'Aggregate'
      default: 
        const day = days.find(d => d.id === selectedOption)
        return day?.name || `${selectedOption}`
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.getElementById('day-select-dropdown')
      const button = document.getElementById('day-select')
      
      if (isOpen && dropdown && button && 
          !dropdown.contains(event.target) && 
          !button.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <>
      <div className="mb-6 relative right-0">
        <button
          id="day-select"
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(!isOpen)
          }}
          disabled={isLoading}
          className={`w-[13%] flex right-0 items-center justify-between px-4 py-3 bg-white border rounded-lg shadow-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
            isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:border-gray-400'
          }`}
        >
          <span className="truncate text-sm">{getSelectedDisplayName()}</span>
          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div 
            id="day-select-dropdown"
            className="absolute z-10 mt-1 w-[13%] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
          >
            <div className="py-1 overflow-y-auto" style={{ maxHeight: '210px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleOptionSelect('all-days')
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                  selectedOption === 'all-days' ? 'bg-blue-100 text-blue-700' : 'text-gray-800'
                }`}
              >
                <div className="flex items-center">
                  <span className="truncate text-sm">All Days</span>
                  {selectedOption === 'all-days' && <span className="ml-auto text-blue-600">✓</span>}
                </div>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleOptionSelect('aggregate')
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                  selectedOption === 'aggregate' ? 'bg-blue-100 text-blue-700' : 'text-gray-800'
                }`}
              >
                <div className="flex items-center">
                  <span className="truncate text-sm">Aggregate</span>
                  {selectedOption === 'aggregate' && <span className="ml-auto text-blue-600">✓</span>}
                </div>
              </button>

              <div className="border-t border-gray-200 my-1"></div>

              {days.map(day => (
                <button
                  key={day.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOptionSelect(day.id)
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                    selectedOption === day.id ? 'bg-blue-100 text-blue-700' : 'text-gray-800'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="truncate text-sm">{day.name || `${day.id}`}</span>
                    {selectedOption === day.id && <span className="ml-auto text-blue-600">✓</span>}
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
            <ProximityChart 
              data={filteredData} 
              viewMode={selectedOption === 'all-days' ? 'daily' : 'hourly'}
            />
          </div>
          
          <div className="mb-10 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <CustomHeatmap 
              sensorData={filteredData} 
              viewMode={viewMode}
              selectedOption={selectedOption}
            />
          </div>
          
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <LineChart 
              data={filteredData}
              viewMode={selectedOption === 'all-days' ? 'daily' : 'hourly'}
            />
          </div>
        </>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
          <p className="text-gray-600">No sensor data available.</p>
        </div>
      )}
    </>
  )
}