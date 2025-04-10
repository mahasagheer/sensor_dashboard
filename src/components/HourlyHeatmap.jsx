"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

// Dynamically import HeatMap with no SSR to avoid "self is not defined" error
const HeatMap = dynamic(() => import("react-heatmap-grid"), {
  ssr: false,
})

// Process sensor data to get hourly aggregations
const processDataForHeatmap = (sensorData) => {
  // Group data by hour
  const hourlyData = {}

  sensorData.forEach((entry) => {
    const timestamp = new Date(entry.Timestamp)
    const hour = timestamp.getHours()

    if (!hourlyData[hour]) {
      hourlyData[hour] = {
        mid: { count: 0, sum: 0 },
        near: { count: 0, sum: 0 },
        far: { count: 0, sum: 0 },
      }
    }

    // Assuming your data has position information
    // This is a placeholder - adjust according to your actual data structure
    if (entry.Position === "mid" || entry.Value1) {
      hourlyData[hour].mid.count++
      hourlyData[hour].mid.sum += entry.Value1 || 0
    }
    if (entry.Position === "near" || entry.Value2) {
      hourlyData[hour].near.count++
      hourlyData[hour].near.sum += entry.Value2 || 0
    }
    if (entry.Position === "far" || entry.Value3) {
      hourlyData[hour].far.count++
      hourlyData[hour].far.sum += entry.Value3 || 0
    }
  })

  // Format data for heatmap
  const positions = ["mid", "near", "far"]
  const xLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`)

  // Create the data matrix for the heatmap
  const data = positions.map((position) => {
    return Array.from({ length: 24 }, (_, hour) => {
      if (hourlyData[hour] && hourlyData[hour][position]) {
        const posData = hourlyData[hour][position]
        return posData.count > 0 ? Math.round(posData.sum / posData.count) : 0
      }
      return 0
    })
  })

  return { data, xLabels, yLabels: positions }
}

export default function HourlyHeatmap({ sensorData }) {
  const [dateRange, setDateRange] = useState("today")
  const [heatmapData, setHeatmapData] = useState({ data: [], xLabels: [], yLabels: [] })
  const [cellSize, setCellSize] = useState(35)
  const [isMounted, setIsMounted] = useState(false)

  // Filter data based on selected date range
  const getFilteredData = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    let filteredData = [...sensorData]

    if (dateRange === "today") {
      filteredData = sensorData.filter((entry) => {
        const entryDate = new Date(entry.Timestamp)
        return entryDate >= today
      })
    } else if (dateRange === "week") {
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)

      filteredData = sensorData.filter((entry) => {
        const entryDate = new Date(entry.Timestamp)
        return entryDate >= weekAgo
      })
    } else if (dateRange === "month") {
      const monthAgo = new Date(today)
      monthAgo.setMonth(monthAgo.getMonth() - 1)

      filteredData = sensorData.filter((entry) => {
        const entryDate = new Date(entry.Timestamp)
        return entryDate >= monthAgo
      })
    }

    return filteredData
  }

  useEffect(() => {
    setHeatmapData(processDataForHeatmap(getFilteredData()))
  }, [sensorData, dateRange])

  useEffect(() => {
    // Mark component as mounted to avoid SSR issues
    setIsMounted(true)

    // Update cell size based on window width
    const handleResize = () => {
      setCellSize(window.innerWidth > 768 ? 35 : 25)
    }

    // Set initial size
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Don't render anything during SSR
  if (!isMounted) {
    return <div className="min-h-[400px] flex items-center justify-center">Loading heatmap...</div>
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Hourly Sensor Heatmap</h2>
        <p className="text-gray-600 mb-4">Hourly distribution of sensor values by position</p>

        <div className="mb-4">
          <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">
            Date Range
          </label>
          <select
            id="dateRange"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        {heatmapData.data.length > 0 && (
          <HeatMap
            xLabels={heatmapData.xLabels}
            yLabels={heatmapData.yLabels}
            data={heatmapData.data}
            cellStyle={(background, value, min, max) => ({
              background: `rgb(0, 151, 230, ${1 - (max - value) / (max - min)})`,
              fontSize: "11px",
              color: value > (max - min) / 2 ? "#fff" : "#000",
            })}
            cellSize={cellSize}
            onClick={(x, y) => console.log(`Clicked ${x}, ${y}`)}
          ></HeatMap>
        )}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-[rgba(0,151,230,0.1)]"></div>
            <span className="text-xs">Low</span>
          </div>
          <div className="w-16 h-4 bg-gradient-to-r from-[rgba(0,151,230,0.1)] to-[rgba(0,151,230,1)] mx-2"></div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-[rgba(0,151,230,1)]"></div>
            <span className="text-xs">High</span>
          </div>
        </div>
      </div>
    </div>
  )
}
