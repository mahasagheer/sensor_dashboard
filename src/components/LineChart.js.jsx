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

export default function LineChart({ data, viewMode = 'hourly', isAggregate = false }) {
  // Process data based on view mode and aggregate status
  const { labels, processedData } = useMemo(() => {
    if (isAggregate) {
      // Handle aggregate data - already pre-processed with HourLabel
      const labels = data.map(item => item.HourLabel);
      return {
        labels,
        processedData: data.map(item => ({
          Near: item.Near,
          Medium: item.Medium,
          Far: item.Far,
          count: item._meta?.daysWithData || 1
        }))
      };
    }
    else if (viewMode === 'hourly') {
      // Original hourly processing for non-aggregate data
      const filteredData = data.filter(item => {
        const hour = new Date(item.Timestamp).getHours();
        return hour >= 6 && hour <= 22;
      });

      const hourlyData = {};
      const hours = Array.from({ length: 17 }, (_, i) => i + 6);

      hours.forEach(hour => {
        hourlyData[hour] = {
          Near: 0,
          Medium: 0,
          Far: 0,
          count: 0,
          timestamp: new Date().setHours(hour, 0, 0, 0)
        };
      });

      filteredData.forEach(item => {
        const hour = new Date(item.Timestamp).getHours();
        if (hour >= 6 && hour <= 22) {
          hourlyData[hour].Near += item.Near;
          hourlyData[hour].Medium += item.Medium;
          hourlyData[hour].Far += item.Far;
          hourlyData[hour].count++;
        }
      });

      const labels = hours.map(hour => {
        return `${hour % 12 === 0 ? 12 : hour % 12}:00${hour >= 12 ? 'PM' : 'AM'}`;
      });

      return {
        labels,
        processedData: hours.map(hour => hourlyData[hour])
      };
    } else {
      // Daily view processing (unchanged)
      const dailyData = {};
      const dateObjects = {};
      
      data.forEach(item => {
        const date = new Date(item.Timestamp);
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
    
      const sortedDates = Object.keys(dateObjects)
        .map(key => parseInt(key))
        .sort((a, b) => a - b)
        .map(time => dateObjects[time]);
    
      const labels = sortedDates.map(item => {
        return item.dateObj.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short'
        });
      });
    
      return {
        labels,
        processedData: sortedDates
      };
    }
  }, [data, viewMode, isAggregate]);

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

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: isAggregate 
          ? 'Average Beacon Distance Metrics' 
          : viewMode === 'hourly' 
            ? 'Hourly Beacon Distance Metrics (6AM-10PM)' 
            : 'Daily Beacon Distance Metrics',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.raw;
            if (isAggregate) {
              return `${label}: ${value} (avg)`;
            } else if (viewMode === 'hourly') {
              const hour = context.dataIndex + 6;
              const timeLabel = `${hour % 12 === 0 ? 12 : hour % 12}:00${hour >= 12 ? 'PM' : 'AM'}`;
              return `${label}: ${value} (at ${timeLabel})`;
            } else {
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
          text: isAggregate ? 'Average Count' : 'Count'
        },
        beginAtZero: true,
        suggestedMax: Math.max(
          ...processedData.map(item => Math.max(item.Near, item.Medium, item.Far)),
          15
        )
      },
      x: {
        title: {
          display: true,
          text: isAggregate 
            ? 'Time of Day' 
            : viewMode === 'hourly' 
              ? 'Time of Day (6AM-10PM)' 
              : 'Date'
        },
        ticks: {
          callback: (value, index) => labels[index]
        }
      }
    }
  };

  return <Line options={options} data={chartData} />;
}