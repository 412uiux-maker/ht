# Pet Platform (Узбекистан)

Маркетплейс услуг и контента о здоровье, питании и уходе за питомцами. Монорепо с четырьмя приложениями.

## Структура

```
petplatform/
├── apps/
│   ├── couples/        # клиент (сторона спроса) — Telegram mini-app
│   ├── vendor/         # подрядчики (сторона предложения) — web-кабинет
│   ├── admin/          # внутренняя панель — web
│   └── telegram-bot/   # бот + точка входа в mini-app
├── services/
│   └── api/            # backend API (+ hello-world) ✅ запускается
├── packages/
│   └── shared/         # общие типы, утилиты, локализация (uz/ru)
└── docs/
    └── service-spec.md # техническая спецификация
```

## Требования
- Node.js >= 20 (см. `.nvmrc`)

## Быстрый старт

```bash
# 1. установить зависимости
npm install

# 2. скопировать переменные окружения
cp .env.example .env

# 3. запустить API + hello-world
npm start
```

Открыть в браузере: **http://localhost:3000**

Проверка API:
- http://localhost:3000/api/health
- http://localhost:3000/api/hello

## Что дальше
Текущий статус — рабочий каркас и hello-world. Дальнейшая реализация по приложениям — см. `docs/service-spec.md` (объём MVP, §10).
