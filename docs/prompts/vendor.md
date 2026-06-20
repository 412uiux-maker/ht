# Claude Code · vendor — кабинет подрядчика (сторона предложения)

> **Как использовать:** `claude "Работай по docs/prompts/vendor.md — начни с Milestone 1"`  
> Сначала прочитай этот файл целиком, затем `CLAUDE.md` → `PRODUCT.md` → `DESIGN.md`.

---

## 1. Что уже существует

### Рабочий прототип — `services/api/public/vendor.html`
Полнофункциональный SPA-прототип на vanilla JS, доступен на `http://localhost:8080/vendor.html`.

**Что работает в прототипе:**
- Вход по email + password (демо-аккаунты ниже)
- Дашборд: доход, статистика, алерт на ожидающих
- Список пациентов с фильтрами по статусу (pending/active/completed)
- Чат от лица врача: отправка, быстрые ответы, завершение с заключением
- Кнопка 📹 видеозвонка — открывает `/video.html?id=<cid>&role=vet`
- Профиль: данные врача + демо-credentials

### Демо-аккаунты (в БД с момента первого запуска)
```
aziz@happytails.uz    / demo123  — Азиз Каримов, Терапевт (кошки, собаки)
malika@happytails.uz  / demo123  — Малика Юсупова, Хирург-ортопед
sanzhar@happytails.uz / demo123  — Санжар Назаров, Дерматолог
dilnoza@happytails.uz / demo123  — Дилноза Рашидова, Педиатрия питомцев
```

### Существующие backend-маршруты (`/api/vendor/`)
```
POST /api/vendor/login               { email, password } → { vet_id, name, specialty, ... }
GET  /api/vendor/profile?vet_id=
GET  /api/vendor/consultations?vet_id=&status=
GET  /api/vendor/stats?vet_id=       → { total, active, pending, completed, income, rating }
```

### Существующие таблицы БД
```sql
vets (id, name, specialty, bio, price_uzs, rating, avatar_emoji, experience_yr, is_available)
vendor_credentials (id, vet_id FK, email, password)
consultations (id UUID, vet_id, client_name, pet_name, pet_species, problem, status, summary)
messages (id, consultation_id FK, sender:'client'|'vet', text, created_at)
```

### Видеозвонок
`/video.html?id=<consultation_id>&role=vet` — работает из коробки через WebRTC + WS сигналинг на `/ws/signal`.

---

## 2. Цель

Построить `apps/vendor/` — **React web-кабинет** для подрядчиков (старт: ветеринары).  
Прототип `vendor.html` — референс дизайна и API-контракта. Новый app должен добавить:
- Полную верификацию подрядчика с загрузкой документов
- CRUD услуг с локализацией uz/ru
- Расписание/доступность слотов
- Финансы: баланс, история выплат, запрос выплаты
- Отзывы: просмотр и ответ
- Уведомления о новых заказах через Telegram inline-кнопки

---

## 3. Технологии

```
Vite + React 18 + TypeScript
react-router-dom v6   — навигация (desktop SPA с сайдбаром)
react-query           — кэш + polling + mutations
zustand               — vendor-сессия (vet_id, role, token)
packages/shared       — типы, токены, i18n
```

**Layout:** десктоп-first, sidebar 240px + main content, контейнер ~1200px.  
Адаптив до планшета (768px): sidebar скрывается в hamburger.

---

## 4. Паттерны из прототипа (повторять точно)

### Цветовая схема (из `DESIGN.md`, тёмная как в прототипе)
```css
/* vendor использует dark-theme по умолчанию как в vendor.html */
:root {
  --bg:#0f0f0f; --surface:#1a1a1a; --surface2:#242424; --surface3:#2e2e2e;
  --text:#f5f5f5; --text2:#a0a0a0; --text3:#666;
  --coral:#F2784B; --coral-dark:#d95f30;
  --green:#4CAF7D; --violet:#7C5CBF; --amber:#F5A623;
  --r-sm:12px; --r-md:18px; --r-xl:28px;
  --font:'Onest',sans-serif;
}
```

### Карточка консультации — паттерн из прототипа
```tsx
const SPECIES_EMOJI = { cat:'🐱', dog:'🐶', rabbit:'🐰', parrot:'🦜', other:'🐾' };
const STATUS_LABEL  = { pending:'Ожидает', active:'В процессе', completed:'Завершена' };
const STATUS_COLOR  = { pending:'--amber', active:'--green', completed:'--blue' };

// Граница карточки меняется по статусу
<div className={`consult-card status-${consultation.status}`}>
```

