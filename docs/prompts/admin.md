# Claude Code · admin — внутренняя панель платформы

> **Как использовать:** `claude "Работай по docs/prompts/admin.md — начни с Milestone 1"`  
> Сначала прочитай этот файл целиком, затем `CLAUDE.md` → `PRODUCT.md` → `DESIGN.md`.

---

## 1. Что уже существует

### Backend `services/api/` — запуск: `docker compose up -d`

**Существующие таблицы (использовать, не пересоздавать):**
```sql
vets              (id, name, specialty, bio, price_uzs, rating, avatar_emoji, experience_yr, is_available)
consultations     (id UUID, vet_id, client_name, pet_name, pet_species, problem, status, summary, created_at)
messages          (id, consultation_id, sender:'client'|'vet', text, created_at)
pets              (id UUID, owner_id TEXT, species, name, breed, sex, birth_date, weight_kg, avatar_emoji)
foods             (id, name, brand, species[], life_stages[], health_tags[], price_uzs, budget_tier, rating)
learn_items       (id, type:'article'|'guide'|'checklist', category, title, body, steps JSONB, species[], emoji)
learn_progress    (id, owner_id, item_id, status, checked_steps JSONB)
good_deeds        (id, title, category, goal_amount, raised_amount, participants_count, status, emoji)
deed_participations (id, owner_id, deed_id, type:'donate'|'volunteer'|'share', amount_uzs)
vendor_credentials  (id, vet_id FK, email, password)
```

**Таблицы для добавления (admin нужны):**
```sql
-- vendor_verification, vendor_services, vendor_slots (см. vendor.md)
-- admin_users, orders, payments, reviews, audit_log (новые — схема в §6)
```

**Существующие маршруты (можно использовать из admin, добавив проверку роли):**
```
GET  /api/vets
GET  /api/consultations/:id
PATCH /api/consultations/:id/status
GET  /api/learn
GET  /api/deeds
```

**Демо vendor-аккаунты (для тестирования верификации из admin):**
```
aziz@happytails.uz / demo123  — vet_id будет в vendor_credentials
malika@happytails.uz / demo123
sanzhar@happytails.uz / demo123
dilnoza@happytails.uz / demo123
```

---

## 2. Цель

Построить `apps/admin/` — **React web-панель** для операторов платформы.  
Нет прототипа: строить с нуля, но переиспользовать дизайн-токены из `DESIGN.md`.  

**Три роли** с разными правами:
| Роль | Доступ |
|------|--------|
| `moderator` | Верификация подрядчиков, модерация контента и отзывов |
| `support` | Заказы, споры, возвраты |
| `admin` | Всё + финансы, пользователи, настройки, аналитика |

---

## 3. Технологии

```
Vite + React 18 + TypeScript
react-router-dom v6     — навигация (sidebar layout)
react-query             — кэш, пагинация, mutations
zustand                 — admin-сессия { user_id, role, token }
@tanstack/react-table   — таблицы с сортировкой/фильтрами/пагинацией
react-hook-form + zod   — формы с валидацией
packages/shared         — типы, токены
```

**Layout:** десктоп, sidebar 260px + топбар + main, контейнер 1280px.  
Плотный data-UI: таблицы, фильтры, очереди — не «маркетинговый» дизайн.

---

## 4. Дизайн-паттерны (admin — светлая тема как основная)

```css
/* Использовать light-theme из DESIGN.md */
:root {
  --bg:#F1F2F4; --surface:#FFFFFF; --surface-2:#FBF4EE; --border:#EAEBEE;
  --text:#23282D; --text-muted:#6C7480;
  --primary:#F2784B; --primary-strong:#C0511F; --on-primary:#FFFFFF;
  --grad-warm:linear-gradient(135deg,#F8915A,#F26B47);
  --success:#3FA46B; --warning:#E0A21F; --danger:#D9534A;
  --r-sm:12px; --r-md:16px; --r-lg:24px; --r-pill:999px;
  --font:'Onest',system-ui,sans-serif;
}
```

### Status-chips — единые с couples и vendor
```tsx
const STATUS_CONFIG = {
  pending:    { label:'Ожидает',     bg:'#FFF3CD', color:'#856404' },
  active:     { label:'Активен',     bg:'#D1F2E4', color:'#1A7A4A' },
  completed:  { label:'Завершён',    bg:'#E8EDFF', color:'#3B5BDB' },
  verified:   { label:'Верифицирован',bg:'#D1F2E4',color:'#1A7A4A' },
  rejected:   { label:'Отклонён',    bg:'#FFE0DE', color:'#9E1B12' },
  refunded:   { label:'Возврат',     bg:'#E8EDFF', color:'#3B5BDB' },
};
```

