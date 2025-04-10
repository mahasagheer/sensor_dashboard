import supabase from "@/lib/supabase";

export async function GET(request) {
  try {
    // 1. Fetch raw sensor data from Supabase
    const { data: sensorData, error } = await supabase
      .from('sensor_data_duplicate')
      .select('*');
    
    if (error) throw error;

    // 2. Process data (same logic as your frontend, but on server)
    const hourlyData = {};
    
    sensorData.forEach((entry) => {
      const timestamp = new Date(entry.Timestamp);
      const hour = timestamp.getHours();
      
      if (hour < 6 || hour > 21) return;

      if (!hourlyData[hour]) {
        hourlyData[hour] = { near: 0, mid: 0, far: 0 };
      }

      hourlyData[hour].near += Number(entry.Near) || 0;
      hourlyData[hour].mid += Number(entry.Medium) || 0;
      hourlyData[hour].far += Number(entry.Far) || 0;
    });

    // 3. Store aggregated data in Supabase
    const { data: storedData, error: storeError } = await supabase
      .from('heatmap_data')
      .upsert(
        Object.entries(hourlyData).map(([hour, counts]) => ({
          hour: parseInt(hour),
          near_count: counts.near,
          mid_count: counts.mid,
          far_count: counts.far
        }))
      )
      .select();

    if (storeError) throw storeError;

    // 4. Return formatted heatmap data
    const hours = Array.from({ length: 16 }, (_, i) => i + 6);
    const positions = ["near", "mid", "far"];
    
    const data = positions.map(position => {
      return hours.map(hour => hourlyData[hour]?.[position] || 0);
    });

    return Response.json({
      data,
      positions,
      hours
    });

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}