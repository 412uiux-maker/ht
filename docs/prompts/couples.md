# Claude Code · couples — клиентское приложение (сторона спроса)

> **Как использовать:** `claude "Работай по docs/prompts/couples.md — начни с Milestone 1"`  
> Сначала прочитай этот файл целиком, затем `CLAUDE.md` → `PRODUCT.md` → `DESIGN.md`.

---

## 1. Что уже существует (не пересоздавать)

### Рабочие прототипы — vanilla JS SPA в `services/api/public/`
Запущены на `http://localhost:8080`. Используй как **референс дизайна и API-контракта**.

| Файл | Что делает |
|------|-----------|
| `consult.html` | Список врачей → запись → чат с polling 3s + видеозвонок |
| `pets.html` | Профиль питомца: CRUD, эмодзи-пикер, вид/пол/вес/дата |
| `food.html` | Анкета питания → скоринг → карточки кормов с match% |
| `learn.html` | Каталог статей/гайдов/чек-листов с прогрессом |
| `deeds.html` | Добрые дела: инициативы, донаты, волонтёрство |
| `video.html` | WebRTC видеозвонок: PiP, mic/cam toggle, сигналинг WS |

### Backend `services/api/` — Express + PostgreSQL, запуск: `docker compose up -d`

**Существующие маршруты (не менять сигнатуру):**
```
GET    /api/vets
POST   /api/consultations
GET    /api/consultations/:id          → { consultation, messages[] }
POST   /api/consultations/:id/messages { sender:'client'|'vet', text }
PATCH  /api/consultations/:id/status   { status:'completed', summary }
GET    /api/pets?owner_id=
POST   /api/pets                       { owner_id, name, species, sex, ... }
PUT    /api/pets/:id
DELETE /api/pets/:id
GET    /api/foods
POST   /api/foods/recommend            { species, life_stage, weight_class, health_tags[], budget_tier }
GET    /api/learn?owner_id=&type=&species=
GET    /api/learn/:id?owner_id=
POST   /api/learn/:id/progress         { owner_id, status, checked_steps[] }
GET    /api/deeds?owner_id=&category=
POST   /api/deeds/:id/participate      { owner_id, type:'donate'|'volunteer'|'share', amount_uzs? }
WS     /ws/signal                      (WebRTC сигналинг по consultation_id)
```

**Существующие таблицы БД:**
```
vets, consultations, messages
pets (owner_id TEXT — UUID из localStorage)
foods
learn_items, learn_progress
good_deeds, deed_participations
vendor_credentials (для кабинета врача — не трогать)
```

**Авторизация сейчас:** `owner_id` = `crypto.randomUUID()` в `localStorage['ht_owner_id']`.  
До Telegram-авторизации использовать этот паттерн без изменений.

---

## 2. Цель

Построить `apps/couples/` — **Telegram mini-app** для владельцев питомцев.  
Превратить прототипы в React-приложение с Telegram SDK, uz/ru i18n и оплатой.

---

## 3. Технологии

```
Vite + React 18 + TypeScript
@twa-dev/sdk          — Telegram Web Apps SDK
react-router-dom v6   — навигация
zustand               — глобальный стейт (owner_id, текущий питомец, язык)
packages/shared       — типы, токены, i18n
```

---

## 4. Паттерны (копировать из прототипов)

### CSS-токены — использовать точно из `DESIGN.md`
```css
:root {
  --bg:#F1F2F4; --surface:#FFFFFF; --surface-2:#FBF4EE; --border:#EAEBEE;
  --text:#23282D; --text-muted:#6C7480;
  --primary:#F2784B; --primary-600:#E0633A; --primary-strong:#C0511F; --on-primary:#FFFFFF;
  --grad-warm:linear-gradient(135deg,#F8915A,#F26B47);
  --grad-peach:linear-gradient(180deg,#FFEAD7,#FCDCC4);
  --success:#3FA46B; --warning:#E0A21F; --danger:#D9534A;
  --r-sm:12px; --r-md:16px; --r-lg:24px; --r-xl:32px; --r-pill:999px;
  --font:'Onest',system-ui,sans-serif;
}
/* dark — от WebApp.colorScheme */
[data-theme="dark"] {
  --bg:#15171A; --surface:#1E2126; --surface-2:#26221F; --border:#2E323A;
  --text:#ECEEF0; --text-muted:#9BA2AD; --primary:#F2864B; --on-primary:#1A140F;
}
```

