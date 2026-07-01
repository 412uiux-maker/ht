# Claude Code · Медкарта питомца — два направления через единую ленту

> **Как использовать:** `claude "Работай по docs/prompts/health-record.md — начни с M1"`
> Сначала прочитай целиком, затем `CLAUDE.md` → `docs/service-spec.md §7,§8` → `docs/prompts/pet-passport.md` → `DESIGN.md`.

---

## 1. Главная идея (не отступать от неё)

Сервис = **два ритма вокруг одного объекта — медкарты питомца (`pets.id` = `HT-…`)**, а НЕ два раздельных продукта.

- **Слежение за здоровьем** — режим владельца, непрерывный: паспорт, чип, вакцинации, вес, напоминания. (Данные — из `pet-passport.md`.)
- **Консультация врача** — маркетплейс, разовое событие: заказ → оплата → чат/видео → итог. (Уже есть: `consult.html`, `orders`, `consultations`.)

Связующее звено — **единая лента событий `health_events`** на питомца. Оба направления *пишут* в неё; владелец видит один хронологический дневник.

Петля монетизации: слежение генерирует поводы (просрочена прививка, падает вес) → кнопка «Спросить врача» с уже прикреплённым контекстом → платная консультация → её итог возвращается в ленту.

```
Слежение ─(чтение/запись)─▶ МЕДКАРТА ◀─(читает)─ Консультация
     │                                                  │
     └────────────▶  health_events (лента)  ◀───────────┘
                          │ напоминание
                          └────────▶ «Спросить врача» ─▶ Консультация
```

---

## 2. Что уже существует (не пересоздавать)

**Backend `services/api/`** — Express + PostgreSQL (`docker compose up -d`). Существующее не менять по сигнатуре:
```
pets (owner_id TEXT), vets, consultations, messages, orders (если создана по couples.md)
GET/POST/PUT/DELETE /api/pets ;  POST/GET /api/consultations[...] ;  /ws/signal
```
Из `pet-passport.md` (реализовать при необходимости первым): `pets` расширена паспортом/чипом, `pet_documents`, `vaccinations`.

Авторизация — `owner_id` из `localStorage['ht_owner_id']`. Новую схему auth не вводить.

---

## 3. Модель данных — новое

### 3.1 Единая лента `health_events`
```sql
CREATE TABLE IF NOT EXISTS health_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id      UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN
              ('vaccination','weight','consultation','prescription','reminder','note')),
  source      TEXT NOT NULL DEFAULT 'owner' CHECK (source IN ('owner','vet','system')),
  ref_table   TEXT,        -- 'consultations' | 'vaccinations' | 'orders' | NULL
  ref_id      TEXT,        -- id связанной записи
  title       TEXT NOT NULL,
  note        TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS health_events_pet_time_idx
  ON health_events(pet_id, occurred_at DESC);
```

**Правило записи в ленту (единая точка):** серверный хелпер `logHealthEvent(petId, {...})`. Вызывать его:
- при завершении консультации (`PATCH /api/consultations/:id/status` = completed) → `type:'consultation', source:'vet', ref_table:'consultations'`, `title` = краткий summary;
- при добавлении вакцинации → `type:'vaccination', source:'owner'|'vet'`;
- при обновлении веса питомца → `type:'weight'`;
- напоминания генерит фоновая задача (см. M3) → `type:'reminder', source:'system'`.

Лента — **производная**: не дублируй в неё полные данные, храни ссылку (`ref_table`/`ref_id`) и человекочитаемый `title`.

---

## 4. API — новое / расширенное

