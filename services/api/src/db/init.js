const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
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

// Demo credentials linked to SEED_VETS by position (0-indexed)
const SEED_VENDOR_CREDS = [
  { email: 'aziz@happytails.uz',    password: 'demo123', phone: '+998901234567', vet_index: 0 },
  { email: 'malika@happytails.uz',  password: 'demo123', phone: '+998901234568', vet_index: 1 },
  { email: 'sanzhar@happytails.uz', password: 'demo123', phone: '+998901234569', vet_index: 2 },
  { email: 'dilnoza@happytails.uz', password: 'demo123', phone: '+998901234570', vet_index: 3 },
];

const SEED_DEEDS = [
  {
    title: 'Помощь приюту «Пушистый дом»',
    subtitle: '120 животных ждут вашей помощи',
    description: 'Приют «Пушистый дом» в Ташкенте ежемесячно кормит и лечит более 120 кошек и собак. Нам нужна помощь с кормом, ветпрепаратами и оплатой аренды. Каждые 50 000 сум — это недельный корм для одного животного.',
    category: 'shelter', emoji: '🏠', sort_order: 1, goal_amount: 5000000, raised_amount: 2850000, participants_count: 47,
    deadline: '2026-07-31',
  },
  {
    title: 'Стерилизация бездомных кошек',
    subtitle: 'Цель: 50 кошек в июне',
    description: 'Городская программа TNVR (поймать—стерилизовать—вакцинировать—вернуть) в Чиланзарском районе. Стерилизация одной кошки стоит 180 000 сум. Сбор поможет снизить популяцию бездомных животных без насилия.',
    category: 'sterilization', emoji: '⚕️', sort_order: 2, goal_amount: 9000000, raised_amount: 4320000, participants_count: 31,
    deadline: '2026-06-30',
  },
  {
    title: 'Корм для животных Ташкента',
    subtitle: 'Ежемесячная закупка корма',
    description: 'Волонтёрская группа «Доброе сердце» кормит бездомных животных в 12 точках Ташкента каждый день. Помогите с закупкой корма на июль — это 80 кг сухого корма для кошек и 60 кг для собак.',
    category: 'feeding', emoji: '🥣', sort_order: 3, goal_amount: 2500000, raised_amount: 1150000, participants_count: 22,
    deadline: '2026-07-01',
  },
  {
    title: 'Спасение собак с улицы',
    subtitle: '8 собак ждут передержки',
    description: 'Срочный сбор: 8 собак попали в опасную ситуацию (трасса, травмы) и нуждаются в передержке и лечении. Нужна помощь волонтёрами на передержку и средства на ветпомощь. Закрыто!',
    category: 'rescue', emoji: '🚨', sort_order: 4, goal_amount: 3200000, raised_amount: 3200000, participants_count: 38,
    status: 'completed',
  },
  {
    title: 'Котята ищут дом',
    subtitle: 'Помогите найти хозяев для 24 котят',
    description: 'Весенний помёт: 24 котёнка в возрасте 2–3 месяцев ищут любящий дом. Все осмотрены ветеринаром, привиты от панлейкопении. Нужна помощь с распространением объявлений и временной передержкой.',
    category: 'adoption', emoji: '🐱', sort_order: 5, goal_amount: null, raised_amount: 0, participants_count: 15,
    deadline: '2026-08-01',
  },
  {
    title: 'Вакцинация уличных животных',
    subtitle: 'Цель: 200 животных от бешенства',
    description: 'Совместная акция с городской ветслужбой: массовая вакцинация бездомных кошек и собак от бешенства в Юнусабадском и Мирзо-Улугбекском районах. Одна доза вакцины — 22 000 сум.',
    category: 'other', emoji: '💉', sort_order: 6, goal_amount: 4400000, raised_amount: 1980000, participants_count: 19,
    deadline: '2026-07-15',
  },
];