### Таблица — паттерн с @tanstack/react-table
```tsx
// Всегда: сортировка + поиск + пагинация (20 строк)
// Действия — в последней колонке: иконки-кнопки (approve, reject, view)
// Строки кликабельны → детальный вид
// Bulk-действия только для moderator/admin
```

### Аудит-лог — обязательно для каждой мутации
```ts
// Каждое действие admin пишет в audit_log
await pool.query(
  `INSERT INTO audit_log (actor_id, actor_role, action, target_type, target_id, detail, created_at)
   VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
  [adminUser.id, adminUser.role, 'vendor.approve', 'vendor', vendorId, JSON.stringify({ comment })]
);
```

---

## 5. Структура `apps/admin/`

```
apps/admin/
├── src/
│   ├── main.tsx
│   ├── App.tsx               — RouterProvider + RoleGuard
│   ├── api/
│   │   ├── admin.ts          — /api/admin/* маршруты
│   │   └── types.ts          — Vendor, Order, Payment, Review, AuditLog...
│   ├── store/
│   │   └── admin.ts          — { user_id, role:'moderator'|'support'|'admin', token }
│   ├── screens/
│   │   ├── Login/            — email + password, hardcoded demo users M1
│   │   ├── Dashboard/        — метрики верхнего уровня (admin/support видят разное)
│   │   ├── Verification/     — очередь + approve/reject (moderator+admin)
│   │   ├── Moderation/       — услуги/отзывы/контент (moderator+admin)
│   │   ├── Orders/           — поиск/фильтр + detail + возврат (support+admin)
│   │   ├── Disputes/         — тикеты споров + переписка + решение (support+admin)
│   │   ├── Finance/          — транзакции, выплаты, сверка (admin only)
│   │   ├── Content/          — CRUD learn_items + good_deeds (moderator+admin)
│   │   ├── Users/            — список + RBAC (admin only)
│   │   ├── Analytics/        — ключевые метрики (admin+support)
│   │   └── AuditLog/         — просмотр лога действий (admin only)
│   ├── components/
│   │   ├── Sidebar.tsx       — навигация с role-based скрытием пунктов
│   │   ├── DataTable.tsx     — универсальная таблица (@tanstack/react-table)
│   │   ├── StatusChip.tsx    — единые статус-баджи
│   │   ├── FilterBar.tsx     — поиск + dropdown-фильтры
│   │   ├── ConfirmModal.tsx  — подтверждение деструктивных действий
│   │   └── AuditEntry.tsx    — строка лога
│   └── guards/
│       └── RoleGuard.tsx     — 403 если роль не имеет доступа
├── vite.config.ts
└── package.json
```

---

## 6. Новые таблицы БД (добавить в `services/api/src/db/schema.sql`)

```sql
-- Пользователи admin-панели
CREATE TABLE IF NOT EXISTS admin_users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'moderator'
             CHECK (role IN ('moderator','support','admin')),
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Аудит-лог (обязателен для всех мутаций)
CREATE TABLE IF NOT EXISTS audit_log (
  id          SERIAL PRIMARY KEY,
  actor_id    UUID REFERENCES admin_users(id),
  actor_role  TEXT NOT NULL,
  action      TEXT NOT NULL,      -- 'vendor.approve', 'order.refund', 'content.publish' ...
  target_type TEXT NOT NULL,      -- 'vendor', 'order', 'review', 'content' ...
  target_id   TEXT,
  detail      JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON audit_log(action);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log(created_at DESC);

-- Заказы (если ещё не создала couples)
CREATE TABLE IF NOT EXISTS orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     TEXT NOT NULL,
  vet_id       INTEGER REFERENCES vets(id),
  pet_id       UUID REFERENCES pets(id),
  service_type TEXT NOT NULL DEFAULT 'vet_online',
  scheduled_at TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'created'
               CHECK (status IN ('created','paid','accepted','in_progress','completed','cancelled','refunded')),
  price_uzs    INTEGER,
  provider     TEXT CHECK (provider IN ('click','payme','uzum')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS orders_owner_idx ON orders(owner_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);

-- Платежи
CREATE TABLE IF NOT EXISTS payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID REFERENCES orders(id),
  provider     TEXT NOT NULL,
  amount_uzs   INTEGER NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','paid','refunded','failed')),
  external_ref TEXT,
  paid_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Отзывы
CREATE TABLE IF NOT EXISTS reviews (
  id          SERIAL PRIMARY KEY,
  order_id    UUID REFERENCES orders(id),
  owner_id    TEXT NOT NULL,
  vet_id      INTEGER REFERENCES vets(id),
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text        TEXT,
  reply       TEXT,
  status      TEXT DEFAULT 'published' CHECK (status IN ('pending','published','hidden')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Споры/тикеты
CREATE TABLE IF NOT EXISTS disputes (
  id          SERIAL PRIMARY KEY,
  order_id    UUID REFERENCES orders(id),
  owner_id    TEXT NOT NULL,
  reason      TEXT NOT NULL,
  status      TEXT DEFAULT 'open' CHECK (status IN ('open','in_review','resolved','closed')),
  resolution  TEXT,
  resolved_by UUID REFERENCES admin_users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### Seed demo admin users (в `init.js`)
```js
const SEED_ADMIN_USERS = [
  { email:'admin@happytails.uz',     password:'admin123',  name:'Главный администратор', role:'admin'     },
  { email:'moder@happytails.uz',     password:'moder123',  name:'Модератор Контента',    role:'moderator' },
  { email:'support@happytails.uz',   password:'supp123',   name:'Агент Поддержки',       role:'support'   },
];
```

---

## 7. API-маршруты (новый файл `routes/admin.js`)

```ts
// middleware: проверка роли из JWT/сессии перед каждым маршрутом
// router.use(requireAdmin(['admin','moderator']));

// ─── АУТЕНТИФИКАЦИЯ ───────────────────────────────────────
POST /api/admin/login                { email, password } → { token, role, name }

// ─── ВЕРИФИКАЦИЯ ПОДРЯДЧИКОВ ──────────────────────────────
GET  /api/admin/vendors?status=pending|verified|rejected  → Vendor[]
GET  /api/admin/vendors/:vet_id
POST /api/admin/vendors/:vet_id/verify  { action:'approve'|'reject', comment? }
  // → обновляет vendor_verification.status + vets.is_available
  // → пишет в audit_log

// ─── МОДЕРАЦИЯ ────────────────────────────────────────────
GET  /api/admin/reviews?status=pending|published|hidden   → Review[]
POST /api/admin/reviews/:id/moderate  { action:'publish'|'hide' }
GET  /api/admin/content               → learn_items[] (все, включая unpublished)
POST /api/admin/content               { type, category, title, body, ...  } → ContentItem
PUT  /api/admin/content/:id
DELETE /api/admin/content/:id

// ─── ЗАКАЗЫ ───────────────────────────────────────────────
GET  /api/admin/orders?status=&q=&from=&to=&page=&limit=20   → { orders[], total }
GET  /api/admin/orders/:id               → Order + Payment + Review?
POST /api/admin/orders/:id/refund        { reason }
  // → payments.status='refunded' + orders.status='refunded'
  // → audit_log

// ─── СПОРЫ ────────────────────────────────────────────────
GET  /api/admin/disputes?status=open     → Dispute[]
GET  /api/admin/disputes/:id             → Dispute + messages[]
POST /api/admin/disputes/:id/resolve     { resolution, refund_order:boolean }
POST /api/admin/disputes/:id/messages    { text }   // сообщение от admin к клиенту

// ─── ФИНАНСЫ (только role='admin') ───────────────────────
GET  /api/admin/finance/transactions?from=&to=&page=
GET  /api/admin/finance/payouts?status=pending
POST /api/admin/finance/payouts/:id/approve   { admin_note? }
POST /api/admin/finance/payouts/:id/reject    { reason }

// ─── ПОЛЬЗОВАТЕЛИ И РОЛИ ─────────────────────────────────
GET  /api/admin/users                    → AdminUser[] + Client[]
POST /api/admin/users                    { email, name, role }  → AdminUser
PUT  /api/admin/users/:id/role           { role }
DELETE /api/admin/users/:id

// ─── АНАЛИТИКА ────────────────────────────────────────────
GET  /api/admin/analytics?metric=gmv|orders|arpu|retention&from=&to=
  → { labels:[], data:[], totals:{} }

// ─── АУДИТ-ЛОГ ────────────────────────────────────────────
GET  /api/admin/audit?actor=&action=&from=&to=&page=   → AuditEntry[]

// ─── НАСТРОЙКИ (только role='admin') ─────────────────────
GET  /api/admin/settings
PUT  /api/admin/settings                 { key, value }
```

---

## 8. RBAC — матрица доступа

| Маршрут / Действие | `moderator` | `support` | `admin` |
|--------------------|:-----------:|:---------:|:-------:|
| GET /vendors (верификация) | ✅ | ❌ | ✅ |
| POST /vendors/:id/verify | ✅ | ❌ | ✅ |
| GET /reviews (модерация) | ✅ | ❌ | ✅ |
| CRUD /content | ✅ | ❌ | ✅ |
| GET /orders | ❌ | ✅ | ✅ |
| POST /orders/:id/refund | ❌ | ✅ | ✅ |
| GET/POST /disputes | ❌ | ✅ | ✅ |
| GET /finance | ❌ | ❌ | ✅ |
| CRUD /users | ❌ | ❌ | ✅ |
| GET /analytics | ❌ | ✅ | ✅ |
| GET /audit | ❌ | ❌ | ✅ |
| GET /settings | ❌ | ❌ | ✅ |

**Реализация guard на backend:**
```ts
function requireRole(...roles: string[]) {
  return (req, res, next) => {
    if (!roles.includes(req.adminUser?.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
// Использование:
router.post('/vendors/:id/verify', requireRole('admin','moderator'), verifyVendor);
router.post('/orders/:id/refund',  requireRole('admin','support'),   refundOrder);
```

---

## 9. Правила реализации

| ✅ Делать | ❌ Не делать |
|-----------|-------------|
| Аудит-лог на КАЖДУЮ мутацию | Пропускать логирование «для скорости» |
| RBAC на backend (403) + hide в UI | Только скрывать в UI |
| Подтверждение деструктивных действий | Approve/reject без confirm-modal |
| Пагинация таблиц (20 строк default) | Загружать все записи без пагинации |
| `loading` / `empty` / `error` на каждый модуль | Пустые таблицы без статуса |
| Status-chips одинаковые с couples/vendor | Разные цвета за разными компонентами |
| Фильтры сохраняются в URL (query params) | Фильтры только в state |
| `tabular-nums` для сумм | Обычные цифры в деньгах |
| Причина/комментарий при reject | Отклонение без объяснения |

---

## 10. Метрики аналитики (GET /api/admin/analytics)

```ts
// Приоритет расчёта (от готовых данных):
GMV         = SUM(payments.amount_uzs) WHERE status='paid'
orders_cnt  = COUNT(orders) GROUP BY date
avg_check   = GMV / orders_cnt
active_vets = COUNT(DISTINCT vets WHERE is_available=true)
conversion  = COUNT(orders WHERE service_type='food_pick') / COUNT(learn_progress WHERE status='completed')
top_vets    = SELECT vet_id, COUNT(*) FROM orders WHERE status='completed' GROUP BY vet_id LIMIT 5

// M1 — только статичные числа без графиков
// M4 — графики (recharts или victory-native)
```

---

## 11. Milestones

### M1 — Каркас + Верификация + Возвраты (MVP core)
1. `apps/admin/` — Vite + React + TS, sidebar layout.
2. Login: 3 демо-аккаунта (admin / moderator / support). Хранить role в zustand + localStorage.
3. RoleGuard: роуты защищены, 403 при недостатке прав.
4. Таблица `admin_users` + demo seed в `init.js`.
5. **Верификация:** `GET /api/admin/vendors?status=pending` → таблица с approve/reject + confirm-modal.
   - approve → `vendor_verification.status='verified'` + `vets.is_available=true`
   - reject → `vendor_verification.status='rejected'` + `comment`
   - Все действия → `audit_log`
6. **Заказы:** `GET /api/admin/orders` → таблица с поиском/фильтром. Детальная страница заказа. Кнопка «Возврат» → POST /refund → audit_log.
7. `loading` / `empty` / `error` везде.

### M2 — Модерация + Контент
1. Отзывы: таблица + `publish`/`hide` с аудитом.
2. Контент: CRUD `learn_items` (тип, категория, тело, виды питомцев, публикация).
3. Добрые дела: CRUD `good_deeds` (бюджет, статус).

### M3 — Споры + Поддержка
1. Таблица `disputes` + CRUD маршруты.
2. Экран «Споры»: очередь open → in_review → resolved.
3. Переписка внутри тикета (messages от admin к клиенту).
4. Кнопка «Вернуть средства» в разрешении спора.

### M4 — Финансы + Аналитика
1. Экран «Финансы»: транзакции, pending-выплаты, approve/reject выплат подрядчикам.
2. Экран «Аналитика»: GMV, кол-во заказов, средний чек, топ-ветеринары. Recharts-графики.

### M5 — Пользователи + Аудит + Настройки
1. CRUD `admin_users` с назначением ролей.
2. Экран «Аудит»: таблица всех действий с фильтром по actor / action / дате.
3. Экран «Настройки»: комиссия платформы, активные провайдеры оплаты.

---

## 12. Definition of Done

Каждый Milestone завершён, когда:
- [ ] RBAC: роли получают только разрешённые данные (403 иначе)
- [ ] Аудит-лог содержит запись для каждой мутации
- [ ] Подтверждение деструктивных действий (approve/reject/refund)
- [ ] `loading` / `empty` / `error` на каждом модуле
- [ ] Фильтры сохраняются в URL
- [ ] Демо-аккаунты (admin / moderator / support) — вход с первого раза
- [ ] `docker compose up -d` → все `/api/admin/` маршруты отвечают
- [ ] Status-chips визуально согласованы с couples и vendor
