const express = require('express');
const pool = require('../db');
const router = express.Router();

// Seed data — used if table is empty (first run)
const SEED = [
  {
    id: 'p1', type: 'park',
    name_ru: 'Ботанический сад', name_uz: "Botanika bog'i",
    address_ru: 'ул. Богисамол, 232, Ташкент', address_uz: "Bogʻisamol ko'chasi, 232, Toshkent",
    desc_ru: 'Просторный зелёный парк с аллеями, прудом и специальными зонами для выгула собак. Разрешён вход с питомцами на поводке.',
    desc_uz: "Keng yashil bog' — xiyobonlar, ko'l va itlar uchun maxsus zonalar. Leash bilan hayvonlar kirishiga ruxsat beriladi.",
    emoji: '🌳', color: '#2E7D32', rating: 4.7, reviews_cnt: 238, sort_order: 1,
    pets_allowed: ['🐕 Собаки', '🐱 Кошки'], working_hours: '08:00–22:00', phone: '+998 71 265 22 56',
    tags: ['Поводок обязателен', 'Площадка для игр', 'Вода для питомцев'],
  },
  {
    id: 'p2', type: 'cafe',
    name_ru: 'Pet Café «Лапы»', name_uz: '«Panja» pet-kafe',
    address_ru: 'ул. Амира Темура, 107В, Ташкент', address_uz: "Amir Temur shoh ko'chasi, 107B, Toshkent",
    desc_ru: 'Уютное кафе, куда можно прийти с питомцем. Есть миски для воды, угощения для животных и специальные сидения.',
    desc_uz: "Uy hayvonlaringiz bilan kelishingiz mumkin bo'lgan qulay kafe. Suv idishlari, hayvon siyliqlar mavjud.",
    emoji: '☕', color: '#C62828', rating: 4.5, reviews_cnt: 142, sort_order: 2,
    pets_allowed: ['🐕 Собаки (до 10 кг)', '🐱 Кошки'], working_hours: '10:00–23:00', phone: '+998 90 123 45 67',
    tags: ['Терраса', 'Угощения для питомцев', 'Фотозона'],
  },
  {
    id: 'p3', type: 'shop',
    name_ru: 'ZooWorld Tashkent', name_uz: 'ZooWorld Toshkent',
    address_ru: 'ТЦ Samarqand Darvoza, 2-й этаж', address_uz: 'Samarqand Darvoza savdo markazi, 2-qavat',
    desc_ru: 'Крупнейший зоомагазин в Ташкенте. Более 5000 наименований товаров: корм, аксессуары, ветеринарная аптека.',
    desc_uz: 'Toshkentdagi eng yirik zoomarket. 5000+ turdagi mahsulot: yem, aksessuarlar, veterinariya aptekasi.',
    emoji: '🛒', color: '#1565C0', rating: 4.3, reviews_cnt: 312, sort_order: 3,
    pets_allowed: ['🐕', '🐱', '🐹', '🐰'], working_hours: '10:00–21:00', phone: '+998 71 234 56 78',
    tags: ['Ветаптека', 'Доставка', 'Бонусная карта'],
  },
  {
    id: 'p4', type: 'grooming',
    name_ru: 'PetStyle Grooming', name_uz: 'PetStyle Gruming',
    address_ru: 'ул. Чимкентская, 28, Ташкент', address_uz: "Chimkent ko'chasi, 28, Toshkent",
    desc_ru: 'Профессиональный груминг-салон. Стрижка, купание, педикюр, чистка зубов. Опытные грумеры с сертификатами.',
    desc_uz: "Professional gruming salon. Soch olish, cho'miltirish, tirnoq qirqish, tish tozalash.",
    emoji: '✂️', color: '#7C3AED', rating: 4.8, reviews_cnt: 189, sort_order: 4,
    pets_allowed: ['🐕 Собаки', '🐱 Кошки'], working_hours: '09:00–20:00', phone: '+998 91 345 67 89',
    tags: ['Запись онлайн', 'Сертифицированные грумеры', 'SPA-уход'],
  },
  {
    id: 'p5', type: 'hotel',
    name_ru: 'Pet Hotel «Мурлыкино»', name_uz: '«Murlikino» it-mushuk mehmonxonasi',
    address_ru: 'ул. Сергели, 15, Ташкент', address_uz: "Sergeli ko'chasi, 15, Toshkent",
    desc_ru: 'Гостиница для животных на время вашего отъезда. Ежедневные прогулки, индивидуальные вольеры, видеонаблюдение.',
    desc_uz: 'Sizning safar vaqtingizda hayvonlaringiz uchun mehmonxona. Kunlik sayrlar, individual qafaslar, videokuzatuv.',
    emoji: '🏠', color: '#F59E0B', rating: 4.6, reviews_cnt: 95, sort_order: 5,
    pets_allowed: ['🐕 Собаки', '🐱 Кошки'], working_hours: '24/7', phone: '+998 94 456 78 90',
    tags: ['Видеокамеры', 'Прогулки 2×/день', 'Ветеринарная помощь'],
  },
];

