# Claude Code · Stage 0 Revised — gate до первой платной консультации

> **Как использовать:**
> ```
> claude "Работай по docs/prompts/stage0-revised.md — начни с Gate Check"
> ```
> Сначала прочитай этот файл, затем `CLAUDE.md` → `PRODUCT.md` → `docs/council-service-roadmap.md`.

---

## Контекст и решение совета

LLM Council (`docs/council-service-roadmap.md`) определил единственный release gate Этапа 0:

> **Закрыть одну end-to-end платную транзакцию между реальным владельцем питомца и верифицированным ташкентским ветеринаром, с реальными деньгами через Click или Payme, в рамках юридически проверенной операционной модели.**

Ничто из Этапа 1 не начинается, пока этот gate не закрыт. Всё ниже — работа, необходимая для этого gate.

---

## Текущее состояние (что уже работает)

```
✅ POST /api/consultations          — создать консультацию
✅ GET  /api/consultations/:id      — консультация + сообщения
✅ POST /api/consultations/:id/messages — чат клиент↔vet
✅ PATCH /api/consultations/:id/status  — смена статуса
✅ POST /api/payments/simulate      — симуляция оплаты (Click/Payme/Uzum)
✅ apps/couples/                    — экраны Booking → Chat → завершение
✅ apps/vendor/ (React)             — Login, Dashboard, Chat (порт prototype)
✅ services/api/public/vendor.html  — standalone прототип (работает на :8080)
```

**Что сломано или отсутствует (обнаружено советом):**

```
❌ Реальная платёжная интеграция — только simulate
❌ Vendor cabinet не даёт ценности ветеринару: нет расписания, нет истории клиентов
❌ Нет механизма доверия: нет рейтингов, нет отзывов, нет dispute-flow
❌ VoIP — кнопка есть, стабильная интеграция не доказана (нужен spike)
❌ Нет верификации подрядчика (vet.is_available не привязан к реальной проверке)
```

---

## Gate Check (делай первым)

Перед тем как писать код, запусти полный flow вручную и залоггируй каждый слом:

```bash
# 1. Создать консультацию
curl -X POST http://localhost:3000/api/consultations \
  -H "Content-Type: application/json" \
  -d '{"vet_id":1,"client_name":"Test","pet_name":"Bars","pet_species":"cat","problem":"чешется"}'

# 2. Симулировать оплату
curl -X POST http://localhost:3000/api/payments/simulate \
  -H "Content-Type: application/json" \
  -d '{"consultation_id":"<id из шага 1>","provider":"click","amount_uzs":50000,"owner_id":"test-owner"}'

# 3. Проверить статус заказа
curl http://localhost:3000/api/orders?owner_id=test-owner
```

Зафиксируй все HTTP ошибки, несоответствия статусов, отсутствующие поля. Это список того, что правишь в M0.

---

## Milestone 0 — Починить существующий flow

**Цель:** полный payment flow без ошибок консоли от Booking до статуса `paid`.

### Backend
- [ ] `POST /api/payments/simulate` должен обновлять `consultation.status` → `paid` и создавать запись в `orders`
- [ ] `GET /api/orders?owner_id=` должен возвращать поле `consult_status` актуальным
- [ ] `PATCH /api/consultations/:id/status` — все переходы по канону из `CLAUDE.md`
- [ ] Поле `vet.is_available` — при `is_available=false` ветеринар не возвращается в `GET /api/vets`

### Frontend (couples)
- [ ] После оплаты показывать `status=paid`, не `created`
- [ ] Экран истории заказов (`Orders`) отражает реальный статус консультации
- [ ] `loading` / `error` / `empty` на всех экранах booking-flow

**DoD M0:** `npm start` → создать консультацию → оплатить → статус `paid` — без ошибок.

---

## Milestone 1 — Vendor cabinet как рабочий инструмент ветеринара

**Цель:** ветеринар открывает кабинет и получает то, чего не даёт Instagram DM:
расписание, историю клиентов, статистику дохода.

### 1.1 Расписание (scheduling)