### Telegram SDK — инициализация в `main.tsx`
```tsx
import WebApp from '@twa-dev/sdk';
WebApp.ready();
WebApp.expand();
document.documentElement.dataset.theme = WebApp.colorScheme; // 'light'|'dark'
```

### owner_id — паттерн из прототипов
```ts
export const getOwnerId = (): string => {
  let id = localStorage.getItem('ht_owner_id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('ht_owner_id', id); }
  return id;
};
```

### API-клиент
```ts
const BASE = import.meta.env.VITE_API_URL ?? '';
export const api = {
  get: <T>(path: string): Promise<T> => fetch(BASE + path).then(r => {
    if (!r.ok) throw new Error(r.statusText); return r.json();
  }),
  post: <T>(path: string, body: unknown): Promise<T> => fetch(BASE + path, {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
  }).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); }),
};
```

### GSAP-анимации — с уважением к reduced-motion
```ts
const canAnimate = !window.matchMedia('(prefers-reduced-motion:reduce)').matches;
if (canAnimate && window.gsap) gsap.from('.card', { y:14, opacity:0, stagger:.07, duration:.4 });
```

### i18n-паттерн
```ts
// packages/shared/i18n
const t = useTranslation(); // 'uz'|'ru' из localStorage['ht_lang']
// В JSX: {t('vet.book_btn')} — не 'Записаться'
// Файлы: uz.ts, ru.ts — плоские объекты с точечными ключами
```

---

## 5. Структура `apps/couples/`

```
apps/couples/
├── src/
│   ├── main.tsx
│   ├── App.tsx               — RouterProvider + Theme + i18n провайдеры
│   ├── api/index.ts          — все fetch-хелперы с TypeScript-типами
│   ├── store/
│   │   ├── owner.ts          — owner_id, user после TG-auth
│   │   ├── pets.ts           — список питомцев, активный питомец
│   │   └── lang.ts           — 'uz'|'ru'
│   ├── hooks/
│   │   ├── usePets.ts
│   │   ├── useConsultation.ts — polling каждые 3s
│   │   └── useLearnProgress.ts
│   ├── screens/
│   │   ├── Onboarding/       — выбор языка + первый питомец (1 раз)
│   │   ├── Home/             — лента: врачи, обучение, добрые дела
│   │   ├── Consult/          — врачи → запись → чат
│   │   ├── VideoCall/        — WebRTC звонок
│   │   ├── Pets/             — список + форма питомца
│   │   ├── Food/             — анкета + результаты
│   │   ├── Learn/            — каталог + ридер + чек-лист
│   │   ├── Deeds/            — инициативы + форма участия
│   │   ├── Orders/           — мои заказы (новый)
│   │   └── Profile/          — питомцы, язык, история
│   ├── components/
│   │   ├── VetCard.tsx
│   │   ├── PetCard.tsx
│   │   ├── StatusBadge.tsx   — pending|active|completed pill
│   │   ├── ChatBubble.tsx    — sender:'client'|'vet'
│   │   ├── BottomSheet.tsx   — модальный лист снизу
│   │   └── ProgressBar.tsx
│   └── i18n/
│       ├── uz.ts
│       └── ru.ts
├── vite.config.ts
└── package.json
```

---

## 6. Новые API-маршруты (добавить в `services/api/`)

