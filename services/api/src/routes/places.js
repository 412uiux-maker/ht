const express = require('express');
const router = express.Router();

const PLACES = [
  {
    id: 'p1', type: 'park',
    nameRu: 'Ботанический сад', nameUz: "Botanika bog'i",
    addressRu: 'ул. Богисамол, 232, Ташкент', addressUz: "Bogʻisamol ko'chasi, 232, Toshkent",
    descRu: 'Просторный зелёный парк с аллеями, прудом и специальными зонами для выгула собак. Разрешён вход с питомцами на поводке.',
    descUz: "Keng yashil bog' — xiyobonlar, ko'l va itlar uchun maxsus zonalar. Leash bilan hayvonlar kirishiga ruxsat beriladi.",
    emoji: '🌳', color: '#2E7D32', rating: 4.7, reviews: 238,
    petsAllowed: ['🐕 Собаки', '🐱 Кошки'], workingHours: '08:00–22:00', phone: '+998 71 265 22 56',
    tags: ['Поводок обязателен', 'Площадка для игр', 'Вода для питомцев'],
  },
  {
    id: 'p2', type: 'cafe',
    nameRu: 'Pet Café «Лапы»', nameUz: '«Panja» pet-kafe',
    addressRu: 'ул. Амира Темура, 107В, Ташкент', addressUz: "Amir Temur shoh ko'chasi, 107B, Toshkent",
    descRu: 'Уютное кафе, куда можно прийти с питомцем. Есть миски для воды, угощения для животных и специальные сидения.',
    descUz: "Uy hayvonlaringiz bilan kelishingiz mumkin bo'lgan qulay kafe. Suv idishlari, hayvon siyliqlar mavjud.",
    emoji: '☕', color: '#C62828', rating: 4.5, reviews: 142,
    petsAllowed: ['🐕 Собаки (до 10 кг)', '🐱 Кошки'], workingHours: '10:00–23:00', phone: '+998 90 123 45 67',
    tags: ['Терраса', 'Угощения для питомцев', 'Фотозона'],
  },
  {
    id: 'p3', type: 'shop',
    nameRu: 'ZooWorld Tashkent', nameUz: 'ZooWorld Toshkent',
    addressRu: 'ТЦ Samarqand Darvoza, 2-й этаж', addressUz: 'Samarqand Darvoza savdo markazi, 2-qavat',
    descRu: 'Крупнейший зоомагазин в Ташкенте. Более 5000 наименований товаров: корм, аксессуары, ветеринарная аптека.',
    descUz: 'Toshkentdagi eng yirik zoomarket. 5000+ turdagi mahsulot: yem, aksessuarlar, veterinariya aptekasi.',
    emoji: '🛒', color: '#1565C0', rating: 4.3, reviews: 312,
    petsAllowed: ['🐕', '🐱', '🐹', '🐰'], workingHours: '10:00–21:00', phone: '+998 71 234 56 78',
    tags: ['Ветаптека', 'Доставка', 'Бонусная карта'],
  },
  {
    id: 'p4', type: 'grooming',
    nameRu: 'PetStyle Grooming', nameUz: 'PetStyle Gruming',
    addressRu: 'ул. Чимкентская, 28, Ташкент', addressUz: "Chimkent ko'chasi, 28, Toshkent",
    descRu: 'Профессиональный груминг-салон. Стрижка, купание, педикюр, чистка зубов. Опытные грумеры с сертификатами.',
    descUz: "Professional gruming salon. Soch olish, cho'miltirish, tirnoq qirqish, tish tozalash.",
    emoji: '✂️', color: '#7C3AED', rating: 4.8, reviews: 189,
    petsAllowed: ['🐕 Собаки', '🐱 Кошки'], workingHours: '09:00–20:00', phone: '+998 91 345 67 89',
    tags: ['Запись онлайн', 'Сертифицированные грумеры', 'SPA-уход'],
  },
  {
    id: 'p5', type: 'hotel',
    nameRu: 'Pet Hotel «Мурлыкино»', nameUz: '«Murlikino» it-mushuk mehmonxonasi',
    addressRu: 'ул. Сергели, 15, Ташкент', addressUz: "Sergeli ko'chasi, 15, Toshkent",
    descRu: 'Гостиница для животных на время вашего отъезда. Ежедневные прогулки, индивидуальные вольеры, видеонаблюдение.',
    descUz: 'Sizning safar vaqtingizda hayvonlaringiz uchun mehmonxona. Kunlik sayrlar, individual qafaslar, videokuzatuv.',
    emoji: '🏠', color: '#F59E0B', rating: 4.6, reviews: 95,
    petsAllowed: ['🐕 Собаки', '🐱 Кошки'], workingHours: '24/7', phone: '+998 94 456 78 90',
    tags: ['Видеокамеры', 'Прогулки 2×/день', 'Ветеринарная помощь'],
  },
];

// GET /api/places — list of pet-friendly places in Tashkent
router.get('/', (req, res) => {
  const { type } = req.query;
  const result = type ? PLACES.filter(p => p.type === type) : PLACES;
  res.json(result);
});

// GET /api/places/:id
router.get('/:id', (req, res) => {
  const place = PLACES.find(p => p.id === req.params.id);
  if (!place) return res.status(404).json({ error: 'not found' });
  res.json(place);
});

module.exports = router;