**Schema** (добавить в `services/api/src/db/schema.sql`):
```sql
CREATE TABLE IF NOT EXISTS vendor_slots (
  id        SERIAL PRIMARY KEY,
  vet_id    INTEGER REFERENCES vets(id),
  slot_at   TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN DEFAULT false,
  consult_id UUID REFERENCES consultations(id),
  UNIQUE(vet_id, slot_at)
);
```

**Routes** (добавить в `services/api/src/routes/vendor.js`):
```
GET  /api/vendor/slots?vet_id=&date=YYYY-MM-DD  → Slot[]
PUT  /api/vendor/slots   { vet_id, date, hours:[9,10,14,15] }
```

**Screen** `apps/vendor/src/screens/Schedule/`:
- Неделя вперёд, 8:00–20:00, шаг 1 час
- Клик на час — открыть / закрыть слот
- Занятые слоты (`is_booked=true`) — серые, нельзя снять
- uz/ru: «Слотлар» / «Слоты»

### 1.2 История клиентов

Ветеринар должен видеть всю историю по владельцу, не только текущую консультацию.

**Route**:
```
GET /api/vendor/clients?vet_id=   → Client[]
  Client { owner_name, pet_name, pet_species, last_visit, consult_count, last_summary }
```
Реализация: `SELECT DISTINCT ON (client_name) ...` из `consultations` по `vet_id`.

**Screen** `apps/vendor/src/screens/Clients/`:
- Список клиентов: имя владельца, питомец, дата последнего визита, кол-во консультаций
- Клик → история консультаций с этим клиентом (статус + краткое заключение)
- Поиск по имени клиента/питомца

### 1.3 Финансы (базовые)

**Route** (заглушка с реальными данными из DB):
```
GET /api/vendor/finance?vet_id=
  → { total_earned_uzs, pending_uzs, completed_count, recent: Transaction[] }
```
`Transaction { date, client_name, amount_uzs, status }`

**Screen** `apps/vendor/src/screens/Finance/`:
- 3 стат-карточки: заработано всего / в ожидании / завершённых консультаций
- Таблица последних 20 транзакций
- Кнопка «Запросить выплату» → `POST /api/vendor/payouts` (статус `pending`, подтверждение от admin)

---

## Milestone 2 — Доверие: рейтинги и dispute-flow

**Цель:** если консультация прошла плохо — пользователь видит куда жаловаться, а новый пользователь видит рейтинг ветеринара.

### 2.1 Рейтинги и отзывы

**Schema**:
```sql
CREATE TABLE IF NOT EXISTS reviews (
  id              SERIAL PRIMARY KEY,
  consultation_id UUID UNIQUE REFERENCES consultations(id),
  vet_id          INTEGER REFERENCES vets(id),
  owner_id        TEXT NOT NULL,
  rating          INTEGER CHECK (rating BETWEEN 1 AND 5),
  text            TEXT,
  vet_reply       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

**Routes**:
```
POST /api/consultations/:id/review   { owner_id, rating:1-5, text? }
  — только если status='completed', только один раз