```ts
// Лента событий
GET  /api/pets/:id/events?type=&limit=&before=   → HealthEvent[]   (по occurred_at DESC)
POST /api/pets/:id/events { type:'note'|'weight', title, note?, occurred_at? } → HealthEvent
     // ручные записи владельца; consultation/vaccination/reminder создаются сервером, не тут

// Вес (пишет и в pets.weight, и событие 'weight')
POST /api/pets/:id/weight { value, measured_at? }   → { pet, event }

// Консультация из контекста (петля монетизации)
POST /api/consultations   { owner_id, vet_id, pet_id, reason_event_id? }
     // reason_event_id — необяз. ссылка на событие-триггер (напоминание/тревога)
```
Доступ: все `/api/pets/:id/*` проверяют `pet.owner_id === owner_id` (403 иначе). Вет активной консультации — чтение ленты по `order/consultation → pet_id`.

---

## 5. Frontend (`apps/couples/`, референс `pets.html`/`consult.html`, стек из couples.md)

- **Экран «Здоровье» питомца** = медкарта сверху (паспорт/чип/вакцинации из `pet-passport.md`) + **лента `health_events`** ниже, сгруппированная по датам.
- Иконка/цвет события по `type`; бейдж срока вакцинации: `актуально` / `скоро` (≤30 дн) / `просрочено` → `--success`/`--warning`/`--danger`.
- **Кнопка «Спросить врача»** живёт прямо в медкарте и в карточке тревожного события; ведёт в поток консультации с предзаполненным `pet_id` (+ `reason_event_id`).
- После завершённой консультации её итог **виден в той же ленте** — без отдельного экрана «история консультаций».
- Навигация: не два раздела меню, а один экран питомца с двумя действиями (вести/спросить). Telegram BackButton на вложенных экранах.
- i18n uz/ru через `t('key')`, +30% длины. Ключи: `health.timeline.title`, `health.event.vaccination`, `health.ask_vet`, `health.vacc.status.expired`.

---

## 6. Правила

| ✅ Делать | ❌ Не делать |
|-----------|-------------|
| Лента — производная, через `logHealthEvent` | Дублировать полные данные консультации в ленту |
| Один экран питомца, два действия | Два независимых раздела/силоса |
| «Спросить врача» из контекста тревоги (`reason_event_id`) | Начинать консультацию без `pet_id` |
| Проверка `owner_id` на каждом `/pets/:id/*` | Доступ к чужому питомцу |
| `t('key')`, uz/ru, +30% | Хардкод строк |
| loading/empty/error, цели ≥44px, контраст AA | Пустой экран без статуса |
| Никакой «автозагрузки по номеру паспорта» | Внешние запросы по паспорту/чипу |

---

## 7. Milestones

### M1 — Лента + запись из консультации (ядро связи)
1. Миграция §3.1 + хелпер `logHealthEvent`.
2. `GET /api/pets/:id/events`, `POST /api/pets/:id/events` (note), проверка владельца.
3. Хук в `PATCH /api/consultations/:id/status` → событие `consultation`.
4. Экран «Здоровье»: медкарта + лента, сгруппированная по датам; loading/empty/error; uz/ru.

### M2 — Слежение пишет в ленту + петля «Спросить врача»
1. `POST /api/pets/:id/weight` (обновляет `pets.weight` + событие `weight`).
2. Вакцинации (`pet-passport.md`) → событие `vaccination`.
3. `reason_event_id` в `POST /api/consultations`; кнопка «Спросить врача» из медкарты/события с предзаполнением `pet_id`.

### M3 — Напоминания (system-события)
1. Фоновая задача: по `vaccinations.valid_until` (≤30 дн / просрочено) создаёт событие `reminder`.
2. (Позже) Telegram-пуш по напоминанию с deep-link в медкарту.

---

## 8. Definition of Done
- [ ] `docker compose up -d` → миграции идемпотентны, старые данные и маршруты целы
- [ ] Завершение консультации автоматически появляется в ленте питомца
- [ ] Обновление веса / добавление вакцины появляется в ленте
- [ ] «Спросить врача» из медкарты открывает консультацию с нужным `pet_id`
- [ ] Чужой питомец недоступен (403)
- [ ] Один экран «Здоровье» покрывает оба направления; нет второго силоса
- [ ] uz/ru без хардкода; loading/empty/error; контраст AA; цели ≥44px; `prefers-reduced-motion`
