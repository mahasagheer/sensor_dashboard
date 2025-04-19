// components/LineChart.js
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Helper function to format hourly labels (e.g., "6:00AM")
const formatHourLabel = (timestamp) => {
  const date = new Date(timestamp);
  const currentHour = date.getHours();
  
  const formatHour = (hour) => {
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${displayHour}:00${ampm}`;
  };
  
  return formatHour(currentHour);
};

export default function LineChart({ data }) {
  // Create hourly labels
  const hourlyLabels = data?.map(item => formatHourLabel(item.Timestamp));
  
  // Get the values for each category
  const nearValues = data.map(item => item.Near);
  const mediumValues = data.map(item => item.Medium);
  const farValues = data.map(item => item.Far);

  const chartData = {
    labels: hourlyLabels,
    datasets: [
      {
        label: 'Near',
        data: nearValues,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1
      },
      {
        label: 'Medium',
        data: mediumValues,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'Far',
        data: farValues,
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
        text: 'Beacon Distance Metrics Over Time',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            // Show actual time in tooltip
            const date = new Date(data[context.dataIndex].Timestamp);
            let hours = date.getHours();
            const minutes = date.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            const paddedMinutes = minutes < 10 ? `0${minutes}` : minutes;
            const actualTime = `${hours}:${paddedMinutes}${ampm}`;
            
            return `${context.dataset.label}: ${context.raw} (at ${actualTime})`;
          }
        }
      }
    },
    scales: {
      y: {

        title: {
          display: true,
          text: 'Count'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Timestamp'
        },
        ticks: {
          // Show only one label per hour to avoid duplication
          callback: (value, index) => {
            if (index === 0 || 
                new Date(data[index].Timestamp).getHours() !== 
                new Date(data[index-1].Timestamp).getHours()) {
              return hourlyLabels[index];
            }
            return '';
          }
        }
      }
    }
  };

  return <Line options={options} data={chartData} />;
}