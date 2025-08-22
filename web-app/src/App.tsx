import { useState, useRef } from 'react';
import { ProcessingSpeedChart, SessionsChart, type Metric, type Session } from './components/Chart';
import { FileUpload } from './components/FileUpload';
import { ExportPDF } from './components/ExportPDF';
import './App.css';

interface MetricsData {
  exportDate: string;
  totalRecords: number;
  totalSessions: number;
  metrics: Metric[];
  sessions: Session[];
}

function App() {
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const sessionsRef = useRef<HTMLDivElement>(null);

  const handleMetricsFileLoad = (jsonData: MetricsData) => {
    setMetricsData(jsonData);
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Анализ данных
          </h1>
          
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Загрузка файла метрик</h2>
            
            <div className="flex gap-4 items-start">
              <FileUpload
                onFileLoad={handleMetricsFileLoad}
                accept=".json"
                label="Загрузить pan_metrics.json"
                description="Файл с данными о скорости обработки записей"
              />
              
              {metricsData && (
                <ExportPDF 
                  chartRef={chartRef}
                  sessionsRef={sessionsRef}
                  data={{
                    totalRecords: metricsData.totalRecords,
                    totalSessions: metricsData.totalSessions,
                    exportDate: metricsData.exportDate
                  }}
                />
              )}
            </div>
          </div>

          {metricsData && (
            <div className="text-gray-600 mb-4">
              <p>Дата экспорта метрик: {new Date(metricsData.exportDate).toLocaleString('ru-RU')}</p>
              <p>Всего записей в метриках: {metricsData.totalRecords}</p>
              <p>Обнаружено сессий: {metricsData.totalSessions}</p>
            </div>
          )}

        </header>

        <div className="space-y-8">
          {metricsData && (
            <>
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Скорость обработки записей
                </h2>
                <div 
                  ref={chartRef} 
                  className="bg-white p-6 rounded-lg shadow-md"
                >
                  <ProcessingSpeedChart metrics={metricsData.metrics} />
                </div>
              </section>

              {metricsData.sessions && metricsData.sessions.length > 0 && (
                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Анализ сессий обработки
                  </h2>
                  <div ref={sessionsRef} className="bg-white p-6 rounded-lg shadow-md">
                    <SessionsChart sessions={metricsData.sessions} />
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;