### Polling чата — каждые 3 секунды (из прототипа)
```ts
useEffect(() => {
  fetchChat();
  const interval = setInterval(fetchChat, 3000);
  return () => clearInterval(interval);
}, [consultationId]);
```

### Сессия — localStorage + проверка при загрузке
```ts
// При входе
localStorage.setItem('ht_vendor', JSON.stringify(vendorData));
// При загрузке
const saved = localStorage.getItem('ht_vendor');
if (saved) setVendor(JSON.parse(saved));
```

---

## 5. Структура `apps/vendor/`

```
apps/vendor/
├── src/
│   ├── main.tsx
│   ├── App.tsx               — RouterProvider + VendorAuthGuard
│   ├── api/
│   │   ├── vendor.ts         — /api/vendor/* маршруты
│   │   └── consult.ts        — /api/consultations/* маршруты
│   ├── store/
│   │   └── vendor.ts         — { vet_id, name, specialty, token } + logout()
│   ├── screens/
│   │   ├── Login/            — форма + демо-chips (как в прототипе)
│   │   ├── Dashboard/        — stats grid + pending alert + recent consults
│   │   ├── Consultations/    — фильтры + список + открытие чата
│   │   ├── Chat/             — чат ветеринара + завершение + видеозвонок
│   │   ├── Services/         — CRUD услуг с uz/ru полями (новый)
│   │   ├── Schedule/         — доступность слотов (новый)
│   │   ├── Finance/          — баланс, выплаты (новый)
│   │   ├── Reviews/          — отзывы + ответы (новый)
│   │   ├── Verification/     — статус + загрузка документов (новый)
│   │   └── Profile/          — данные подрядчика
│   ├── components/
│   │   ├── Sidebar.tsx       — навигация с pending-badge
│   │   ├── ConsultCard.tsx   — карточка с видом питомца + статус
│   │   ├── StatCard.tsx      — stat-число + label + иконка
│   │   ├── StatusPill.tsx    — pending|active|completed chip
│   │   └── ChatPanel.tsx     — сообщения + input + actions
│   └── i18n/
│       ├── uz.ts
│       └── ru.ts
├── vite.config.ts
└── package.json
```

---

## 6. API-маршруты

### Существующие (не менять)
```
POST /api/vendor/login
GET  /api/vendor/profile?vet_id=
GET  /api/vendor/consultations?vet_id=&status=
GET  /api/vendor/stats?vet_id=
GET  /api/consultations/:id              → { consultation, messages[] }
POST /api/consultations/:id/messages     { sender:'vet', text }
PATCH /api/consultations/:id/status      { status:'completed', summary }
```

### Новые — добавить в `services/api/src/routes/vendor.js`

```ts
// Верификация
GET  /api/vendor/verification?vet_id=
     → { status:'pending'|'verified'|'rejected', comment?, submitted_at? }
POST /api/vendor/verification           { vet_id, document_type, document_url }
     // document_url — пока base64 или имя файла; реальный upload — Milestone 3

// Услуги
GET  /api/vendor/services?vet_id=       → Service[]
POST /api/vendor/services               { vet_id, title_ru, title_uz, desc_ru, desc_uz, price_uzs, duration_min, is_active }
PUT  /api/vendor/services/:id
DELETE /api/vendor/services/:id

// Расписание
GET  /api/vendor/slots?vet_id=&date=    → Slot[]  // слоты на дату
PUT  /api/vendor/slots                  { vet_id, date, hours:[9,10,14,15] }  // перезаписать слоты

// Финансы
GET  /api/vendor/finance?vet_id=        → { balance, pending_payout, history:Transaction[] }
POST /api/vendor/payouts               { vet_id, amount_uzs, details }
     → { status:'pending', payout_id }

// Отзывы
GET  /api/vendor/reviews?vet_id=        → Review[]
POST /api/vendor/reviews/:id/reply      { vet_id, text }
```

