import supabase from "@/lib/supabase"
import dynamic from "next/dynamic"
import FileUploader from "@/components/FileUploader"
import ProximityChart from "@/components/ProximityChart"

// Dynamically import the CustomHeatmap component with no SSR
const CustomHeatmap = dynamic(() => import("@/components/CustomHeatmap"), {
  loading: () => <div className="min-h-[400px] flex items-center justify-center">Loading heatmap...</div>,
})

export default async function Home() {
  const { data: sensor_data, error } = await supabase.from("sensor_data_duplicate").select("*")

  if (error) {
    console.log("Error fetching data:", error)
    return <div>Error loading data</div>
  }

  // Filter sensor data to include only entries between 6AM and 10PM
  const filteredData = sensor_data.filter((entry) => {
    const timestamp = new Date(entry.Timestamp)
    const hour = timestamp.getHours()
    return hour >= 6 && hour <= 22 // 6 AM to 10 PM
  })
  console.log(filteredData);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
        {/* <FileUploader/> */}
        <ProximityChart data={filteredData}/>

        </div>
        <CustomHeatmap sensorData={filteredData} />
      </div>
    </div>
  )
}
