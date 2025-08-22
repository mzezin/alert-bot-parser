# Telegram Messages Parser & Analytics

Приложение для парсинга сообщений из Telegram групп и их анализа через веб-интерфейс.

## Структура проекта

```
alert-bot-parser/
├── telegram-parser/     # Парсер сообщений (Node.js)
├── web-app/            # Веб-интерфейс (React + TypeScript)
└── shared/             # Общие JSON данные
```

## Telegram Parser

### Настройка

1. Создайте `.env` файл в папке `telegram-parser/`:
```bash
API_ID=your_api_id
API_HASH=your_api_hash  
GROUP_ID=-100123456789
SESSION_STRING=
```

2. Получите API_ID и API_HASH на https://my.telegram.org/apps

3. ID группы можно получить из веб-версии Telegram (в URL)

### Установка и запуск

```bash
cd telegram-parser
npm install
npm start
```

При первом запуске сохраните SESSION_STRING для дальнейших подключений.

## Web App

### Установка и запуск

```bash
cd web-app
npm install
npm run dev
```

Откройте http://localhost:3000

### Функции

- **График активности** - визуализация количества сообщений по дням
- **Таблица данных** - подробная информация о сообщениях  
- **Экспорт в PDF** - сохранение отчета с графиком

## Технологии

- **Parser**: Node.js, telegram library
- **Web**: Vite, React, TypeScript, Chart.js, Tailwind CSS
- **Export**: jsPDF, html2canvas