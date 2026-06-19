const path = require('path');
const express = require('express');
const initDb = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/vets', require('./routes/vets'));
app.use('/api/consultations', require('./routes/consultations'));
app.use('/api/pets', require('./routes/pets'));
app.use('/api/foods', require('./routes/food'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'petplatform-api', time: new Date().toISOString() });
});

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Salom, dunyo! / Привет, мир!', from: 'petplatform-api' });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`petplatform-api running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('DB init failed:', err);
    process.exit(1);
  });
