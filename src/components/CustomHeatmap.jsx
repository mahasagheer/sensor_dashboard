"use client"
import { useState, useEffect } from "react";

export default function CustomHeatmap() {
  const [heatmapData, setHeatmapData] = useState({ 
    data: [], 
    positions: [], 
    hours: [] 
  });
  const [hoveredCell, setHoveredCell] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        const response = await fetch('/api/heatmap');
        const data = await response.json();
        setHeatmapData(data);
      } catch (error) {
        console.error("Failed to fetch heatmap data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, []);

  const getColor = (value) => {
    const maxValue = Math.max(...heatmapData.data.flat(), 1);
    const opacity = Math.min(value / maxValue, 1);
    return `rgba(0, 151, 230, ${opacity.toFixed(2)})`;
  };

  if (loading) return <div>Loading heatmap...</div>;

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
          {heatmapData.data.map((row, rowIndex) => (
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
            {heatmapData.hours.map(hour => (
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
        {/* <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-[rgba(0,151,230,0.1)]"></div>
          <span className="text-xs">0</span>
        </div> */}
        <div className="w-4 h-[240px] bg-gradient-to-b from-[rgba(0,151,230,0.1)] to-[rgba(0,151,230,1)]"></div>
        {/* <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-[rgba(0,151,230,1)]"></div>
          <span className="text-xs">256</span>
        </div> */}
      </div>
    </div>    </div>
  );
}