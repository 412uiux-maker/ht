const fs = require('fs');
const path = require('path');
const pool = require('../db');

const SEED_VETS = [
  ['Азиз Каримов',    'Терапевт (кошки, собаки)',  'Опыт 8 лет. Специализация: внутренние болезни мелких животных, дерматология.',        120000, 4.9, '👨‍⚕️', 8],
  ['Малика Юсупова',  'Хирург-ортопед',            'Специализируется на хирургии и ортопедии собак и кошек. Сотни успешных операций.',     150000, 4.8, '👩‍⚕️', 11],
  ['Санжар Назаров',  'Дерматолог, аллерголог',    'Эксперт по кожным заболеваниям и аллергиям у домашних животных.',                      100000, 4.7, '🧑‍⚕️', 5],
  ['Дилноза Рашидова','Педиатрия питомцев',         'Специалист по молодым животным: вакцинация, развитие, питание щенков и котят.',         90000, 4.9, '👩‍⚕️', 6],
];

// [name, brand, species[], life_stages[], weight_class[], health_tags[], price_uzs, budget_tier, emoji, description, rating]
const SEED_FOODS = [
  // ── ECONOMY ──────────────────────────────────────────────────────────────────
  ['Adult Океан',       'Whiskas',      ['cat'],      ['adult'],           ['light','medium'],  ['digestion','dental'],          35000,  'economy', '🐟', 'Сбалансированный рацион с рыбой для взрослых кошек. Поддерживает здоровье зубов.',           4.1],
  ['Adult Ягнёнок',    'Whiskas',      ['cat'],      ['adult'],           ['light','medium'],  ['digestion'],                   32000,  'economy', '🥩', 'Нежный вкус ягнёнка. Легко усваивается, подходит для привередливых кошек.',                   4.0],
  ['Adult Курица',     'Pedigree',     ['dog'],      ['adult'],           ['medium','large'],  ['dental','digestion'],          42000,  'economy', '🍗', 'Сухой корм с курицей для активных взрослых собак. Укрепляет зубы и дёсны.',                   4.2],
  ['Puppy Mini',       'Pedigree',     ['dog'],      ['kitten'],          ['light','medium'],  ['digestion'],                   38000,  'economy', '🐾', 'Специально для щенков малых пород до 1 года. Легко усваиваемый белок.',                       4.1],

  // ── MID ──────────────────────────────────────────────────────────────────────
  ['ONE Cat Adult',    'Purina ONE',   ['cat'],      ['adult'],           ['light','medium'],  ['skin','digestion'],            72000,  'mid',     '✨', 'Курица как №1 ингредиент. Блестящая шерсть и здоровое пищеварение.',                         4.6],
  ['ONE Indoor',       'Purina ONE',   ['cat'],      ['adult'],           ['light'],           ['weight_control','digestion'],  78000,  'mid',     '🏠', 'Для домашних кошек с низкой активностью. Контроль веса и чистый лоток.',                      4.5],
  ['ONE Dog Medium',   'Purina ONE',   ['dog'],      ['adult'],           ['medium'],          ['skin','joints'],               85000,  'mid',     '🦴', 'Ягнёнок и рис. Здоровые суставы и блестящая шерсть для средних пород.',                      4.6],
  ['Cat Kitten',       'Monge',        ['cat'],      ['kitten'],          ['light'],           ['digestion','skin'],            92000,  'mid',     '🐱', 'Итальянский корм с курицей для котят. Поддерживает иммунитет и рост.',                        4.7],
  ['Dog Puppy Medium', 'Monge',        ['dog'],      ['kitten'],          ['medium'],          ['digestion','joints'],          98000,  'mid',     '🐶', 'Итальянский корм для щенков средних пород. Богат DHA для развития мозга.',                    4.7],

  // ── PREMIUM ───────────────────────────────────────────────────────────────────
  ['Urinary Care',     'Royal Canin',  ['cat'],      ['adult'],           ['light','medium'],  ['urinary','digestion'],        145000,  'premium', '💎', 'Ветеринарная диета для профилактики МКБ. Оптимальный pH мочи.',                              4.9],
  ['Senior 12+',       'Royal Canin',  ['cat'],      ['senior'],          ['light','medium'],  ['joints','digestion','dental'], 158000,  'premium', '👴', 'Для кошек старше 12 лет. Поддержка суставов, лёгкое пищеварение, здоровые зубы.',            4.9],
  ['Medium Adult',     'Royal Canin',  ['dog'],      ['adult'],           ['medium'],          ['skin','digestion','dental'],   162000,  'premium', '🏆', 'Идеальный баланс для собак средних пород 12 мес – 7 лет. Здоровая кожа и шерсть.',          4.8],
  ['Maxi Senior',      'Royal Canin',  ['dog'],      ['senior'],          ['large'],           ['joints','weight_control'],    175000,  'premium', '🦮', 'Для крупных собак старше 8 лет. Глюкозамин и хондроитин для суставов.',                      4.9],
  ['Cat Indoor Light', 'Hills',        ['cat'],      ['adult'],           ['light','medium'],  ['weight_control','urinary'],   148000,  'premium', '🌿', 'Клинически доказанный контроль веса. Сниженная калорийность, полный питательный профиль.',     4.8],
  ['Sensitive Skin',   'Pro Plan',     ['cat'],      ['adult'],           ['light','medium'],  ['skin','digestion'],           138000,  'premium', '🐟', 'Лосось и рис для чувствительной кожи и шерсти. Омега-3 и -6 жирные кислоты.',               4.8],
  ['Large Robust',     'Pro Plan',     ['dog'],      ['adult','senior'],  ['large'],           ['joints','skin'],              168000,  'premium', '💪', 'Курица для крупных пород. Глюкозамин, хондроитин, омега-3 для здоровых суставов.',           4.8],
];

async function initDb() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);

  const { rows: vr } = await pool.query('SELECT COUNT(*) FROM vets');
  if (vr[0].count === '0') {
    for (const [name, specialty, bio, price_uzs, rating, avatar_emoji, experience_yr] of SEED_VETS) {
      await pool.query(
        `INSERT INTO vets (name, specialty, bio, price_uzs, rating, avatar_emoji, experience_yr)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [name, specialty, bio, price_uzs, rating, avatar_emoji, experience_yr]
      );
    }
    console.log('DB seeded:', SEED_VETS.length, 'vets');
  }

  const { rows: fr } = await pool.query('SELECT COUNT(*) FROM foods');
  if (fr[0].count === '0') {
    for (const [name, brand, species, life_stages, weight_class, health_tags, price_uzs, budget_tier, avatar_emoji, description, rating] of SEED_FOODS) {
      await pool.query(
        `INSERT INTO foods (name, brand, species, life_stages, weight_class, health_tags,
                            price_uzs, budget_tier, avatar_emoji, description, rating)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [name, brand, species, life_stages, weight_class, health_tags,
         price_uzs, budget_tier, avatar_emoji, description, rating]
      );
    }
    console.log('DB seeded:', SEED_FOODS.length, 'foods');
  }
}

module.exports = initDb;