GET  /api/vets/:id/reviews           → Review[]
GET  /api/vendor/reviews?vet_id=     → Review[] (для кабинета)
POST /api/vendor/reviews/:id/reply   { vet_id, text }
```

После добавления отзыва — пересчитать `vets.rating = AVG(rating)`.

**Couples UI:**
- После `status=completed` — показать экран «Оставить отзыв» (5 звёзд + текст опционально)
- На карточке ветеринара в списке — средний рейтинг + кол-во отзывов
- Отзывы видны на профиле ветеринара

**Vendor UI:**
- Экран `Reviews/`: список отзывов + форма ответа
- Dashboard: показывать текущий рейтинг и кол-во отзывов в stats-grid

### 2.2 Dispute / жалоба

Минимальный механизм — **не модальное окно**, а отдельный экран с формой.

**Schema**:
```sql
CREATE TABLE IF NOT EXISTS disputes (
  id              SERIAL PRIMARY KEY,
  consultation_id UUID REFERENCES consultations(id),
  owner_id        TEXT NOT NULL,
  reason          TEXT NOT NULL,   -- free text, max 500 chars
  status          TEXT DEFAULT 'open' CHECK (status IN ('open','resolved','closed')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

**Route**:
```
POST /api/consultations/:id/dispute  { owner_id, reason }
  — только если status IN ('completed','paid'), только один раз
GET  /api/disputes?owner_id=         → Dispute[]  (история жалоб пользователя)
```

**Couples UI:**
- В деталях завершённой консультации — ссылка «Проблема с консультацией» → форма
- После отправки: «Ваша жалоба зарегистрирована, мы свяжемся в течение 24ч»

---

## Milestone 3 — VoIP spike

**Цель:** доказать, что звонок между Couples и vendor cabinet работает в staging. Это spike, не production-ready.

**Задача:**
1. Поднять видеозвонок (`/video.html?id=<cid>&role=vet`) на реальных условиях: два разных браузера / устройства, не localhost
2. Задокументировать: работает ли WebRTC NAT traversal (нужен TURN-сервер?), как ведёт себя при слабом соединении
3. Оценить: Daily.co / Agora vs self-hosted как production-вариант — стоимость, latency, Uzbekistan compliance

**Output spike'а** — файл `docs/voip-spike.md`:
```markdown
# VoIP Spike Report

## Tested
- Устройства: ...
- Network: ...

## Results
- WebRTC peer-to-peer: ✅/❌
- NAT traversal без TURN: ✅/❌
- Quality at <5 Mbps: ...

## Recommendation
Daily / Agora / self-hosted TURN — почему

## Blockers before Stage 1
- ...
```

**Не реализовывать полный VoIP в Stage 0.** Только задокументировать реальность.

---

## API-контракт (сводка новых маршрутов)

```
GET  /api/vendor/slots?vet_id=&date=
PUT  /api/vendor/slots
GET  /api/vendor/clients?vet_id=
GET  /api/vendor/finance?vet_id=
POST /api/vendor/payouts

POST /api/consultations/:id/review
GET  /api/vets/:id/reviews
GET  /api/vendor/reviews?vet_id=
POST /api/vendor/reviews/:id/reply

POST /api/consultations/:id/dispute
GET  /api/disputes?owner_id=
```

Все защищённые vendor-маршруты — через `requireVendor` middleware.

---

## Схема БД (сводка изменений)

Добавить в `services/api/src/db/schema.sql`:
- `vendor_slots`
- `reviews`
- `disputes`
- `vendor_payouts`

Добавить в `services/api/src/db/init.js` seed-данные для `reviews` (2–3 отзыва на демо-ветеринаров).

---

## Правила реализации

| ✅ Делать | ❌ Не делать |
|-----------|-------------|
| uz/ru i18n на всех новых экранах | Хардкод строк |
| loading / empty / error на каждом экране | Экраны без состояний |
| Рейтинг ветеринара виден до бронирования | Скрывать отзывы |
| Dispute — простая форма, не pop-up | Модальное окно для жалоб |
| VoIP — только spike, не full build | Полный VoIP в Stage 0 |
| Расписание — только ветеринар управляет слотами | Автоматическое создание слотов |
| После M0 gate check — всё остальное | Начинать M1 до закрытия M0 |

---

## Что НЕ делать в этом промте

- Не реализовывать Этап 2 (кинологи, грумеры, доставка корма)
- Не строить Community/Learning features
- Не делать AI-рекомендации
- Не расширяться на другие города / страны
- Не трогать Telegram-бот (отдельный промт)

---

## Definition of Done (Stage 0 Gate)

- [ ] `npm start` → создать консультацию → оплатить симуляцией → `status=paid` без ошибок
- [ ] Ветеринар видит консультацию в своём кабинете, отвечает в чате, завершает
- [ ] Владелец оставляет отзыв после `completed`
- [ ] Владелец может подать жалобу
- [ ] Ветеринар видит расписание + историю клиентов + базовые финансы
- [ ] VoIP spike задокументирован в `docs/voip-spike.md`
- [ ] uz/ru на всех новых экранах
- [ ] loading/empty/error на всех новых экранах
