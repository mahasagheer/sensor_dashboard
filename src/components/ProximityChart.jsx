"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingDown } from "lucide-react"
export default function ProximityChart({ data }) {
  const [activeZone, setActiveZone] = useState("Far")
  const [stats, setStats] = useState({
    visitors: 0,
    timeSpent: "0:00",
    peakHour: "N/A",
  })
  const [total,setTotal]= useState();
  console.log("data",data);

  // Process data to calculate statistics for each zone
  const zoneStats = useMemo(() => {
    // Group data by hour
    const hourlyData = {}

    data.forEach((entry) => {
      const date = new Date(entry.Timestamp)
      const hour = date.getHours()
      const hourKey = `${hour}`

      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = { Near: 0, Medium: 0, Far: 0 }
      }

      hourlyData[hourKey].Near += entry.Near
      hourlyData[hourKey].Medium += entry.Medium
      hourlyData[hourKey].Far += entry.Far
    })

    // Calculate peak hours for 2-hour windows
    const twoHourWindows = {}

    Object.keys(hourlyData).forEach((hour) => {
      const hourNum = Number.parseInt(hour)
      for (let i = 0; i < 23; i++) {
        const windowKey = `${i}-${i + 2}pm`
        if (hourNum >= i && hourNum < i + 2) {
          if (!twoHourWindows[windowKey]) {
            twoHourWindows[windowKey] = { Near: 0, Medium: 0, Far: 0 }
          }
          twoHourWindows[windowKey].Near += hourlyData[hour].Near
          twoHourWindows[windowKey].Medium += hourlyData[hour].Medium
          twoHourWindows[windowKey].Far += hourlyData[hour].Far
        }
      }
    })

    // Find peak hours for each zone
    const peakHours= {
      Near: "N/A",
      Medium: "N/A",
      Far: "N/A",
    }

    let maxNear = 0,
      maxMedium = 0,
      maxFar = 0

    Object.entries(twoHourWindows).forEach(([window, counts]) => {
      if (counts.Near > maxNear) {
        maxNear = counts.Near
        peakHours.Near = window
      }
      if (counts.Medium > maxMedium) {
        maxMedium = counts.Medium
        peakHours.Medium = window
      }
      if (counts.Far > maxFar) {
        maxFar = counts.Far
        peakHours.Far = window
      }
    })

    // Calculate total visitors and average time spent
    const totalVisitors = {
      Near: data.reduce((sum, entry) => sum + entry.Near, 0),
      Medium: data.reduce((sum, entry) => sum + entry.Medium, 0),
      Far: data.reduce((sum, entry) => sum + entry.Far, 0),
    }
    console.log(totalVisitors);
setTotal(totalVisitors);
    // Simulate time spent (in real app, this would be calculated from actual dwell time data)
    const avgTimeSpent = {
      Near: "12:30", // Closest proximity typically has longest dwell time
      Medium: "7:45",
      Far: "3:20",
    }

    return {
      Near: {
        visitors: totalVisitors.Near,
        timeSpent: avgTimeSpent.Near,
        peakHour: peakHours.Near,
      },
      Medium: {
        visitors: totalVisitors.Medium,
        timeSpent: avgTimeSpent.Medium,
        peakHour: peakHours.Medium,
      },
      Far: {
        visitors: totalVisitors.Far,
        timeSpent: avgTimeSpent.Far,
        peakHour: peakHours.Far,
      },
    }
  }, [data])

  // Update stats when active zone changes
  useEffect(() => {
    setStats(zoneStats[activeZone])
  }, [activeZone, zoneStats,total])

  const zones = [
    { label: "Near", value: total?.Near },
    { label: "Medium", value: total?.Medium },
    { label: "Far", value: total?.Far },
  ];
  return (
    <>
 <div className="flex px-4 py-5 rounded-2xl bg-white justify-between mb-10">
  {zones.map((zone, index) => (
    <div key={index} className="flex flex-row gap-5 items-center">
      <div className="bg-slate-200 p-2 rounded-full">
        <TrendingDown />
      </div>
      <div>
        <div className="text-2xl">{zone?.value?.toLocaleString()}</div>
        <div className="text-sm text-gray-400">Total {zone.label}</div>
      </div>
    </div>
  ))}
</div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Proximity & Time</CardTitle>
          <p className="text-sm text-muted-foreground">
            Get details about each area&apos;s proximity and time data points
          </p>
        </CardHeader>
        <CardContent className="flex justify-center items-center">
          <div className="relative w-[350px] h-[350px]">
            {/* Far Zone */}
            <div
              className={`absolute inset-0 rounded-full bg-blue-400 opacity-70 cursor-pointer transition-opacity duration-200 ${activeZone === "Far" ? "opacity-90" : "opacity-70"}`}
              onMouseEnter={() => setActiveZone("Far")}
            />

            {/* Medium Zone */}
            <div
              className={`absolute top-[15%] left-[30%] right-[1%] bottom-[15%] rounded-full bg-blue-500 opacity-70 cursor-pointer transition-opacity duration-200 ${activeZone === "Medium" ? "opacity-90" : "opacity-70"}`}
              onMouseEnter={() => setActiveZone("Medium")}
            />

            {/* Near Zone */}
            <div
              className={`absolute top-[30%] left-[60%] right-[1%] bottom-[30%] rounded-full bg-blue-800 opacity-70 cursor-pointer transition-opacity duration-200 ${activeZone === "Near" ? "opacity-90" : "opacity-70"}`}
              onMouseEnter={() => setActiveZone("Near")}
            />

            {/* Zone Labels */}
            <div className="absolute top-1/2 left-[15%] transform -translate-y-1/2 text-white font-semibold">Far</div>
            <div className="absolute top-1/2 left-[45%] transform -translate-y-1/2 text-white font-semibold">Mid</div>
            <div className="absolute top-1/2 left-[75%] transform -translate-y-1/2 text-white font-semibold">Near</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Quick Stats</CardTitle>
          <p className="text-sm text-muted-foreground">
            Get high-level insights related to proximity and time in specific areas
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-3xl">{activeZone}</h3>
              <p className="text-sm text-muted-foreground">
                {activeZone === "Near" && "Inside the activation (roughly within 5 feet)"}
                {activeZone === "Medium" && "Close to the activation (roughly within 10 feet)"}
                {activeZone === "Far" && "Inside or at the activation (roughly within 20 feet)"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
            <Card>
                <CardContent className="">
                  <div className="text-2xl">{stats.visitors.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Visitors</div>
                </CardContent>
              </Card>
              <Card className="col-span-1">
            
                <CardContent className="">
                  <div className="text-2xl">{stats.peakHour}</div>
                  <div className="text-sm text-muted-foreground">Peak Hour</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  )
}