```ts
// Аутентификация Telegram
POST /api/auth/telegram  { initData: string }
  → { owner_id: string, user_id: string, name: string, token: string }

// Заказы (новая таблица orders)
POST /api/orders  { owner_id, service_id, pet_id, scheduled_at }  → Order
GET  /api/orders?owner_id=&status=                                 → Order[]
GET  /api/orders/:id                                               → Order

// Оплата
POST /api/payments  { order_id, provider:'click'|'payme'|'uzum' }
  → { checkout_url: string }
POST /api/payments/webhook                   // от провайдера

// Места с питомцем
GET  /api/places?city=tashkent              → Place[]
```

**Схема `orders` для добавления в `schema.sql`:**
```sql
CREATE TABLE IF NOT EXISTS orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     TEXT NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'vet_online',
  vet_id       INTEGER REFERENCES vets(id),
  pet_id       UUID REFERENCES pets(id),
  scheduled_at TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'created'
               CHECK (status IN ('created','paid','accepted','in_progress','completed','cancelled','refunded')),
  price_uzs    INTEGER,
  provider     TEXT CHECK (provider IN ('click','payme','uzum')),
  payment_ref  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS orders_owner_idx ON orders(owner_id);
```

---

## 7. Правила (обязательно соблюдать)

| ✅ Делать | ❌ Не делать |
|-----------|-------------|
| Все строки через `t('key')` | Хардкод строк в JSX |
| `loading` / `empty` / `error` на каждый экран | Показывать пустой экран без статуса |
| `prefers-reduced-motion` перед GSAP | Анимировать без проверки |
| Цель нажатия ≥ 44px | Кнопки меньше 44px на мобиле |
| Белый текст на `--primary` заливке | Серый текст на оранжевом |
| BackButton Telegram SDK | Кастомная кнопка «←» поверх нативной |
| owner_id из localStorage | Новая схема auth до Milestone 5 |
| `tabular-nums` для цен | Обычные цифры в ценах |

---

## 8. Milestones

### M1 — Каркас + «Ветеринар» end-to-end
1. `apps/couples/` — Vite + React + TS, Telegram SDK подключён.
2. Онбординг: выбор uz/ru → создание первого питомца.
3. Список врачей (`GET /api/vets`) → карточка → форма записи → чат (polling 3s).
4. Telegram BackButton на каждом вложенном экране.
5. `uz.ts` + `ru.ts` с ключами для всего потока.
6. `loading` / `empty` / `error` на каждом экране.

### M2 — Профиль питомца + Подбор корма
1. Полный CRUD питомцев (порт `pets.html` → React).
2. Анкета корма с предзаполнением из активного питомца (порт `food.html`).
3. Персонализация главного экрана по активному питомцу.

### M3 — Обучение + Добрые дела
1. Экран «Обучение» (порт `learn.html`): каталог + фильтры + ридер + чек-лист.
2. Экран «Добрые дела» (порт `deeds.html`): инициативы + форма участия.

### M4 — Заказы + Оплата (sandbox)
1. Таблица `orders` + маршруты в backend.
2. Экран «Оформление» → redirect на Click sandbox.
3. Webhook → смена статуса → обновление чата.
4. Экран «Мои заказы» — история и статусы.

### M5 — Telegram Auth + Видеозвонок
1. `POST /api/auth/telegram` + валидация HMAC подписи `initData`.
2. Привязать `owner_id → user_id` в БД.
3. Видеозвонок как React-компонент (порт `video.html`).

---

## 9. Definition of Done

Каждый Milestone считается завершённым, когда:
- [ ] Поток проходит end-to-end без ошибок консоли
- [ ] `uz` и `ru` работают без перезагрузки, нет хардкода строк
- [ ] Все экраны имеют `loading` / `empty` / `error`
- [ ] Контраст пар проверен (AA), цели ≥ 44px
- [ ] `prefers-reduced-motion` соблюдается
- [ ] `docker compose up -d` → все API отвечают корректно
- [ ] Telegram BackButton работает на каждом вложенном экране
