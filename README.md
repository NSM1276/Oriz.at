# ORIZ

Premium SaaS — заменяет бумажное меню и сайт ресторана. Тихая роскошь, живые данные, мгновенные обновления.

**Production:** https://oriz.at  
**Supabase project:** `btydsogglgrtldfiezfu` (Frankfurt, eu-central-1)  
**Vercel:** авто-деплой из ветки `main`

---

## Stack

| Слой | Технология |
|------|-----------|
| Frontend | Next.js 16 App Router · TypeScript strict · Tailwind v4 |
| Backend | Supabase — Postgres + Auth + Realtime + Storage |
| Хостинг | Vercel (Frankfurt edge) |
| DNS | IONOS → oriz.at |

---

## Переменные окружения (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # только на сервере — для demo и admin-reset
```

---

## Маршруты

| URL | Что это |
|-----|---------|
| `/` | Лендинг (маркетинг) |
| `/[venueSlug]` | Гостевое меню (RSC + Realtime) |
| `/[venueSlug]/print` | Печатная версия / PDF |
| `/admin` | Владелец — управление меню |
| `/admin/login` | Вход (email + пароль) |
| `/demo` | Публичная демо-админка (без логина) |
| `/api/demo/update` | PATCH — изменить поле блюда в демо |
| `/api/demo/reset` | POST/GET — сбросить демо к оригиналу |
| `/api/caption` | POST — AI-генерация Story через Claude |
| `/api/bot/hook` | Telegram bot webhook |

---

## Аутентификация

- **Тип:** email + пароль (Supabase Auth)
- **Super Admin:** `nasim2131@gmail.com` — видит все venues и редактирует их через `SuperAdminView`
- **Обычный владелец:** видит только свой venue
- **Redirect:** `/admin` → `/admin/login` если не залогинен (server-side `getUser()`)

---

## Демо-система (Trattoria Belvedere)

Полностью вымышленный ресторан, доступен всем без логина по адресу `/demo`.

### Ключевые ID
```
Venue ID:       9019d1cf-f1af-482f-9673-2a78846fa405
Venue slug:     belvedere
Гостевое меню: oriz.at/belvedere
```

### Секции и их section_id
| Секция | section_id |
|--------|-----------|
| Antipasti | `7db0d81e-e139-4586-8e57-599dd85bb948` |
| Zuppe & Insalate | `3e118b21-eddd-4ee2-8575-9a5ced5e60ea` |
| Pasta & Risotto | `2db00df6-15f7-4a61-9b51-c2584439a70b` |
| Secondi Piatti | `784b8549-e6ff-40ec-915b-157ed82d8a93` |
| Contorni | `7c521dce-3756-46c5-9ade-2dc9b3b58e5f` |
| Dolci | `972fe15e-66ea-4809-b298-6490e1f0c498` |

### Цвета
```
color_bg:      #1C1208  (тёмный эспрессо)
color_primary: #C8963E  (итальянское золото)
```

### Что можно делать в демо
- Менять цены (`price_cents`)
- Переключать доступность (`is_active`) → «Verfügbar» / «Ausverkauft»
- Писать Story/описание (`ai_caption`) — через модал
- Добавлять аллергены (`allergens`)
- Фото-upload **отключён** (кнопка видна, но задизаблена)
- AI-генерация **отключена** (кнопка видна, но задизаблена)

### Автосброс
`vercel.json` → cron `0 3 * * *` (каждую ночь в 3:00) вызывает `/api/demo/reset`.

Эндпоинт делает `upsert` всех 33 блюд по ID, восстанавливая оригинальные значения включая `ai_caption: null` и `allergens: null`.

**Важно:** в `RESET_DATA` обязательно должны присутствовать `section_id` и `venue_id` — иначе upsert падает с NOT NULL constraint.

### API безопасность (`/api/demo/update`)
- Разрешённые поля (allowlist): `price_cents`, `is_active`, `description`, `ai_caption`, `allergens`
- Перед обновлением проверяется `venue_id = DEMO_VENUE_ID` — нельзя изменить блюда из других venue

---

## Реальная админка (`/admin`)

Компонент `ItemEditor` (`src/components/admin/ItemEditor.tsx`):

| Поле | Как работает |
|------|-------------|
| Цена | Текстовый input, blur → `supabase.update`, optimistic UI |
| Статус | Кнопка «Verfügbar» / «Ausverkauft», optimistic toggle |
| Фото | Upload в Supabase Storage `item-images`, сохраняется `image_url` |
| Story | Модал с textarea (280 символов) + AI-кнопка → `/api/caption` |
| Аллергены | Inline input, blur → сохранение |

### QR-код
Компонент `QRCodeBlock` генерирует QR через `api.qrserver.com`, ссылка ведёт на `oriz.at/{slug}`.

### Печать
`/[venueSlug]/print` — чистая страница для PDF. Скрытые блюда (`is_active=false`) не отображаются.

---

## AI Caption (`/api/caption`)

- Модель: Claude (Anthropic)
- Вход: `itemId` → берёт из DB `name + description`
- Выход: текст ≤280 символов, записывается в `items.ai_caption`
- Лимит: `ai_credits_used` / `ai_credits_reset` в таблице `venues`, лимит зависит от плана (`src/lib/plans.ts`)

---

## Планы (`src/lib/plans.ts`)

| Plan | AI лимит/месяц |
|------|---------------|
| trial | 5 |
| starter | 20 |
| pro | 100 |

---

## Realtime

Гостевое меню подписывается на канал `venue:{venueId}:items` через Supabase Realtime.
Фильтр: `venue_id=eq.{venueId}`. При UPDATE/INSERT/DELETE — мгновенное обновление без перезагрузки.

Требует: `ALTER TABLE items REPLICA IDENTITY FULL` (миграция `0002_realtime.sql`).

---

## Лендинг — демо-карточки

```ts
// src/app/page.tsx
const DEMO_VENUES = [
  { slug: "belvedere",  isAdmin: false, cta: "Menü öffnen"   },  // → /belvedere
  { slug: "demo",       isAdmin: true,  cta: "Ausprobieren"  },  // → /demo
]
```

---

## Super Admin

Email `nasim2131@gmail.com` → видит `SuperAdminView` с таблицей всех venues.
Можно редактировать: название, slug, `about`, цвета (`color_bg`, `color_primary`), `logo_url`, план, Instagram, Google Maps.

---

## Локальный запуск

```bash
npm install
npm run dev   # http://localhost:3000
```

Суперадмин входит через `/admin/login` с email + паролем.

---

## Миграции Supabase

Применяются вручную в Supabase SQL Editor:

| Файл | Что делает |
|------|-----------|
| `0001_schema.sql` | Основные таблицы: venues, sections, items + RLS |
| `0002_realtime.sql` | Realtime publication + replica identity |
| `0003_...` и выше | Добавочные колонки, смотри файлы |

---

## Ключевые файлы

```
src/
  app/
    page.tsx                    — Лендинг
    [venueSlug]/page.tsx        — Гостевое меню
    [venueSlug]/print/page.tsx  — Печать/PDF
    admin/page.tsx              — Реальная админка
    demo/page.tsx               — Публичная демо-админка
    api/
      caption/route.ts          — AI Story-генерация
      demo/update/route.ts      — Изменение данных в демо
      demo/reset/route.ts       — Сброс демо (cron)
  components/
    admin/
      ItemEditor.tsx            — Основной редактор блюда
      QRCodeBlock.tsx           — QR-код блок
      SectionNav.tsx            — Стики-навигация по секциям (prop topOffset для демо)
      SuperAdminView.tsx        — Super admin таблица venue
    demo/
      DemoItemEditor.tsx        — Редактор блюда для демо (без фото и AI)
    landing/
      HeroAtmosphere.tsx        — Hero с фото-слайдшоу и cycling-словами
  lib/
    supabase/
      client.ts                 — Browser client
      server.ts                 — RSC server client (cookies)
      types.ts                  — DB types
    plans.ts                    — AI лимиты по планам
    imageUpload.ts              — Upload в Supabase Storage
```
