const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Статика (hello-world страница)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Health-check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'petplatform-api', time: new Date().toISOString() });
});

// Пример API-эндпоинта
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Salom, dunyo! / Привет, мир!', from: 'petplatform-api' });
});

app.listen(PORT, () => {
  console.log(`petplatform-api running at http://localhost:${PORT}`);
});
