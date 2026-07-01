# Claude Code · Профиль питомца — паспорт, чип, вакцинация

> **Как использовать:** `claude "Работай по docs/prompts/pet-passport.md — начни с M1"`
> Сначала прочитай этот файл целиком, затем `CLAUDE.md` → `docs/service-spec.md §7` → `DESIGN.md`.

---

## 1. Контекст и что уже существует (не пересоздавать)

Расширяем **существующую** сущность `Pet`. НЕ создавать питомца заново.

**Backend `services/api/` — Express + PostgreSQL** (`docker compose up -d`).

Существующая таблица и маршруты — не менять сигнатуру, только расширять:
```
pets (owner_id TEXT — UUID из localStorage['ht_owner_id'])
GET    /api/pets?owner_id=
POST   /api/pets     { owner_id, name, species, sex, ... }
PUT    /api/pets/:id
DELETE /api/pets/:id
```
Прототип-референс дизайна: `services/api/public/pets.html` (CRUD, эмодзи-пикер, вид/пол/вес/дата).

Авторизация: `owner_id` из `localStorage`, паттерн `getOwnerId()`. Новую схему auth не вводить.

---

## 2. Цель

Дать владельцу вести «паспорт» питомца: номер внешнего ветпаспорта, номер микрочипа и записи о вакцинации — как **дополнительные, необязательные** данные поверх базового профиля.

**Важно (закладываем архитектурно):**
- Внутренний `pets.id` (формат `HT-XXXX-XXXX`) — единственный первичный ключ. Всё вешаем на него.
- `passport_number` — просто текст внешнего документа. **Единой базы для автозагрузки данных по номеру паспорта не существует** — никаких внешних запросов, только ручной ввод.
- `microchip_number` — ISO 11784/11785 (15 цифр), `UNIQUE`, nullable. Хранить для будущих сверок, но автозаполнение на нём НЕ строить.

---

## 3. Решения по объёму MVP (согласовано)

| Вопрос | Решение на MVP |
|--------|----------------|
| Обязательные поля профиля | только `species` + `name`; всё остальное дозаполняется |
| Чип / паспорт | опциональны, ручной ввод, без валидации по реестру |
| Вес | скаляр (последнее значение); история веса — позже |
| Вакцинация | **M1:** фото страниц как `documents[]`. **M2:** структурированная сущность `Vaccination` |
| Подтверждение ветом | нет на MVP, доверяем владельцу (задел на будущее — поле `verified_by`) |
| Приватность медданных | сканы/записи видит владелец; вет активной консультации получает доступ по `order → pet` |

---

## 4. Модель данных

### 4.1 Расширение `pets` (ALTER, не пересоздавать)
```sql
ALTER TABLE pets ADD COLUMN IF NOT EXISTS color            TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS sterilized       BOOLEAN;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS microchip_number TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS passport_number  TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS passport_type    TEXT
      CHECK (passport_type IN ('eu','intl','none')) DEFAULT 'none';
ALTER TABLE pets ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ DEFAULT NOW();

-- частичный уникальный индекс: пустые чипы не конфликтуют
CREATE UNIQUE INDEX IF NOT EXISTS pets_microchip_uidx
  ON pets(microchip_number) WHERE microchip_number IS NOT NULL;
```
Валидация чипа на бэке: `^\d{15}$` (если задан). Иначе 422 с ключом ошибки.

### 4.2 Документы питомца — `pet_documents` (M1)
```sql
CREATE TABLE IF NOT EXISTS pet_documents (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id     UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL DEFAULT 'passport_page'
             CHECK (kind IN ('passport_page','vaccination','other')),
  file_url   TEXT NOT NULL,
  caption    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS pet_documents_pet_idx ON pet_documents(pet_id);
```

### 4.3 Вакцинация — `vaccinations` (M2)
```sql
CREATE TABLE IF NOT EXISTS vaccinations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id           UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  type             TEXT NOT NULL CHECK (type IN ('rabies','dhppi','other')),
  name             TEXT,                 -- вакцина/производитель
  date_administered DATE NOT NULL,
  valid_until      DATE,                 -- дата ревакцинации (для напоминаний)
  vet_name         TEXT,                 -- текст, или vendor при внутренней услуге
  document_id      UUID REFERENCES pet_documents(id),
  verified_by      TEXT,                 -- задел: user_id вета, NULL = не подтверждено
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS vaccinations_pet_idx ON vaccinations(pet_id);
```

