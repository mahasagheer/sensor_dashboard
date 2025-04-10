"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"

// Dynamically import the HourlyHeatmap component with no SSR
const HourlyHeatmap = dynamic(() => import("@/components/HourlyHeatmap"), {
  ssr: false,
  loading: () => <div className="min-h-[400px] flex items-center justify-center">Loading heatmap...</div>,
})

export default function HeatmapWrapper({ sensorData }) {
  return (
    <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center">Loading heatmap...</div>}>
      <HourlyHeatmap sensorData={sensorData} />
    </Suspense>
  )
}