// Normalise DB row → ApiPlace shape (matches existing frontend contract)
function toApiShape(row) {
  return {
    id: row.id,
    type: row.type,
    nameRu: row.name_ru,
    nameUz: row.name_uz,
    addressRu: row.address_ru,
    addressUz: row.address_uz,
    descRu: row.desc_ru,
    descUz: row.desc_uz,
    emoji: row.emoji,
    color: row.color,
    rating: parseFloat(row.rating),
    reviews: row.reviews_cnt,
    petsAllowed: row.pets_allowed || [],
    workingHours: row.working_hours,
    phone: row.phone,
    tags: row.tags || [],
  };
}

async function seedIfEmpty(client) {
  const { rows: [{ cnt }] } = await client.query('SELECT COUNT(*) AS cnt FROM places');
  if (parseInt(cnt) > 0) return;
  for (const p of SEED) {
    await client.query(
      `INSERT INTO places (id, type, name_ru, name_uz, address_ru, address_uz,
         desc_ru, desc_uz, emoji, color, rating, reviews_cnt, pets_allowed,
         working_hours, phone, tags, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (id) DO NOTHING`,
      [p.id, p.type, p.name_ru, p.name_uz, p.address_ru, p.address_uz,
       p.desc_ru, p.desc_uz, p.emoji, p.color, p.rating, p.reviews_cnt,
       p.pets_allowed, p.working_hours, p.phone, p.tags, p.sort_order]
    );
  }
}

// GET /api/places
router.get('/', async (req, res) => {
  const { type } = req.query;
  try {
    await seedIfEmpty(pool);
    const q = type
      ? 'SELECT * FROM places WHERE is_active=true AND type=$1 ORDER BY sort_order, name_ru'
      : 'SELECT * FROM places WHERE is_active=true ORDER BY sort_order, name_ru';
    const { rows } = await pool.query(q, type ? [type] : []);
    res.json(rows.map(toApiShape));
  } catch (e) {
    // Fallback to hardcoded if table doesn't exist yet
    const fallback = type ? SEED.filter(p => p.type === type) : SEED;
    res.json(fallback.map(p => ({
      id: p.id, type: p.type, nameRu: p.name_ru, nameUz: p.name_uz,
      addressRu: p.address_ru, addressUz: p.address_uz,
      descRu: p.desc_ru, descUz: p.desc_uz, emoji: p.emoji, color: p.color,
      rating: p.rating, reviews: p.reviews_cnt, petsAllowed: p.pets_allowed,
      workingHours: p.working_hours, phone: p.phone, tags: p.tags,
    })));
  }
});

// GET /api/places/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows: [row] } = await pool.query('SELECT * FROM places WHERE id=$1', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'not found' });
    res.json(toApiShape(row));
  } catch (e) {
    const p = SEED.find(s => s.id === req.params.id);
    if (!p) return res.status(404).json({ error: 'not found' });
    res.json({ id: p.id, type: p.type, nameRu: p.name_ru, nameUz: p.name_uz,
      addressRu: p.address_ru, addressUz: p.address_uz, descRu: p.desc_ru,
      descUz: p.desc_uz, emoji: p.emoji, color: p.color, rating: p.rating,
      reviews: p.reviews_cnt, petsAllowed: p.pets_allowed,
      workingHours: p.working_hours, phone: p.phone, tags: p.tags });
  }
});

module.exports = router;
