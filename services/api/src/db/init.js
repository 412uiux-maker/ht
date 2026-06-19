const fs = require('fs');
const path = require('path');
const pool = require('../db');

const SEED_VETS = [
  ['Азиз Каримов',    'Терапевт (кошки, собаки)',  'Опыт 8 лет. Специализация: внутренние болезни мелких животных, дерматология.',        120000, 4.9, '👨‍⚕️', 8],
  ['Малика Юсупова',  'Хирург-ортопед',            'Специализируется на хирургии и ортопедии собак и кошек. Сотни успешных операций.',     150000, 4.8, '👩‍⚕️', 11],
  ['Санжар Назаров',  'Дерматолог, аллерголог',    'Эксперт по кожным заболеваниям и аллергиям у домашних животных.',                      100000, 4.7, '🧑‍⚕️', 5],
  ['Дилноза Рашидова','Педиатрия питомцев',         'Специалист по молодым животным: вакцинация, развитие, питание щенков и котят.',         90000, 4.9, '👩‍⚕️', 6],
];

async function initDb() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);

  const { rows } = await pool.query('SELECT COUNT(*) FROM vets');
  if (rows[0].count === '0') {
    for (const [name, specialty, bio, price_uzs, rating, avatar_emoji, experience_yr] of SEED_VETS) {
      await pool.query(
        `INSERT INTO vets (name, specialty, bio, price_uzs, rating, avatar_emoji, experience_yr)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [name, specialty, bio, price_uzs, rating, avatar_emoji, experience_yr]
      );
    }
    console.log('DB seeded with', SEED_VETS.length, 'vets');
  }
}

module.exports = initDb;
