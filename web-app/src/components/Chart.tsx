import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import type { Message } from '../types/Message';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

export interface Metric {
  timestamp: number;
  processing: number;
  processed: number;
  date: string;
  generated: boolean;
}

interface ChartProps {
  messages: Message[];
}

interface ProcessingSpeedChartProps {
  metrics: Metric[];
}

export const MessageChart = ({ messages }: ChartProps) => {
  const groupByDay = (messages: Message[]) => {
    const groups: { [key: string]: number } = {};
    
    messages.forEach(message => {
      const date = new Date(message.timestamp).toISOString().split('T')[0];
      groups[date] = (groups[date] || 0) + 1;
    });
    
    return groups;
  };

  const dailyData = groupByDay(messages);
  const sortedDates = Object.keys(dailyData).sort();

  const data = {
    labels: sortedDates,
    datasets: [
      {
        label: 'Количество сообщений',
        data: sortedDates.map(date => dailyData[date]),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Активность сообщений по дням',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return <Line data={data} options={options} />;
};

export const ProcessingSpeedChart = ({ metrics }: ProcessingSpeedChartProps) => {
  // Данные уже заполнены в парсере, просто сортируем по времени
  const sortedMetrics = [...metrics].sort((a, b) => a.timestamp - b.timestamp);

  const data = {
    labels: sortedMetrics.map(item => new Date(item.timestamp)),
    datasets: [
      {
        label: 'Обработано за час',
        data: sortedMetrics.map(item => Math.max(0, item.processed)),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
        pointRadius: 3,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        yAxisID: 'y',
      },
      {
        label: 'В обработке',
        data: sortedMetrics.map(item => item.processing),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.1,
        pointRadius: 3,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Скорость обработки записей по часам',
      },
      tooltip: {
        callbacks: {
          title: (context: Array<{parsed: {x: number}}>) => {
            const date = new Date(context[0].parsed.x);
            return date.toLocaleString('ru-RU', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            });
          },
          label: (context: {dataset: {label?: string}, parsed: {y: number}}) => {
            const value = context.parsed.y.toLocaleString();
            if (context.dataset.label === 'Обработано за час') {
              return `Обработано: ${value} записей`;
            } else {
              return `В обработке: ${value} записей`;
            }
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'hour' as const,
          displayFormats: {
            hour: 'dd.MM HH:mm'
          }
        },
        grid: {
          display: true,
          drawBorder: true,
          drawOnChartArea: true,
          drawTicks: true,
          borderColor: 'rgba(0, 0, 0, 0.1)',
          color: (context: {tick: {value: number}}) => {
            const date = new Date(context.tick.value);
            // Если это начало дня (00:00), делаем линию более заметной
            return date.getHours() === 0 ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)';
          },
          lineWidth: (context: {tick: {value: number}}) => {
            const date = new Date(context.tick.value);
            // Если это начало дня (00:00), делаем линию толще
            return date.getHours() === 0 ? 2 : 1;
          }
        },
        title: {
          display: true,
          text: 'Время'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Обработано за час',
          color: 'rgb(59, 130, 246)'
        },
        ticks: {
          color: 'rgb(59, 130, 246)',
          callback: function(value: string | number) {
            return Number(value).toLocaleString();
          }
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        beginAtZero: true,
        title: {
          display: true,
          text: 'В обработке',
          color: 'rgb(239, 68, 68)'
        },
        ticks: {
          color: 'rgb(239, 68, 68)',
          callback: function(value: string | number) {
            return Number(value).toLocaleString();
          }
        },
        grid: {
          drawOnChartArea: true,
        },
      },
    },
  };

  return <Line data={data} options={options} />;
};