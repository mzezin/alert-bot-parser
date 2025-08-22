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

export interface Session {
  startDate: string;
  endDate: string;
  durationHours: number;
  maxProcessing: number;
  avgProcessed: number;
  totalMetrics: number;
}

interface ChartProps {
  messages: Message[];
}

interface ProcessingSpeedChartProps {
  metrics: Metric[];
}

interface SessionsChartProps {
  sessions: Session[];
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

export const SessionsChart = ({ sessions }: SessionsChartProps) => {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Нет данных о сессиях для отображения
      </div>
    );
  }

  // Сортируем сессии по дате начала
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const data = {
    labels: sortedSessions.map(session => new Date(session.startDate)),
    datasets: [
      {
        label: 'Макс. в обработке',
        data: sortedSessions.map(session => session.maxProcessing),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.1,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        yAxisID: 'y',
      },
      {
        label: 'Длительность (часы)',
        data: sortedSessions.map(session => session.durationHours),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.1,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(168, 85, 247)',
        yAxisID: 'y1',
      },
      {
        label: 'Ср. обработано',
        data: sortedSessions.map(session => session.avgProcessed),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.1,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(245, 158, 11)',
        yAxisID: 'y2',
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Анализ сессий обработки',
      },
      tooltip: {
        callbacks: {
          title: (context: Array<{parsed: {x: number}}>) => {
            const date = new Date(context[0].parsed.x);
            return `Сессия от ${date.toLocaleString('ru-RU', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}`;
          },
          label: (context: {dataset: {label?: string}, parsed: {y: number}}) => {
            const value = context.parsed.y;
            const label = context.dataset.label || '';
            
            if (label === 'Макс. в обработке') {
              return `${label}: ${value.toLocaleString()} записей`;
            } else if (label === 'Длительность (часы)') {
              return `${label}: ${value} ч`;
            } else if (label === 'Ср. обработано') {
              return `${label}: ${value.toLocaleString()} записей/ч`;
            }
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
          displayFormats: {
            day: 'dd.MM.yyyy'
          }
        },
        title: {
          display: true,
          text: 'Дата начала сессии'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Макс. в обработке',
          color: 'rgb(34, 197, 94)'
        },
        ticks: {
          color: 'rgb(34, 197, 94)',
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
          text: 'Длительность (часы)',
          color: 'rgb(168, 85, 247)'
        },
        ticks: {
          color: 'rgb(168, 85, 247)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      y2: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Ср. обработано',
          color: 'rgb(245, 158, 11)'
        },
        ticks: {
          color: 'rgb(245, 158, 11)',
          callback: function(value: string | number) {
            return Number(value).toLocaleString();
          }
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return <Line data={data} options={options} />;
};