const SEED_LEARN = [
  // ── Чек-листы ──────────────────────────────────────────────────────────────
  {
    type:'checklist', category:'vet', emoji:'🩺', sort_order:1,
    title:'Подготовка к визиту ветеринара',
    subtitle:'Checklist · 10 мин',
    species:['cat','dog'], duration_min:10,
    steps:[
      {id:1, text:'Запишите все симптомы и даты их появления'},
      {id:2, text:'Возьмите ветпаспорт и карту прививок'},
      {id:3, text:'Не кормите питомца за 4–6 часов (если назначены анализы)'},
      {id:4, text:'Соберите образец мочи / кала при необходимости'},
      {id:5, text:'Подготовьте переноску — положите любимую игрушку'},
      {id:6, text:'Запишите вопросы к ветеринару заранее'},
      {id:7, text:'Возьмите данные о препаратах, которые принимает питомец'},
    ],
  },
  {
    type:'checklist', category:'first_aid', emoji:'🚨', sort_order:2,
    title:'Первая помощь питомцу',
    subtitle:'Checklist · 15 мин',
    species:['cat','dog'], duration_min:15,
    steps:[
      {id:1, text:'Сохраняйте спокойствие — питомец чувствует ваш стресс'},
      {id:2, text:'Оцените ситуацию: дышит ли питомец, есть ли сознание'},
      {id:3, text:'Позвоните в ветклинику до любых действий'},
      {id:4, text:'При кровотечении — чистая ткань и умеренное давление'},
      {id:5, text:'При отравлении — не вызывайте рвоту без указания врача'},
      {id:6, text:'Транспортируйте бережно: на жёсткой поверхности, накрыв'},
      {id:7, text:'Запишите время начала симптомов для врача'},
      {id:8, text:'Держите номер скорой ветпомощи в телефоне'},
    ],
  },
  {
    type:'checklist', category:'onboarding', emoji:'🏠', sort_order:3,
    title:'Новый питомец дома',
    subtitle:'Checklist · 20 мин',
    species:['cat','dog'], duration_min:20,
    steps:[
      {id:1, text:'Подготовьте отдельное тихое место для адаптации'},
      {id:2, text:'Уберите опасные предметы: провода, мелкие вещи, химию'},
      {id:3, text:'Купите миски для еды и воды, лоток или поводок'},
      {id:4, text:'Запишитесь к ветеринару в первую неделю'},
      {id:5, text:'Начните кормить тем же кормом, что и прежний хозяин'},
      {id:6, text:'Дайте 2–3 дня на адаптацию без лишнего шума и гостей'},
      {id:7, text:'Познакомьте с другими животными постепенно'},
      {id:8, text:'Оформите ветпаспорт и чип'},
    ],
  },
  {
    type:'checklist', category:'health', emoji:'📋', sort_order:4,
    title:'Ежегодный осмотр питомца',
    subtitle:'Checklist · 10 мин',
    species:['cat','dog'], duration_min:10,
    steps:[
      {id:1, text:'Запишитесь на плановый осмотр раз в год'},
      {id:2, text:'Провести обработку от паразитов (глисты, блохи, клещи)'},
      {id:3, text:'Проверить актуальность прививок'},
      {id:4, text:'Взвесить питомца и сравнить с нормой'},
      {id:5, text:'Проверить зубы и дёсны'},
      {id:6, text:'Сдать общий анализ крови и мочи'},
      {id:7, text:'Обсудить питание и при необходимости скорректировать'},
    ],
  },
  // ── Гайды ──────────────────────────────────────────────────────────────────
  {
    type:'guide', category:'nutrition', emoji:'🥘', sort_order:5,
    title:'Как читать этикетку корма',
    subtitle:'Guide · 7 мин',
    species:null, duration_min:7,
    body:`Состав корма всегда указывается по убыванию веса. Первый ингредиент — основа продукта.

**На что смотреть в первую очередь:**
Мясо или рыба должны стоять первыми. Хорошо: «курица», «лосось», «ягнёнок». Плохо: «мясная мука», «субпродукты» без уточнения источника.

**Влажность и белок:**
На упаковке указывается содержание на «сырой» основе. Для сравнения кормов с разной влажностью пересчитайте в «сухое вещество»: делите % на (100 − влажность%) × 100.

**Добавки и консерванты:**
Натуральные — токоферолы (витамин E), аскорбиновая кислота. Лучше избегать BHA, BHT, этоксихина.

**Гарантированный анализ:**
Минимум белка и жира, максимум клетчатки и влаги. Для взрослых кошек — не менее 26% белка в сухом веществе, для собак — от 18%.

**Срок годности и хранение:**
После вскрытия сухой корм хранить в герметичном контейнере до 6 недель. Влажный — в холодильнике не более суток.`,
  },
  {
    type:'guide', category:'nutrition', emoji:'🐱', sort_order:6,
    title:'Режим кормления кошки по возрасту',
    subtitle:'Guide · 6 мин',
    species:['cat'], duration_min:6,
    body:`Правильный режим кормления влияет на здоровье, вес и настроение кошки.

**Котята (до 6 месяцев):**
4–5 кормлений в день. Специальный корм «kitten» с повышенным содержанием белка и DHA для развития мозга. Не ограничивайте порции — котята растут.

**Молодые кошки (6–12 месяцев):**
Переходите на 3 кормления. Начинайте вводить корм «adult» постепенно (10 дней).

**Взрослые (1–7 лет):**
2 кормления в день — утром и вечером. Строго измеряйте порции по инструкции на упаковке.

**Пожилые (7+ лет):**
2–3 небольших кормления. Корм «senior» с поддержкой суставов и почек. Следите за весом и потреблением воды.

**Вода:**
Кошки пьют мало — дополнительно предлагайте влажный корм или используйте поилку-фонтан.`,
  },
  {
    type:'guide', category:'nutrition', emoji:'🐶', sort_order:7,
    title:'Кормление собаки: нормы по возрасту и весу',
    subtitle:'Guide · 8 мин',
    species:['dog'], duration_min:8,
    body:`Перекорм — одна из главных причин болезней собак. Важно соблюдать нормы.

**Щенки (до 6 месяцев):**
3–4 кормления в день. Корм для щенков вашей породной группы (mini/medium/maxi). Не добавляйте кальциевые добавки — они уже в корме.

**Молодые собаки (6–18 месяцев):**
2–3 кормления. Крупные породы переходят на «adult» в 12–18 мес, малые — в 9–12 мес.

**Взрослые:**
2 раза в день. Суточная норма по весу — смотрите таблицу на упаковке. Взвешивайте корм.

**Как проверить вес:** вы должны чувствовать рёбра, не видя их. Если рёбра видны — питомец худой, если не прощупываются — лишний вес.

**Пожилые (7+ лет для крупных, 10+ для мелких):**
Корм «senior» с глюкозамином. Разделите суточную норму на 3 приёма для облегчения пищеварения.`,
  },
  {
    type:'guide', category:'grooming', emoji:'✂️', sort_order:8,
    title:'Уход за шерстью дома',
    subtitle:'Guide · 5 мин',
    species:['cat','dog'], duration_min:5,
    body:`Регулярный уход предотвращает колтуны, аллергию и проблемы с кожей.

**Частота расчёсывания:**
Короткошёрстные: 1 раз в неделю. Длинношёрстные: 3–7 раз в неделю. В период линьки — ежедневно.

**Инструменты:**
• Фурминатор — для удаления подшёрстка
• Щётка-пуходёрка — для длинной шерсти
• Резиновая рукавица — для короткошёрстных и кошек, которые не любят расчёсывание

**Купание:**
Кошки: только по необходимости (загрязнение, лечебный шампунь). Собаки: раз в 4–8 недель или после прогулок в грязь. Используйте только зоошампунь.

**Когти:**
Подстригайте каждые 3–4 недели. Срезайте только прозрачную часть, избегая розовой зоны с сосудами.

**Уши и глаза:**
Протирайте ватным диском с лосьоном раз в 1–2 недели. Тёмный налёт или запах — повод обратиться к врачу.`,
  },
  // ── Статьи ──────────────────────────────────────────────────────────────────
  {
    type:'article', category:'health', emoji:'🔍', sort_order:9,
    title:'10 признаков болезни у питомца',
    subtitle:'Article · 5 мин',
    species:['cat','dog'], duration_min:5,
    body:`Животные не могут сказать, что им плохо. Эти признаки — сигнал немедленно обратиться к врачу.

**1. Отказ от еды более 24 часов**
Для кошек особенно критично — риск жирового гепатоза.

**2. Чрезмерная жажда или полное отсутствие**
Может указывать на диабет, болезни почек или отравление.

**3. Вялость и апатия**
Если питомец не реагирует на привычные стимулы дольше дня.

**4. Рвота или диарея**
Разово — допустимо. Повторяется — тревожный знак, особенно с кровью.

**5. Затруднённое дыхание**
Открытый рот у кошки, хрипы, посинение дёсен — экстренный случай.

**6. Резкое изменение веса**
Без смены рациона — повод для анализов.

**7. Хромота или отказ от нагрузки**
Боль в суставах, травма или неврология.

**8. Частое мочеиспускание или его отсутствие**
Особенно у котов — риск закупорки уретры (угрожает жизни).

**9. Выделения из глаз, носа, ушей**
Инфекция, аллергия или паразиты.

**10. Изменение поведения**
Агрессия, спутанность, постоянное прятание — симптом боли или неврологии.`,
  },
  {
    type:'article', category:'vaccination', emoji:'💉', sort_order:10,
    title:'Вакцинация: полный гид',
    subtitle:'Article · 7 мин',
    species:['cat','dog'], duration_min:7,
    body:`Вакцинация — самый эффективный способ защитить питомца от смертельно опасных болезней.

**Основные вакцины для кошек:**
• Панлейкопения, ринотрахеит, калицивироз (комплекс «RCP») — обязательно
• Бешенство — обязательно по закону
• Хламидиоз, FeLV (лейкоз) — по показаниям

**Основные вакцины для собак:**
• Чума, парвовирус, гепатит, парагрипп («DHPP») — обязательно
• Бешенство — обязательно
• Лептоспироз, бордетелла — по образу жизни

**График:**
Первая вакцинация: в 8–12 недель. Ревакцинация: через 3–4 недели. Затем — ежегодно или раз в 3 года (зависит от вакцины).

**До вакцинации:**
Дать антигельминтный препарат за 10–14 дней. Питомец должен быть здоров.

**После вакцинации:**
2 недели карантин — без контакта с чужими животными, без купания, без стресса.

**Ветпаспорт:**
Все прививки фиксируются с датой, наименованием препарата и подписью врача. Паспорт нужен для путешествий и выставок.`,
  },
  {
    type:'article', category:'behavior', emoji:'🐕', sort_order:11,
    title:'Как социализировать щенка',
    subtitle:'Article · 6 мин',
    species:['dog'], duration_min:6,
    body:`Социализация в возрасте 3–16 недель определяет поведение собаки на всю жизнь.

**Что такое социализация:**
Знакомство с разными людьми, животными, звуками, поверхностями и ситуациями в позитивной обстановке. Цель — уверенная, неагрессивная собака.

**Ключевое окно: до 16 недель**
После этого возраста мозг щенка становится осторожнее к новому. Социализировать можно и позже, но сложнее.

**Что включить:**
• Дети, пожилые люди, люди в масках/шляпах/с зонтами
• Другие собаки (привитые!), кошки
• Автобусы, лифты, лестницы, скользкие поверхности
• Гром, пылесос, фейерверки (аудиозаписи в малой громкости)
• Ветеринарная клиника — просто зайти и уйти с лакомством

**Правила:**
Всегда заканчивайте встречу на позитиве. Если щенок боится — не тащите силой, уменьшите раздражитель. Много коротких сессий лучше одной долгой.

**Ошибки:**
Изоляция «до полного прививочного цикла» — риск поведенческих проблем выше, чем риск болезни при правильном выборе мест.`,
  },
  {
    type:'article', category:'behavior', emoji:'😿', sort_order:12,
    title:'Стресс у кошки: причины и помощь',
    subtitle:'Article · 5 мин',
    species:['cat'], duration_min:5,
    body:`Кошки — существа привычки. Любое изменение может вызвать стресс с серьёзными последствиями для здоровья.

**Признаки стресса:**
Прячется, перестаёт есть, метит в неположенных местах, чрезмерно вылизывается (до залысин), агрессия, понос.

**Частые причины:**
• Переезд, ремонт, перестановка мебели
• Новый питомец или человек в доме
• Изменение графика хозяина
• Громкие звуки, чужие запахи
• Грязный лоток (кошки очень чистоплотны)

**Как помочь:**

*Пространство:* Создайте «безопасную зону» — закрытую комнату с едой, водой, лотком и лежанкой. Дайте кошке самой определять темп знакомства с новым.

*Феромоны:* Диффузор Feliway или аналог — имитирует успокаивающие маркировочные феромоны кошки.

*Рутина:* Кормите строго в одно время. Не меняйте расположение лотка и мисок без крайней необходимости.

*Игры:* 2 сессии по 10–15 минут в день снижают тревогу и расход энергии.

**Когда к врачу:**
Стресс более 2 недель или цистит (частые безрезультатные попытки в лоток) — срочно к ветеринару.`,
  },
];

