# CLAUDE.md — гид по репозиторию (HappyTails)

Этот файл ориентирует Claude Code в проекте. Читай его первым, затем стратегию и дизайн.

## Что это за проект

**HappyTails** — маркетплейс услуг и контента о здоровье, питании и уходе за питомцами для рынка **Узбекистана**. Соединяет владельцев питомцев (спрос) с подрядчиками — ветеринары, кинологи, зоомагазины, эксперты (предложение) — и даёт обучающий контент. Локали: **узбекский и русский (uz/ru)**. Оплата: Click, Payme, Uzum Pay.

## Источники истины (читать перед работой)

- `PRODUCT.md` — стратегия: аудитория, цель, личность бренда, анти-референсы, принципы, a11y. Register: **product**.
- `DESIGN.md` — визуальная система: тёплая коралл/оранж палитра, токены, типографика Onest, компоненты, motion. Бренд и логотип HappyTails.
- `docs/service-spec.md` — полная техспека: роли, модель данных, 4 приложения, статусы заказа, платежи, объём MVP.
- `docs/prompts/*.md` — промт-брифы по направлениям (couples / vendor / admin). Бери соответствующий бриф как задание.

При расхождении приоритет: `service-spec.md` (что строим) → `PRODUCT.md` (зачем/для кого) → `DESIGN.md` (как выглядит).

## Структура (монорепо, npm workspaces)

```
apps/
  couples/        # клиент (спрос) — Telegram mini-app          → docs/prompts/couples.md
  vendor/         # подрядчики (предложение) — web-кабинет       → docs/prompts/vendor.md
  admin/          # внутренняя панель — web                      → docs/prompts/admin.md
  telegram-bot/   # бот + точка входа в mini-app
services/
  api/            # backend API (Express) + статичный hello-world ✅ запускается
packages/
  shared/         # общие типы, утилиты, локализация (uz/ru), бренд
docs/
  service-spec.md, prompts/
```

## Технологии и конвенции

- **Язык:** JavaScript/Node.js (Node ≥ 20, см. `.nvmrc`). TypeScript допустим для новых пакетов — согласуй и применяй единообразно.
- **Backend:** `services/api` на Express. Сейчас отдаёт hello-world и `/api/health`, `/api/hello`. БД — PostgreSQL (подключить при реализации; пока допустимы in-memory/моковые данные за тем же контрактом API).
- **Frontend:** React. couples — Telegram Web Apps SDK (mini-app); vendor/admin — React web. Общие токены/типы — из `packages/shared`.
- **Дизайн:** использовать CSS-переменные из `DESIGN.md` (готовый блок токенов). Шрифт Onest. Компоненты — по разделу «Components» в `DESIGN.md`.
- **i18n:** всё пользовательское — uz/ru, без хардкода строк; закладывать +30% длины.
- **a11y:** WCAG AA, видимый фокус, `prefers-reduced-motion`, цель нажатия ≥44px.
- **Анимации:** GSAP (уже установлен в `services/api`; для apps добавлять как зависимость приложения). Easing power2/power3, без bounce/elastic.

## Запуск

```bash
npm install
cp .env.example .env
npm start        # API + hello-world → http://localhost:3000
```

## Статусы заказа (канон для всех сторон)

`created → paid → accepted → in_progress → completed → reviewed`
ветви: `rejected → refunded`, `cancelled → refunded`. Подробности — `docs/service-spec.md` §8.1.

## Принципы работы

- Строй **тонкими сквозными срезами** (один поток end-to-end), а не всеми экранами сразу. Якорь — онлайн-консультация ветеринара.
- Не вкладывай карточку в карточку; иерархия — пространством и типографикой (см. анти-паттерны в `DESIGN.md`).
- Каждый PR/срез: рабочий запуск, экраны на uz/ru, состояния loading/empty/error, проверка контраста.
- Если установлен скилл `impeccable` (`.claude/skills/impeccable`) — используй `/impeccable craft|shape|audit` для UI-работы; он читает PRODUCT.md и DESIGN.md.

## Заметка по git

Папка лежит на синхронизируемом диске: индекс git здесь иногда повреждается (`bad signature` / `index file corrupt`), а shell-вид файла может «залипать». Если это случилось — файлы на диске корректны; восстановление: `rm -f .git/index && git reset`, затем добавить и закоммитить заново. Это не потеря данных.
