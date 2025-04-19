"use client"
import { useState, useEffect } from "react";

export default function CustomHeatmap({ sensorData }) {
  const [heatmapData, setHeatmapData] = useState({ 
    data: [], 
    positions: [], 
    hours: [] 
  });
  const [hoveredCell, setHoveredCell] = useState(null);
  const [loading, setLoading] = useState(false); // No longer loading from API

  useEffect(() => {
    if (!sensorData || sensorData.length === 0) return;

    // Process the sensor data into heatmap format
    const processHeatmapData = () => {
      const hourlyData = {};
      
      // Process each sensor data entry
      sensorData.forEach((entry) => {
        const timestamp = new Date(entry.Timestamp);
        const hour = timestamp.getHours();
        
        // Filter to only include hours between 6AM and 10PM (6-22)
        if (hour < 6 || hour > 21) return;

        if (!hourlyData[hour]) {
          hourlyData[hour] = { near: 0, mid: 0, far: 0 };
        }

        hourlyData[hour].near += Number(entry.Near) || 0;
        hourlyData[hour].mid += Number(entry.Medium) || 0;
        hourlyData[hour].far += Number(entry.Far) || 0;
      });

      // Format the data for the heatmap
      const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6AM to 10PM
      const positions = ["near", "mid", "far"];
      
      const data = positions.map(position => {
        return hours.map(hour => hourlyData[hour]?.[position] || 0);
      });

      setHeatmapData({
        data,
        positions,
        hours
      });
    };

    processHeatmapData();
  }, [sensorData]);

  const getColor = (value) => {
    const maxValue = Math.max(...heatmapData.data.flat(), 1);
    const opacity = Math.min(value / maxValue, 1);
    return `rgba(0, 151, 230, ${opacity.toFixed(2)})`;
  };

  if (!sensorData || sensorData.length === 0) {
    return <div className="bg-white p-6 rounded-lg shadow-md">No sensor data available</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Hourly Sensor Totals Heatmap</h2>
        <p className="text-sm text-gray-600">Showing total counts from 6:00 to 22:00</p>
      </div>
    
      {/* Flex container for heatmap + legend (side by side) */}
      <div className="flex justify-between items-start mx-10">
        {/* Heatmap (left side) */}
        <div className="flex-1">
          <div className="relative">
            
            {/* Heatmap grid */}
            {heatmapData?.data?.map((row, rowIndex) => (
              <div key={rowIndex} className="flex items-center">
                <div className="w-16 text-right pr-2 text-sm font-medium">
                  {heatmapData.positions[rowIndex]}
                </div>
                <div className="flex">
                  {row.map((value, colIndex) => (
                    <div
                      key={colIndex}
                      className="w-14 h-20 flex items-center justify-center text-xs border border-gray-100"
                      style={{ backgroundColor: getColor(value) }}
                      onMouseEnter={() => setHoveredCell({ 
                        row: rowIndex, 
                        col: colIndex, 
                        value 
                      })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {value}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {/* Hour labels */}
            <div className="flex ml-16">
              {heatmapData?.hours?.map(hour => (
                <div key={hour} className="w-14 text-center text-xs">
                  {hour}:00
                </div>
              ))}
            </div>
    
            {/* Tooltip */}
            {hoveredCell && (
              <div
                className="absolute bg-white bg-opacity-80 text-black p-2 rounded text-xs z-10"
                style={{
                  top: `${hoveredCell.row * 40 + 60}px`,
                  left: `${hoveredCell.col * 40 + 80}px`,
                }}
              >
                Position: {heatmapData.positions[hoveredCell.row]}
                <br />
                Time: {heatmapData.hours[hoveredCell.col]}:00
              </div>
            )}
          </div>
        </div>
    
        {/* Color legend (right side) */}
        <div className=" flex flex-col">
          <div className="w-4 h-[240px] bg-gradient-to-b from-[rgba(0,151,230,0.1)] to-[rgba(0,151,230,1)]"></div>
        </div>
      </div>
    </div>
  );
}