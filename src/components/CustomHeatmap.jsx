"use client"
import { useState, useEffect } from "react";

export default function CustomHeatmap({ sensorData, viewMode = 'hourly', selectedOption }) {
  console.log("SENSORdata", sensorData);
  const [heatmapData, setHeatmapData] = useState({ 
    data: [], 
    positions: ["near", "mid", "far"], 
    labels: [],
    title: "Hourly Sensor Totals Heatmap",
    description: "Showing total counts from 6:00 to 22:00"
  });
  const [hoveredCell, setHoveredCell] = useState(null);

  useEffect(() => {
    if (!sensorData || sensorData.length === 0) return;

    const processData = () => {
      if (viewMode === 'hourly' || selectedOption === 'aggregate') {
        // Process hourly data
        const hourlyData = {};
        
        sensorData.forEach((entry) => {
          const timestamp = new Date(entry.Timestamp);
          const hour = selectedOption === 'aggregate' 
            ? timestamp.getUTCHours() // Use UTC for aggregate to match source data
            : timestamp.getHours();    // Use local time for other options
          
          // Skip filtering for aggregate since parent already handled it
          if (selectedOption !== 'aggregate' && (hour < 6 || hour > 21)) return;

          if (!hourlyData[hour]) {
            hourlyData[hour] = { near: 0, mid: 0, far: 0 };
          }

          // Handle both property naming conventions
          hourlyData[hour].near += Number(entry.Near || entry.near) || 0;
          hourlyData[hour].mid += Number(entry.Medium || entry.medium) || 0;
          hourlyData[hour].far += Number(entry.Far || entry.far) || 0;
        });

        // Determine hours range based on option
        const hours = selectedOption === 'aggregate'
          ? Object.keys(hourlyData).map(Number).sort((a, b) => a - b)
          : Array.from({ length: 16 }, (_, i) => i + 6); // 6AM to 10PM for non-aggregate

        const data = heatmapData.positions.map(position => {
          return hours.map(hour => hourlyData[hour]?.[position] || 0);
        });

        setHeatmapData({
          data,
          positions: heatmapData.positions,
          labels: hours.map(hour => `${hour}:00`),
          title: selectedOption === 'aggregate' 
            ? "Average Hourly Sensor Totals" 
            : "Hourly Sensor Totals Heatmap",
          description: selectedOption === 'aggregate'
            ? "Showing average counts by hour across all days"
            : "Showing total counts from 6:00 to 22:00"
        });
      } else {
        // Process daily data (unchanged from original)
        const dailyData = {};
        
        sensorData.forEach((entry) => {
          const dateStr = new Date(entry.Timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });
          
          if (!dailyData[dateStr]) {
            dailyData[dateStr] = { near: 0, mid: 0, far: 0 };
          }

          dailyData[dateStr].near += Number(entry.Near || entry.near) || 0;
          dailyData[dateStr].mid += Number(entry.Medium || entry.medium) || 0;
          dailyData[dateStr].far += Number(entry.Far || entry.far) || 0;
        });

        const dates = Object.keys(dailyData).sort((a, b) => 
          new Date(a) - new Date(b)
        );
        
        const data = heatmapData.positions.map(position => {
          return dates.map(date => dailyData[date]?.[position] || 0);
        });

        setHeatmapData({
          data,
          positions: heatmapData.positions,
          labels: dates,
          title: "Daily Sensor Totals Heatmap",
          description: "Showing total counts by date"
        });
      }
    };

    processData();
  }, [sensorData, viewMode, selectedOption]);

  const getColor = (value) => {
    const maxValue = Math.max(...heatmapData.data.flat(), 1);
    const opacity = Math.min(value / maxValue, 1);
    return `rgba(0, 151, 230, ${opacity.toFixed(2)})`;
  };

  if (!sensorData || sensorData.length === 0) {
    return <div className="bg-white p-6 rounded-lg shadow-md">No sensor data available</div>;
  }

  return (
    <div className="bg-white">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">{heatmapData.title}</h2>
        <p className="text-sm text-gray-600">{heatmapData.description}</p>
      </div>
    
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="relative">
            {/* Heatmap grid */}
            {heatmapData?.data?.map((row, rowIndex) => (
              <div key={rowIndex} className="flex items-center">
                <div className={`text-right text-sm font-medium ${viewMode === "daily" ? "pr-1 w-6" : "w-25 pr-2"}`}>
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
            
            {/* Labels (hours or dates) */}
            <div className={`flex ${viewMode === "daily" ? "ml-6" : "ml-25"}`}>
              {heatmapData?.labels?.map((label, index) => (
                <div key={index} className="w-14 text-center text-xs">
                  {label}
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
                {viewMode === 'hourly' ? 'Time' : 'Date'}: {heatmapData.labels[hoveredCell.col]}
                <br />
                Count: {hoveredCell.value}
              </div>
            )}
          </div>
        </div>
    
        {/* Color legend */}
        <div className="flex flex-col">
          <div className="w-4 h-[240px] bg-gradient-to-b from-[rgba(0,151,230,0.1)] to-[rgba(0,151,230,1)]"></div>
        </div>
      </div>
    </div>
  );
}