const isBcrypt = s => typeof s === 'string' && (s.startsWith('$2b$') || s.startsWith('$2a$'));

async function migratePasswords() {
  const { rows: vendors } = await pool.query('SELECT id, password FROM vendor_credentials');
  for (const row of vendors) {
    if (!isBcrypt(row.password)) {
      await pool.query('UPDATE vendor_credentials SET password=$1 WHERE id=$2', [await bcrypt.hash(row.password, 10), row.id]);
    }
  }
  const { rows: admins } = await pool.query('SELECT id, password FROM admin_users');
  for (const row of admins) {
    if (!isBcrypt(row.password)) {
      await pool.query('UPDATE admin_users SET password=$1 WHERE id=$2', [await bcrypt.hash(row.password, 10), row.id]);
    }
  }
}

async function initDb() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);

  await migratePasswords();

  const { rows: dr } = await pool.query('SELECT COUNT(*) FROM good_deeds');
  if (dr[0].count === '0') {
    for (const d of SEED_DEEDS) {
      await pool.query(
        `INSERT INTO good_deeds (title, subtitle, description, category, emoji, sort_order,
                                 goal_amount, raised_amount, participants_count, deadline, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [d.title, d.subtitle, d.description, d.category, d.emoji, d.sort_order || 0,
         d.goal_amount || null, d.raised_amount || 0, d.participants_count || 0,
         d.deadline || null, d.status || 'active']
      );
    }
    console.log('DB seeded:', SEED_DEEDS.length, 'good deeds');
  }

  const { rows: vcr } = await pool.query('SELECT COUNT(*) FROM vendor_credentials');
  if (vcr[0].count === '0') {
    const { rows: vetRows } = await pool.query('SELECT id FROM vets ORDER BY id');
    for (const cred of SEED_VENDOR_CREDS) {
      const vet = vetRows[cred.vet_index];
      if (!vet) continue;
      const hashed = await bcrypt.hash(cred.password, 10);
      await pool.query(
        `INSERT INTO vendor_credentials (vet_id, email, password, phone) VALUES ($1,$2,$3,$4)
         ON CONFLICT DO NOTHING`,
        [vet.id, cred.email, hashed, cred.phone]
      );
    }
    console.log('DB seeded:', SEED_VENDOR_CREDS.length, 'vendor credentials');
  } else {
    // Ensure demo phones are set even if rows were seeded without phone
    for (const cred of SEED_VENDOR_CREDS) {
      await pool.query(
        `UPDATE vendor_credentials SET phone = $1 WHERE email = $2 AND phone IS NULL`,
        [cred.phone, cred.email]
      );
    }
  }

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

  const { rows: lr } = await pool.query('SELECT COUNT(*) FROM learn_items');
  if (lr[0].count === '0') {
    for (const item of SEED_LEARN) {
      await pool.query(
        `INSERT INTO learn_items (type, category, title, subtitle, body, steps, species, duration_min, emoji, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [item.type, item.category, item.title, item.subtitle || null,
         item.body || null, item.steps ? JSON.stringify(item.steps) : null,
         item.species || null, item.duration_min, item.emoji, item.sort_order]
      );
    }
    console.log('DB seeded:', SEED_LEARN.length, 'learn items');
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

  const { rows: au } = await pool.query('SELECT COUNT(*) FROM admin_users');
  if (au[0].count === '0') {
    const adminSeed = [
      { email: 'admin@happytails.uz',   password: 'admin123', name: 'Главный администратор', role: 'admin' },
      { email: 'moder@happytails.uz',   password: 'moder123', name: 'Модератор Контента',    role: 'moderator' },
      { email: 'support@happytails.uz', password: 'supp123',  name: 'Агент Поддержки',       role: 'support' },
    ];
    for (const u of adminSeed) {
      const hashed = await bcrypt.hash(u.password, 10);
      await pool.query(
        `INSERT INTO admin_users (email, password, name, role) VALUES ($1,$2,$3,$4)`,
        [u.email, hashed, u.name, u.role]
      );
    }
    console.log('DB seeded: 3 admin users');
  }

  const { rows: vv } = await pool.query('SELECT COUNT(*) FROM vendor_verification');
  if (vv[0].count === '0') {
    const { rows: vetRows } = await pool.query('SELECT id FROM vets ORDER BY id');
    for (const vet of vetRows) {
      await pool.query(
        'INSERT INTO vendor_verification (vet_id, status) VALUES ($1,$2) ON CONFLICT (vet_id) DO NOTHING',
        [vet.id, 'pending']
      );
    }
    console.log('DB seeded: vendor_verification entries');
  }

  const { rows: svr } = await pool.query('SELECT COUNT(*) FROM vendor_services');
  if (svr[0].count === '0') {
    // Seed services for the first 4 demo vets (by position)
    const { rows: demoVets } = await pool.query('SELECT id FROM vets ORDER BY id LIMIT 4');
    const SEED_SERVICES = [
      // vet[0] — Азиз Каримов (терапевт)
      { title_ru: 'Онлайн-консультация', title_uz: 'Online maslahat', category: 'vet_online', price_uzs: 120000, duration_min: 30, format: 'online',  is_active: true,  description: 'Видеоконсультация по любому вопросу здоровья вашего питомца' },
      { title_ru: 'Повторная консультация', title_uz: 'Takroriy maslahat', category: 'vet_online', price_uzs: 70000, duration_min: 15, format: 'online', is_active: true,  description: 'Для пациентов на контроле — уточнение лечения' },
      // vet[1] — Малика Юсупова (хирург)
      { title_ru: 'Онлайн-консультация хирурга', title_uz: "Jarroh maslahat'i", category: 'vet_online', price_uzs: 150000, duration_min: 30, format: 'online',  is_active: true,  description: 'Оценка необходимости операции, разбор снимков' },
      { title_ru: 'Стерилизация (кошка)', title_uz: "Mushuk sterilizatsiyasi", category: 'surgery', price_uzs: 350000, duration_min: 60, format: 'offline', is_active: true,  description: 'Плановая стерилизация в клинике, включая анестезию' },
      { title_ru: 'Кастрация (кот)', title_uz: "Mushuk kastratsiyasi", category: 'surgery', price_uzs: 220000, duration_min: 45, format: 'offline', is_active: true,  description: '' },
      // vet[2] — Санжар Назаров (дерматолог)
      { title_ru: 'Онлайн-консультация дерматолога', title_uz: "Dermatolog maslahat'i", category: 'vet_online', price_uzs: 100000, duration_min: 30, format: 'online',  is_active: true,  description: 'Диагностика кожных заболеваний и аллергий по фото' },
      { title_ru: 'Разработка диеты при аллергии', title_uz: "Allergiya uchun parhez", category: 'nutrition', price_uzs: 80000, duration_min: 20, format: 'online',  is_active: true,  description: 'Подбор гипоаллергенного рациона для чувствительных животных' },
      // vet[3] — Дилноза Рашидова (педиатрия)
      { title_ru: 'Вакцинация (комплексная)', title_uz: "Kompleks emlash", category: 'vaccination', price_uzs: 90000, duration_min: 20, format: 'offline', is_active: true,  description: 'Комплекс прививок для щенков и котят, включая бешенство' },
      { title_ru: 'Онлайн-консультация педиатра', title_uz: "Pediatr maslahat'i", category: 'vet_online', price_uzs: 90000, duration_min: 30, format: 'online',  is_active: true,  description: 'Вопросы роста, питания и здоровья молодых животных' },
    ];
    const vetAssign = [0,0, 1,1,1, 2,2, 3,3]; // index into demoVets per service
    for (let i = 0; i < SEED_SERVICES.length; i++) {
      const vet = demoVets[vetAssign[i]];
      if (!vet) continue;
      const s = SEED_SERVICES[i];
      await pool.query(
        `INSERT INTO vendor_services (vet_id, title_ru, title_uz, category, price_uzs, duration_min, format, is_active, description, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [vet.id, s.title_ru, s.title_uz, s.category, s.price_uzs, s.duration_min, s.format, s.is_active, s.description, i]
      );
    }
    console.log('DB seeded:', SEED_SERVICES.length, 'vendor services');
  }

  const { rows: rr } = await pool.query('SELECT COUNT(*) FROM reviews');
  if (rr[0].count === '0') {
    const { rows: vetRows } = await pool.query('SELECT id FROM vets ORDER BY id LIMIT 4');
    const SEED_REVIEWS = [
      { vet_i: 0, rating: 5, text: 'Азиз — отличный врач, объяснил всё подробно. Кошка уже здорова!', owner: 'owner-rev-001', status: 'published' },
      { vet_i: 0, rating: 4, text: 'Быстро ответил, назначил лечение. Всё чётко.', owner: 'owner-rev-002', status: 'published' },
      { vet_i: 1, rating: 5, text: 'Малика спасла нашего питомца. Профессионал высшего уровня!', owner: 'owner-rev-003', status: 'published' },
      { vet_i: 1, rating: 2, text: 'Долго ждал ответа, не понравился подход к лечению.', owner: 'owner-rev-004', status: 'pending' },
      { vet_i: 2, rating: 5, text: 'Санжар разобрался с аллергией кота за 2 консультации.', owner: 'owner-rev-005', status: 'published' },
      { vet_i: 2, rating: 3, text: 'Консультация нормальная, но хотелось бы более детальных рекомендаций.', owner: 'owner-rev-006', status: 'pending' },
      { vet_i: 3, rating: 5, text: 'Дилноза очень внимательно отнеслась к нашему щенку. Спасибо!', owner: 'owner-rev-007', status: 'published' },
    ];
    for (const rv of SEED_REVIEWS) {
      const vet = vetRows[rv.vet_i];
      if (!vet) continue;
      await pool.query(
        `INSERT INTO reviews (vet_id, owner_id, rating, text, status) VALUES ($1,$2,$3,$4,$5)`,
        [vet.id, rv.owner, rv.rating, rv.text, rv.status]
      );
    }
    console.log('DB seeded:', SEED_REVIEWS.length, 'reviews');
  }

  // Seed platform_settings defaults
  const DEFAULT_SETTINGS = [
    ['commission_vet_consult', '15'],
    ['commission_insurance',   '10'],
    ['min_payout_uzs',         '50000'],
    ['payment_click_enabled',  'true'],
    ['payment_payme_enabled',  'true'],
    ['payment_uzum_enabled',   'false'],
  ];
  for (const [key, value] of DEFAULT_SETTINGS) {
    await pool.query(
      `INSERT INTO platform_settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO NOTHING`,
      [key, value]
    );
  }

  const { rows: or } = await pool.query('SELECT COUNT(*) FROM orders');
  if (or[0].count === '0') {
    const { rows: vetRows } = await pool.query('SELECT id, price_uzs FROM vets LIMIT 4');
    const demoOrders = [
      { owner: 'owner-demo-001', status: 'created',   provider: 'click'  },
      { owner: 'owner-demo-002', status: 'paid',      provider: 'payme'  },
      { owner: 'owner-demo-003', status: 'completed', provider: 'click'  },
      { owner: 'owner-demo-004', status: 'refunded',  provider: 'uzum'   },
      { owner: 'owner-demo-005', status: 'cancelled', provider: 'click'  },
      { owner: 'owner-demo-006', status: 'completed', provider: 'payme'  },
    ];
    for (let i = 0; i < demoOrders.length; i++) {
      const o = demoOrders[i];
      const vet = vetRows[i % vetRows.length];
      if (!vet) continue;
      await pool.query(
        `INSERT INTO orders (owner_id, vet_id, status, price_uzs, provider) VALUES ($1,$2,$3,$4,$5)`,
        [o.owner, vet.id, o.status, vet.price_uzs, o.provider]
      );
    }
    console.log('DB seeded: 6 demo orders');
  }

  const { rows: vpr } = await pool.query('SELECT COUNT(*) FROM vendor_payouts');
  if (vpr[0].count === '0') {
    const { rows: vetRows } = await pool.query('SELECT id, name FROM vets ORDER BY id LIMIT 4');
    const SEED_PAYOUTS = [
      { vet_i: 0, amount: 204000, method: 'click',  requisites: '+998 93 345 67 89', status: 'approved' },
      { vet_i: 1, amount: 76500,  method: 'payme',  requisites: '+998 91 234 56 78', status: 'pending'  },
      { vet_i: 2, amount: 136000, method: 'click',  requisites: '+998 90 111 22 33', status: 'pending'  },
      { vet_i: 3, amount: 85000,  method: 'uzum',   requisites: '+998 97 999 88 77', status: 'rejected' },
    ];
    for (const p of SEED_PAYOUTS) {
      const vet = vetRows[p.vet_i];
      if (!vet) continue;
      await pool.query(
        `INSERT INTO vendor_payouts (vet_id, amount_uzs, method, requisites, status, requested_at)
         VALUES ($1,$2,$3,$4,$5, NOW() - INTERVAL '${p.vet_i + 1} days')`,
        [vet.id, p.amount, p.method, p.requisites, p.status]
      );
    }
    console.log('DB seeded:', SEED_PAYOUTS.length, 'vendor payouts');
  }
}

module.exports = initDb;
