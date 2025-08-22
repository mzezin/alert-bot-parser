import 'dotenv/config';
import telegram from 'telegram';
const { TelegramClient, Api } = telegram;
import { StringSession } from 'telegram/sessions/index.js';
import input from 'input';
import fs from 'fs/promises';
import path from 'path';

// Конфигурация из переменных окружения
const apiId = parseInt(process.env.API_ID || '');
const apiHash = process.env.API_HASH || '';
const groupId = process.env.GROUP_ID || '';
const stringSession = new StringSession(process.env.SESSION_STRING || '');

class TelegramParser {
  constructor() {
    this.client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });
  }

  async connect() {
    console.log('Подключение к Telegram...');
    await this.client.start({
      phoneNumber: async () => await input.text('Введите номер телефона: '),
      password: async () => await input.text('Введите пароль (если есть): '),
      phoneCode: async () => await input.text('Введите код из SMS: '),
      onError: (err) => console.log(err),
    });
    
    console.log('Успешно подключено!');
    if (!process.env.SESSION_STRING) {
      console.log('Сохраните эту строку сессии в .env как SESSION_STRING:');
      console.log(this.client.session.save());
    }
  }

  async parseMessages(daysBack = 30) {
    console.log(`Парсинг сообщений из группы ${groupId}...`);
    
    const toDate = Math.floor(Date.now() / 1000);
    const fromDate = toDate - (daysBack * 24 * 60 * 60);
    
    const messages = [];
    let offsetId = 0;
    
    while (true) {
      const result = await this.client.invoke(
        new Api.messages.GetHistory({
          peer: parseInt(groupId),
          offsetId: offsetId,
          offsetDate: 0,
          addOffset: 0,
          limit: 100,
          maxId: 0,
          minId: 0,
          hash: 0,
        })
      );
      
      if (result.messages.length === 0) break;
      
      for (const message of result.messages) {
        if (message.date < fromDate) {
          return messages;
        }
        
        if (message.date <= toDate && this.isPANMessage(message)) {
          const parsedMessage = this.parseMessage(message);
          if (parsedMessage) {
            messages.push(parsedMessage);
          }
        }
      }
      
      offsetId = result.messages[result.messages.length - 1].id;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return messages;
  }

  isPANMessage(message) {
    const text = message.message || '';
    const panPattern = /Панов в обработке ВСЕ - (-?\d+).*?Панов обработано за час ВСЕ - (-?\d+)/i;
    return panPattern.test(text);
  }

  parseMessage(message) {
    const text = message.message || '';
    const panPattern = /Панов в обработке ВСЕ - (-?\d+).*?Панов обработано за час ВСЕ - (-?\d+)/i;
    const match = text.match(panPattern);
    
    if (!match) {
      return null;
    }

    return {
      timestamp: message.date * 1000,
      processing: parseInt(match[1]),
      processed: parseInt(match[2]),
      date: new Date(message.date * 1000).toISOString(),
      generated: false
    };
  }

  fillMissingHours(metrics) {
    if (metrics.length === 0) return [];
    
    const sortedMetrics = [...metrics].sort((a, b) => a.timestamp - b.timestamp);
    const filledData = [];
    
    const startDate = new Date(sortedMetrics[0].timestamp);
    const endDate = new Date(sortedMetrics[sortedMetrics.length - 1].timestamp);
    
    const current = new Date(startDate);
    current.setMinutes(0, 0, 0);
    
    let lastProcessing = 0;
    
    while (current <= endDate) {
      const currentHour = current.getTime();
      const metric = sortedMetrics.find(m => {
        const metricHour = new Date(m.timestamp);
        metricHour.setMinutes(0, 0, 0);
        return metricHour.getTime() === currentHour;
      });
      
      if (metric) {
        lastProcessing = metric.processing;
        filledData.push(metric);
      } else {
        // Генерируем запись для пропущенного часа
        filledData.push({
          timestamp: currentHour,
          processing: lastProcessing,
          processed: 0,
          date: new Date(currentHour).toISOString(),
          generated: true
        });
      }
      
      current.setHours(current.getHours() + 1);
    }
    
    return filledData;
  }

  async saveToJson(data, filename = 'pan_metrics.json', sessions = []) {
    const dataDir = path.join('./output');
    await fs.mkdir(dataDir, { recursive: true });
    
    const filledData = this.fillMissingHours(data);
    
    const filepath = path.join(dataDir, filename);
    const jsonData = {
      exportDate: new Date().toISOString(),
      totalRecords: filledData.length,
      originalRecords: data.length,
      generatedRecords: filledData.filter(m => m.generated).length,
      totalSessions: sessions.length,
      metrics: filledData,
      sessions: sessions
    };
    
    await fs.writeFile(filepath, JSON.stringify(jsonData, null, 2));
    console.log(`Данные сохранены в ${filepath}`);
    console.log(`Найдено записей с метриками PAN: ${data.length}`);
    console.log(`Всего записей с заполненными пробелами: ${filledData.length}`);
    console.log(`Сгенерировано записей: ${filledData.filter(m => m.generated).length}`);
    console.log(`Обнаружено сессий: ${sessions.length}`);
    
    if (sessions.length > 0) {
      console.log('\nСессии:');
      sessions.forEach((session, index) => {
        console.log(`  ${index + 1}. ${session.startDate} - ${session.endDate} (${session.durationHours}ч)`);
        console.log(`     Макс. в обработке: ${session.maxProcessing.toLocaleString()}, Ср. обработано: ${session.avgProcessed.toLocaleString()}`);
      });
    }
  }

  async saveToCsv(data, filename = 'pan_metrics.csv') {
    const dataDir = path.join('./output');
    await fs.mkdir(dataDir, { recursive: true });
    
    const filledData = this.fillMissingHours(data);
    
    // CSV заголовки
    const headers = ['timestamp', 'date', 'processing', 'processed', 'generated'];
    
    // Формируем CSV строки
    const csvRows = [
      headers.join(','),
      ...filledData.map(metric => [
        metric.timestamp,
        `"${metric.date}"`,
        metric.processing,
        metric.processed,
        metric.generated
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const filepath = path.join(dataDir, filename);
    
    await fs.writeFile(filepath, csvContent);
    console.log(`CSV данные сохранены в ${filepath}`);
  }

  detectSessions(metrics) {
    if (metrics.length === 0) return [];
    
    const sortedMetrics = [...metrics].sort((a, b) => a.timestamp - b.timestamp);
    const sessions = [];
    let currentSession = null;
    const LOW_PROCESSING_THRESHOLD = 500000; // Порог для определения низкого значения processing
    
    for (let i = 0; i < sortedMetrics.length; i++) {
      const current = sortedMetrics[i];
      const prev = i > 0 ? sortedMetrics[i - 1] : null;
      
      // Начало новой сессии: processing росло с низкого значения
      if (prev && prev.processing < LOW_PROCESSING_THRESHOLD && current.processing > prev.processing) {
        // Закрываем предыдущую сессию если есть
        if (currentSession) {
          this.finalizeSession(currentSession, prev);
          sessions.push(currentSession);
        }
        
        // Начинаем новую сессию
        currentSession = {
          startDate: new Date(current.timestamp).toISOString(),
          startTimestamp: current.timestamp,
          metrics: [current],
          maxProcessing: current.processing
        };
      }
      // Продолжаем текущую сессию
      else if (currentSession) {
        currentSession.metrics.push(current);
        currentSession.maxProcessing = Math.max(currentSession.maxProcessing, current.processing);
        
        // Проверяем конец сессии: processing упало до низкого значения
        if (current.processing < LOW_PROCESSING_THRESHOLD) {
          this.finalizeSession(currentSession, current);
          sessions.push(currentSession);
          currentSession = null;
        }
      }
      // Если нет активной сессии и processing выше порога, начинаем новую
      else if (current.processing >= LOW_PROCESSING_THRESHOLD) {
        currentSession = {
          startDate: new Date(current.timestamp).toISOString(),
          startTimestamp: current.timestamp,
          metrics: [current],
          maxProcessing: current.processing
        };
      }
    }
    
    // Закрываем последнюю сессию если она осталась открытой
    if (currentSession && currentSession.metrics.length > 0) {
      const lastMetric = currentSession.metrics[currentSession.metrics.length - 1];
      this.finalizeSession(currentSession, lastMetric);
      sessions.push(currentSession);
    }
    
    return sessions;
  }
  
  finalizeSession(session, endMetric) {
    session.endDate = new Date(endMetric.timestamp).toISOString();
    session.endTimestamp = endMetric.timestamp;
    session.duration = endMetric.timestamp - session.startTimestamp;
    session.durationHours = Math.round(session.duration / (1000 * 60 * 60) * 10) / 10; // часы с 1 знаком
    
    // Рассчитываем среднее значение processed (исключаем отрицательные значения)
    const validProcessed = session.metrics
      .map(m => m.processed)
      .filter(p => p >= 0);
    
    session.avgProcessed = validProcessed.length > 0 
      ? Math.round(validProcessed.reduce((sum, p) => sum + p, 0) / validProcessed.length)
      : 0;
    
    session.totalMetrics = session.metrics.length;
    
    // Удаляем детальные метрики из итогового объекта для экономии места
    delete session.metrics;
    delete session.startTimestamp;
    delete session.endTimestamp;
  }

  async saveData(data, baseFilename = 'pan_metrics') {
    const filledData = this.fillMissingHours(data);
    const sessions = this.detectSessions(filledData);
    
    await Promise.all([
      this.saveToJson(data, `${baseFilename}.json`, sessions),
      this.saveToCsv(data, `${baseFilename}.csv`)
    ]);
  }
}

async function main() {
  if (!apiId || !apiHash || !groupId) {
    console.error('Необходимо указать API_ID, API_HASH и GROUP_ID в .env');
    return;
  }

  const parser = new TelegramParser();
  
  try {
    await parser.connect();
    const metrics = await parser.parseMessages(120); // 30 дней
    await parser.saveData(metrics);
    console.log('Парсинг завершен успешно');
  } catch (error) {
    console.error('Ошибка:', error);
  } finally {
    // Закрываем соединение с Telegram
    await parser.client.disconnect();
    process.exit(0);
  }
}

main();