### Схема новых таблиц (добавить в `schema.sql`)
```sql
CREATE TABLE IF NOT EXISTS vendor_verification (
  id         SERIAL PRIMARY KEY,
  vet_id     INTEGER UNIQUE REFERENCES vets(id),
  status     TEXT DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  comment    TEXT,
  doc_type   TEXT,
  doc_ref    TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendor_services (
  id           SERIAL PRIMARY KEY,
  vet_id       INTEGER REFERENCES vets(id),
  title_ru     TEXT NOT NULL,
  title_uz     TEXT NOT NULL,
  desc_ru      TEXT,
  desc_uz      TEXT,
  price_uzs    INTEGER NOT NULL,
  duration_min INTEGER DEFAULT 30,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendor_slots (
  id       SERIAL PRIMARY KEY,
  vet_id   INTEGER REFERENCES vets(id),
  slot_at  TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN DEFAULT false,
  order_id UUID,
  UNIQUE(vet_id, slot_at)
);

CREATE TABLE IF NOT EXISTS vendor_payouts (
  id         SERIAL PRIMARY KEY,
  vet_id     INTEGER REFERENCES vets(id),
  amount_uzs INTEGER NOT NULL,
  status     TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','rejected')),
  details    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Бизнес-правила

```
Верификация:
  - status='verified' → vet.is_available = true
  - status='pending'|'rejected' → показывать баннер в дашборде
  - Аппрув делает admin (через /api/admin/vendors/:id/verify) или мок в M1

Переходы статуса консультации (vendor инициирует):
  pending  → active     (при первом ответе ветеринара)
  active   → completed  { status:'completed', summary:string }
  НЕ ДОПУСКАТЬ: completed → любой другой

Финансы:
  income = price_uzs × completed_consultations
  commission = income × vet.commission_rate (если поле отсутствует — 15%)
  payout = income - commission
  Выплата только при status='completed', не раньше

Чат:
  sender='vet' — сообщения ветеринара (правая пузырь коралловый в vendor.html)
  sender='client' — сообщения клиента (левый пузырь серый)
  Polling 3000ms пока status != 'completed'
```

---

## 8. Правила реализации

| ✅ Делать | ❌ Не делать |
|-----------|-------------|
| Все строки через i18n (uz/ru) | Хардкод строк |
| `loading` / `empty` / `error` на каждый экран | Пустые экраны без статуса |
| Статус-баджи согласованные с couples и admin | Разные цвета для одного статуса |
| Sidebar с pending-badge (число ожидающих) | Нет индикации новых запросов |
| `tabular-nums` для цен и сумм | Обычные цифры в деньгах |
| Polling чата останавливается при `completed` | Бесконечный setInterval |
| localStorage для сессии + проверка при init | Сессия только в памяти |
| Видео — `window.open('/video.html?id=...&role=vet')` | Встраивать WebRTC заново |

---

## 9. Milestones

### M1 — Вход + Дашборд + Чат (порт прототипа в React)
1. `apps/vendor/` — Vite + React + TS, роутер, AuthGuard.
2. Login-экран: форма + 4 демо-чипа (клик = автовход).
3. Дашборд: stats-grid, алерт на pending, список активных консультаций.
4. Чат-панель: polling 3s, отправка как `vet`, завершение с заключением.
5. Кнопка 📹 → `window.open(/video.html?id=...&role=vet)`.
6. Боковое меню: Дашборд / Пациенты / Профиль. Pending-badge на «Пациенты».
7. uz/ru i18n для всего потока M1. `loading` / `empty` / `error`.

### M2 — Услуги + Расписание
1. Таблица `vendor_services` + CRUD маршруты.
2. Экран «Услуги»: список + форма (uz/ru поля, цена, длительность, toggle активности).
3. Таблица `vendor_slots` + маршруты.
4. Экран «Расписание»: календарь-неделя, клик на час = включить/выключить слот.

### M3 — Верификация + Загрузка документов
1. Таблица `vendor_verification` + маршруты.
2. Экран «Верификация»: статус заявки (pending/verified/rejected) + форма загрузки.
3. Баннер в дашборде если статус != verified.
4. После verified — `vets.is_available = true`.

### M4 — Финансы + Отзывы
1. Таблица `vendor_payouts` + маршруты.
2. Экран «Финансы»: баланс, доход, комиссия, история выплат, кнопка «Запросить выплату».
3. Экран «Отзывы»: список `Review` + форма ответа.

### M5 — Telegram-уведомления о заказах
1. При `POST /api/consultations` → Telegram Bot отправляет ветеринару сообщение с inline-кнопками «Принять» / «Отклонить».
2. Inline-callback → PATCH статуса и ответ в Telegram.
3. Telegram Bot: `apps/telegram-bot/` — см. `service-spec.md §7`.

---

## 10. Definition of Done

Каждый Milestone завершён, когда:
- [ ] Поток работает end-to-end без ошибок консоли
- [ ] uz и ru — полная i18n, нет хардкода строк
- [ ] `loading` / `empty` / `error` на каждом экране
- [ ] Sidebar pending-badge обновляется при входящих
- [ ] `docker compose up -d` → все маршруты отвечают
- [ ] Бизнес-правила статусов соблюдены
- [ ] Демо-аккаунты (`aziz@...`, `malika@...` и др.) — вход с первого раза