---

## 5. Новые / расширенные API-маршруты

```ts
// pets — расширить существующие POST/PUT: принимать новые опциональные поля
// (color, sterilized, microchip_number, passport_number, passport_type)
// Валидация: species+name обязательны; microchip — ^\d{15}$ если задан (иначе 422).

// Документы (M1)
POST   /api/pets/:id/documents   { kind, file_url, caption? }        → PetDocument
GET    /api/pets/:id/documents                                       → PetDocument[]
DELETE /api/pets/:id/documents/:docId                                → { ok: true }

// Вакцинация (M2)
POST   /api/pets/:id/vaccinations { type, name?, date_administered, valid_until?, vet_name?, document_id? }
                                                                     → Vaccination
GET    /api/pets/:id/vaccinations                                    → Vaccination[]
DELETE /api/pets/:id/vaccinations/:vId                               → { ok: true }
```
Доступ: все `/api/pets/:id/*` проверяют, что `pet.owner_id === owner_id` из запроса (403 иначе). Вет активной консультации — доступ на чтение по `order → pet_id`.

---

## 6. Frontend (референс — `pets.html`, стек `apps/couples/`)

- В форму питомца добавить сворачиваемую секцию **«Документы и здоровье»** (по умолчанию свёрнута — не пугать в онбординге).
- Поля: чип (числовая маска, 15 цифр), номер паспорта + тип (eu/intl), кастрация (тумблер), цвет.
- Загрузка фото страниц паспорта → `pet_documents` (превью-галерея, удаление).
- **M2:** список вакцинаций с бейджем срока: `актуально` / `скоро` (≤30 дней до `valid_until`) / `просрочено`. Цвета — `--success` / `--warning` / `--danger` из `DESIGN.md`.
- Все строки через `t('key')` — `uz.ts` + `ru.ts`, закладывать +30% длины. Пример ключей: `pet.passport.title`, `pet.chip.hint`, `pet.vacc.status.expired`.

---

## 7. Правила (обязательно)

| ✅ Делать | ❌ Не делать |
|-----------|-------------|
| `ALTER TABLE ... IF NOT EXISTS` | Пересоздавать `pets`, менять сигнатуру старых маршрутов |
| Все новые поля опциональны | Требовать чип/паспорт в онбординге |
| Валидация чипа `^\d{15}$` только если задан | Блокировать сохранение из-за пустого чипа |
| Ручной ввод паспорта | Любые внешние запросы «по номеру паспорта» |
| `t('key')`, uz/ru | Хардкод строк |
| `loading` / `empty` / `error` на каждый экран | Пустой экран без статуса |
| Проверка `owner_id` на каждом `/pets/:id/*` | Доступ к чужому питомцу |
| Цель нажатия ≥44px, контраст AA | — |

---

## 8. Milestones

### M1 — Паспорт + чип + документы
1. Миграция §4.1 + §4.2 в `schema.sql`.
2. Расширить `POST`/`PUT /api/pets` новыми полями + валидация чипа.
3. Маршруты документов (§5) + проверка владельца.
4. Форма: секция «Документы и здоровье», загрузка/галерея фото паспорта.
5. `uz`/`ru` ключи, состояния loading/empty/error.

### M2 — Структурированная вакцинация
1. Миграция §4.3.
2. Маршруты вакцинаций (§5).
3. UI: список прививок + бейдж срока (актуально/скоро/просрочено).
4. (Задел) напоминание о ревакцинации по `valid_until`.

---

## 9. Definition of Done
- [ ] `docker compose up -d` → миграции применяются идемпотентно, старые данные целы
- [ ] Базовый CRUD питомца работает как раньше (регресса нет)
- [ ] Новые поля сохраняются/читаются; чип валидируется, дубликат → 422
- [ ] Чужой питомец недоступен (403)
- [ ] uz/ru без хардкода; loading/empty/error на каждом экране
- [ ] Контраст AA, цели ≥44px, `prefers-reduced-motion`
- [ ] Нигде нет попыток «автозагрузки данных по номеру паспорта»
