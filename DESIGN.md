# Design

Starter visual system for the Pet Platform (Uzbekistan). Pre-implementation seed — derived from PRODUCT.md (register: product; personality: дружелюбный, современный, ясный) and the anti-references. Re-run `/impeccable document` once real UI exists to capture actual tokens.

## Theme

Тёплый, чистый, дружелюбный продукт о здоровье питомцев. Природная зелень как опора доверия, тёплые нейтрали вместо стерильного серо-синего, аккуратный тёплый акцент для моментов радости. Светлая и тёмная темы. Уважение к prefers-reduced-motion. Контраст — WCAG AA.

Сознательно избегаем: корпоративно-синий мед-портал, мультяшная переслащённость, шаблонный SaaS (Inter, фиолетовые градиенты, карточки-в-карточках).

## Color

Нейтрали тёплые и слегка затемнённые в зелень — не чистый серый, не чистый чёрный. Акцент используется редко и точечно (CTA-радость, «добрые дела»), не как фон.

### Light

| Роль | Токен | HEX | Примечание |
| --- | --- | --- | --- |
| Background | `--bg` | `#F6F7F4` | тёплый off-white |
| Surface | `--surface` | `#FFFFFF` | карточки, листы |
| Surface alt | `--surface-2` | `#FCFBF7` | вложенные зоны вместо второй карточки |
| Border | `--border` | `#E4E7E0` | тонкие разделители |
| Text primary | `--text` | `#1A2320` | тёплый near-black |
| Text muted | `--text-muted` | `#56625C` | вторичный (AA на bg/surface) |
| Primary (fill) | `--primary` | `#2E7D5B` | кнопки, активные состояния |
| Primary hover | `--primary-600` | `#26694C` | |
| Primary text-on-light | `--primary-strong` | `#1F5740` | зелёный текст/ссылки на светлом (AA ≥4.5) |
| On-primary | `--on-primary` | `#FFFFFF` | текст на зелёной заливке |
| Accent (warm) | `--accent` | `#E0814B` | тёплая терракота — точечно, моменты радости |
| Success | `--success` | `#2E7D5B` | совпадает с primary |
| Warning | `--warning` | `#C9821F` | |
| Danger | `--danger` | `#C2483B` | мягкий, не пожарно-красный |

### Dark

| Роль | Токен | HEX |
| --- | --- | --- |
| Background | `--bg` | `#121A16` |
| Surface | `--surface` | `#1A241F` |
| Surface alt | `--surface-2` | `#212D27` |
| Border | `--border` | `#2E3A33` |
| Text primary | `--text` | `#E9EDE9` |
| Text muted | `--text-muted` | `#9BA8A1` |
| Primary (fill) | `--primary` | `#4FB286` |
| On-primary | `--on-primary` | `#0E1713` |
| Accent | `--accent` | `#E8966A` |
| Danger | `--danger` | `#E0746A` |

Контраст: проверять каждую пару текст/фон до использования. Тёмно-зелёный (`--primary-strong`) — для зелёного текста и ссылок на светлом; `--primary` — для заливок с белым текстом.

## Typography

Без Inter / Arial / системных дефолтов. Обе гарнитуры с полной поддержкой кириллицы и латиницы (важно для uz/ru).

- **Display / Headings:** `Manrope` — геометричный, дружелюбно-современный, уверенный в крупных кеглях. Веса 700/800.
- **Body / UI:** `Golos Text` — спроектирован под кириллицу, отличная читаемость в мелком, нейтрально-тёплый. Веса 400/500/600.
- **Numeric / tabular:** `Golos Text` с `font-variant-numeric: tabular-nums` для цен и сумм.
- Fallback: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.

### Scale (modular ~1.25, mobile-first)

| Роль | Размер | Line-height | Шрифт / вес |
| --- | --- | --- | --- |
| Display | 32–40px (clamp) | 1.1 | Manrope 800 |
| H1 | 26px | 1.2 | Manrope 700 |
| H2 | 21px | 1.25 | Manrope 700 |
| H3 | 18px | 1.3 | Manrope 700 |
| Body L | 17px | 1.55 | Golos Text 400 |
| Body | 15px | 1.55 | Golos Text 400 |
| Caption | 13px | 1.4 | Golos Text 500 |
| Button | 15px | 1 | Golos Text 600 |

Длина строки контента ≤ ~70 символов. Закладывать +30% длины под узбекские/русские строки.

## Spacing & Layout

- **База 4px:** 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 56 · 72.
- Мобайл-først; контент-контейнер max ~440px для mini-app, ~1200px для vendor/admin web.
- Mini-app: нижняя навигация (bottom nav), крупные зоны нажатия (≥44px).
- Иерархия — через пространство и типографику, **не** через вложенные карточки. Одна карточка = одна логическая сущность; не вкладывать карточку в карточку.

## Radius & Elevation

- Радиусы: `--r-sm: 8px`, `--r-md: 12px`, `--r-lg: 16px`, `--r-pill: 999px` (только для чипов/тегов и аватаров, не для всего).
- Тени мягкие и тёплые, низкоконтрастные: `0 4px 16px rgba(26,35,32,.08)`. Без жёстких чёрных теней и неоновых свечений.

## Motion

GSAP уже подключён. Энергия — **сдержанная и осмысленная**, поддерживает ощущение спокойствия и доверия.

- Easing: `power2.out` / `power3.out` для входа, `power2.inOut` для переходов. **Без bounce/elastic** (выглядит устаревше и инфантильно).
- Длительности: 150–250ms микровзаимодействия, 300–600ms появление секций. Стаггер 40–60ms для списков.
- Назначение, а не украшение: подтверждение действия, направление внимания, плавность статусов заказа. Ничего критичного не передаётся только движением.
- **prefers-reduced-motion: reduce** → отключить/заменить на мгновенную смену; обязательное правило.

## Components (ориентиры)

- **Кнопки:** primary (зелёная заливка), secondary (контур/тонированная), ghost. Состояния hover/active/focus/disabled видимы; фокус — заметное кольцо.
- **Поля ввода:** крупные, с явными label и состояниями ошибки (текст + иконка, не только цвет).
- **Карточка услуги/подрядчика:** бейдж верификации, рейтинг, цена (tabular-nums), один явный CTA.
- **Статусы заказа:** спокойные чипы (created/paid/accepted/in_progress/completed) с понятной цветовой и текстовой маркировкой.
- **Чат консультации:** читаемые пузыри, вложения, итоговое заключение выделено.
- **Empty / error / loading состояния:** дружелюбные, с подсказкой следующего шага (см. принципы «спокойствие под стрессом»).

## Tokens (CSS-переменные, заготовка)

```css
:root {
  --bg: #F6F7F4; --surface: #FFFFFF; --surface-2: #FCFBF7; --border: #E4E7E0;
  --text: #1A2320; --text-muted: #56625C;
  --primary: #2E7D5B; --primary-600: #26694C; --primary-strong: #1F5740; --on-primary: #FFFFFF;
  --accent: #E0814B; --warning: #C9821F; --danger: #C2483B;
  --r-sm: 8px; --r-md: 12px; --r-lg: 16px; --r-pill: 999px;
  --font-display: "Manrope", system-ui, sans-serif;
  --font-body: "Golos Text", system-ui, sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #121A16; --surface: #1A241F; --surface-2: #212D27; --border: #2E3A33;
    --text: #E9EDE9; --text-muted: #9BA8A1;
    --primary: #4FB286; --on-primary: #0E1713; --accent: #E8966A; --danger: #E0746A;
  }
}
```
