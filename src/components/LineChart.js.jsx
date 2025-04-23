"use client"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useMemo } from 'react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function LineChart({ data, viewMode = 'hourly' }) {
  // Process data based on view mode
  console.log(data);
  const { labels, processedData } = useMemo(() => {
    if (viewMode === 'hourly') {
      // Filter data to only include hours between 6 and 22 (6AM to 10PM)
      const filteredData = data.filter(item => {
        const hour = new Date(item.Timestamp).getHours();
        return hour >= 6 && hour <= 22;
      });

      // Group data by hour (6-22)
      const hourlyData = {};
      const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6 to 22

      // Initialize hourly data
      hours.forEach(hour => {
        hourlyData[hour] = {
          Near: 0,
          Medium: 0,
          Far: 0,
          count: 0,
          timestamp: new Date().setHours(hour, 0, 0, 0) // Dummy timestamp with correct hour
        };
      });

      // Aggregate data by hour
      filteredData.forEach(item => {
        const hour = new Date(item.Timestamp).getHours();
        if (hour >= 6 && hour <= 22) {
          hourlyData[hour].Near += item.Near;
          hourlyData[hour].Medium += item.Medium;
          hourlyData[hour].Far += item.Far;
          hourlyData[hour].count++;
        }
      });

      // Format labels as "6:00", "7:00", etc.
      const labels = hours.map(hour => {
        return `${hour % 12 === 0 ? 12 : hour % 12}:00${hour >= 12 ? 'PM' : 'AM'}`;
      });

      return {
        labels,
        processedData: hours.map(hour => hourlyData[hour])
      };
    } else {
      // Daily view - group by date and sum values
      const dailyData = {};
      
      // First create an object with Date objects as keys for proper sorting
      const dateObjects = {};
      
      data.forEach(item => {
        const date = new Date(item.Timestamp);
        // Use the beginning of the day for grouping
        const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        
        if (!dateObjects[dateKey]) {
          dateObjects[dateKey] = {
            dateObj: new Date(dateKey),
            Near: 0,
            Medium: 0,
            Far: 0,
            count: 0
          };
        }
        
        dateObjects[dateKey].Near += item.Near;
        dateObjects[dateKey].Medium += item.Medium;
        dateObjects[dateKey].Far += item.Far;
        dateObjects[dateKey].count++;
      });
    
      // Sort dates chronologically
      const sortedDates = Object.keys(dateObjects)
        .map(key => parseInt(key))
        .sort((a, b) => a - b)
        .map(time => dateObjects[time]);
     console.log("sort",sortedDates)
      // Format labels as "26 Mar"
      const labels = sortedDates.map(item => {
        return item.dateObj.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short'
        });
      });
      console.log("labels",labels);
    
      return {
        labels,
        processedData: sortedDates
      };
    }
  }, [data, viewMode]);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Near',
        data: processedData.map(item => item.Near),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1
      },
      {
        label: 'Medium',
        data: processedData.map(item => item.Medium),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'Far',
        data: processedData.map(item => item.Far),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

// In your LineChart component, update the options configuration:

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: viewMode === 'hourly' 
        ? 'Hourly Beacon Distance Metrics (6AM-10PM)' 
        : 'Daily Beacon Distance Metrics',
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          const label = context.dataset.label || '';
          const value = context.raw;
          if (viewMode === 'hourly') {
            const hour = context.dataIndex + 6;
            const timeLabel = `${hour % 12 === 0 ? 12 : hour % 12}:00${hour >= 12 ? 'PM' : 'AM'}`;
            return `${label}: ${value} (at ${timeLabel})`;
          } else {
            // For daily view, use the pre-formatted label
            return `${label}: ${value} (on ${labels[context.dataIndex]})`;
          }
        }
      }
    }
  },
  scales: {
    y: {
      title: {
        display: true,
        text: 'Count'
      },
      beginAtZero: true,
      suggestedMax: 15
    },
    x: {
      type: viewMode === 'hourly' ? 'category' : 'category', // Explicitly set to category
      title: {
        display: true,
        text: viewMode === 'hourly' ? 'Time of Day (6AM-10PM)' : 'Date'
      },
      ticks: {
        // For daily view, use our formatted labels
        callback: viewMode === 'hourly' ? (value, index) => {
          return labels[index];
        } : (value, index) => {
          return labels[index]; // Use the formatted date labels
        }
      }
    }
  }
};

  return <Line options={options} data={chartData} />;
}