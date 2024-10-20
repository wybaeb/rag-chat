const fs = require('fs');
const dotenv = require('dotenv');

// Загрузка переменных окружения
dotenv.config();

// Чтение шаблона HTML
let htmlTemplate = fs.readFileSync('index.template.html', 'utf8');

// Замена плейсхолдеров
htmlTemplate = htmlTemplate.replace('<RAG_CHAT_TOKEN>', process.env.RAG_CHAT_TOKEN);
htmlTemplate = htmlTemplate.replace('<RAG_CHAT_URL>', process.env.RAG_CHAT_URL);

// Запись финального HTML-файла
fs.writeFileSync('index.html', htmlTemplate);

console.log('index.html generated successfully');
