# js-cloudimage-video-hotspot — Спецификация

> Версия: 2.0.0 (планируется)
> Дата: 2026-02-24

---

## Содержание

1. [Обзор](#1-обзор)
2. [Текущее состояние](#2-текущее-состояние-v100)
3. [Конкуренты](#3-конкуренты)
4. [Дорожная карта](#4-дорожная-карта)
5. [Фаза 1: YouTube / Vimeo / HLS](#5-фаза-1-youtube--vimeo--hls)
6. [Фаза 2: Shoppable карточки](#6-фаза-2-shoppable-карточки)
7. [Фаза 3: Визуальный редактор](#7-фаза-3-визуальный-редактор)
8. [Фаза 4: Будущее](#8-фаза-4-будущее)
9. [Архитектура](#9-архитектура)
10. [API](#10-api)
11. [Доступность](#11-доступность)
12. [Сборка](#12-сборка)

---

## 1. Обзор

### Идея

Плагин превращает любое видео в интерактивный шоппабл-опыт. Хотспоты появляются, двигаются и исчезают синхронно с видео. Поддержка HTML5, YouTube, Vimeo. Визуальный редактор для создания конфигураций без кода.

### Принципы

- **Ноль зависимостей** — чистый TypeScript
- **Лёгкий** — менее 20 КБ (gzip)
- **Доступный** — WCAG 2.1 AA из коробки
- **Любой фреймворк** — vanilla JS, React, что угодно
- **Open-source** — MIT лицензия
- **E-commerce фокус** — карточки товаров, CTA, add-to-cart callback

### Стек

| Слой | Технология |
|------|-----------|
| Язык | TypeScript 5.5+ |
| Сборка | Vite 5.4+ |
| Тесты | Vitest 2.1+ |
| Линтер | ESLint 8 |
| Форматы | ESM, CJS, UMD |
| React | Опциональная зависимость (17+) |
| Редактор | React + TypeScript + Vite (отдельный пакет) |

---

## 2. Текущее состояние (v1.0.0)

### Структура проекта

```
src/
├── core/           # Главный класс, типы, конфиг, таймлайн
├── markers/        # Создание и анимация маркеров
├── popover/        # Поповеры, шаблон, позиционирование, санитизация
├── player/         # Видеоплеер, контролы, прогресс-бар
├── fullscreen/     # Полноэкранный режим
├── hotspot-nav/    # Навигация по хотспотам (пред/след)
├── a11y/           # Клавиатура, ARIA, фокус
├── utils/          # Координаты, DOM, события, время
├── react/          # React компонент и хук
├── styles/         # CSS (855 строк, 79 переменных)
└── index.ts        # Точка входа
```

### Что уже есть

| Фича | Описание |
|------|----------|
| Хотспоты по времени | Появляются/исчезают по `startTime`/`endTime` |
| Кейфреймы | Хотспоты следуют за объектами на 60fps |
| Поповеры | Клик или ховер, авто-позиционирование |
| Карточка товара | Картинка, название, цена, старая цена, бейдж, CTA |
| Стили маркеров | `dot`, `dot-label`, `icon`, `numbered` |
| Пульс | Анимация "дыхание" + кольцо |
| Анимации входа/выхода | `fade`, `scale`, `none` |
| Индикаторы на таймлайне | Точки или полосы на прогресс-баре |
| Главы | Именованные сегменты, dropdown, разделители |
| Навигация | Кнопки "пред/след" со счётчиком |
| Контролы видео | Play, громкость, скорость, время, fullscreen |
| Клавиатура | Space, стрелки, N/P, F, M, Escape, Tab |
| ARIA | Live region, фокус-трап, aria-label |
| Темы | Светлая + тёмная через CSS переменные |
| React | Компонент, хук, ref API |
| Авто-инициализация | HTML data-атрибуты |
| Cloudimage CDN | Оптимизация постеров |
| Runtime API | Добавление/удаление/обновление хотспотов |

### Основные типы

```typescript
// Хотспот
interface VideoHotspotItem {
  id: string;               // уникальный ID
  x: string | number;       // '65%' или 65
  y: string | number;       // '40%' или 40
  startTime: number;        // появляется (секунды)
  endTime: number;          // исчезает (секунды)
  label: string;            // для скринридера

  keyframes?: Keyframe[];   // анимация движения
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

  data?: PopoverData;       // данные для шаблона
  content?: string;         // произвольный HTML

  markerStyle?: 'dot' | 'dot-label' | 'icon' | 'numbered';
  animation?: 'fade' | 'scale' | 'none';
  trigger?: 'hover' | 'click';
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';

  pauseOnShow?: boolean;
  pauseOnInteract?: boolean;
  onClick?: (event, hotspot) => void;
  chapterId?: string;
}

// Данные для карточки товара
interface PopoverData {
  title?: string;
  price?: string;
  originalPrice?: string;
  description?: string;
  image?: string;
  url?: string;
  ctaText?: string;         // по умолчанию: 'View details'
  badge?: string;           // 'NEW', 'SALE', '-30%'
}

// Глава видео
interface VideoChapter {
  id: string;
  title: string;
  startTime: number;
  endTime?: number;          // авто-рассчитывается
}
```

---

## 3. Конкуренты

| Платформа | Плюсы | Минусы | Цена |
|-----------|-------|--------|------|
| **WIREWAX** (Vimeo) | AI-трекинг объектов | $8000+/видео, закрытая экосистема | $$$$$ |
| **Cinema8** | 500+ виджетов, ветвление, квизы | Перегруженный UI, vendor lock-in | $$$ |
| **HapYak** (Brightcove) | Аналитика, CRM | Нет бесплатного тарифа | $$$$ |
| **Eko** | Ветвление, 70%+ вовлечённость | Мало фич, низкая узнаваемость | Бесплатно |
| **Mindstamp** | Доступная цена, условная логика | Слабый e-commerce | $ |
| **Spott** | Шоппабл-видео | Нет motion tracking | $-$$ |
| **ThingLink** | 360/3D/VR | Базовая аналитика | $$ |

### Наши преимущества

1. **Ноль зависимостей** — конкуренты тянут тяжёлые фреймворки
2. **Open-source (MIT)** — конкуренты стоят $15-8000/мес
3. **WCAG 2.1 AA** — никто из конкурентов не делает доступность
4. **API + визуальный редактор** — для разработчиков и маркетологов
5. **Мульти-источник** — HTML5 + YouTube + Vimeo
6. **Нет vendor lock-in** — JSON конфиг, хости где хочешь

---

## 4. Дорожная карта

```
Фаза 1 → YouTube / Vimeo / HLS адаптеры
Фаза 2 → Улучшенные карточки товаров
Фаза 3 → Визуальный редактор (standalone)
Фаза 4 → Аналитика, ветвление, квизы
```

---

## 5. Фаза 1: YouTube / Vimeo / HLS

### Цель

Поддержка YouTube, Vimeo и HLS (.m3u8) видео рядом с HTML5 `<video>`, без поломки существующего функционала. HLS — основной адаптивный формат Filerobot.

### Архитектура

```
VideoPlayerAdapter (интерфейс)
├── HTML5Adapter       ← текущая логика
├── HLSAdapter         ← HTML5 + hls.js для .m3u8
├── YouTubeAdapter     ← YouTube IFrame API
└── VimeoAdapter       ← Vimeo Player SDK

PlayerFactory.create(url) → автоматически выбирает адаптер по URL/расширению
```

### Интерфейс адаптера

```typescript
interface VideoPlayerAdapter {
  mount(container: HTMLElement): void;
  play(): Promise<void>;
  pause(): void;
  seek(time: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  setVolume(level: number): void;
  getVolume(): number;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  setPlaybackRate(rate: number): void;
  getPlaybackRate(): number;
  isPaused(): boolean;
  getBufferedEnd(): number;
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
  getElement(): HTMLElement;
  destroy(): void;
}
```

### Определение источника по URL

| Паттерн | Адаптер |
|---------|---------|
| URL содержит `.m3u8` | HLSAdapter |
| `youtube.com/watch`, `youtu.be`, `youtube.com/embed` | YouTubeAdapter |
| `vimeo.com/*`, `player.vimeo.com/*` | VimeoAdapter |
| Всё остальное | HTML5Adapter |

### HLS: детали

HLS — основной адаптивный формат Filerobot. Анализ portals-fe (`jolipage-next-js`) показал что они используют video.js + @videojs/http-streaming (~300KB). Для нашего zero-dependency плагина лучше **hls.js** (~70KB, MIT).

- `HLSAdapter` наследует `HTML5Adapter` — тот же `<video>` элемент
- Safari/iOS: нативный HLS, hls.js не загружается
- Chrome/Firefox/Edge: hls.js подключается, привязывается к `<video>`
- URL паттерны: `*.m3u8` (плейлисты)
- Опциональная peer-зависимость: `hls.js`
- Автовосстановление при ошибках media/network

```typescript
// Опциональный HLS конфиг
hls?: {
  enableWorker?: boolean;          // default: true
  startLevel?: number;             // -1 = auto
  capLevelToPlayerSize?: boolean;  // default: true
}
```

### YouTube: детали

- API загружается динамически (`iframe_api`)
- Наши контролы заменяют YouTube'овские (`controls: 0`)
- Прозрачный `<div>` поверх iframe для маркеров
- `setInterval` 250мс для timeupdate (у YT нет нативного)

### Vimeo: детали

- SDK `@vimeo/player` (опциональная peer-зависимость)
- Нативный `timeupdate` от Vimeo
- Контролы Vimeo отключаются, используем свои

### Новое в конфиге

```typescript
interface CIVideoHotspotConfig {
  src: string;  // теперь принимает YouTube/Vimeo/HLS URL
  playerType?: 'auto' | 'html5' | 'hls' | 'youtube' | 'vimeo';  // по умолчанию: 'auto'
  hls?: HLSConfig;  // настройки HLS (опционально)
}
```

### Ограничения

- HLS на Chrome/Firefox/Edge требует hls.js (опц. peer-зависимость)
- HLS live-стримы не поддерживаются (фокус на VOD)
- YouTube seek по ключевым кадрам (~0.5с дрифт)
- iOS/Android игнорируют программную громкость
- Autoplay требует `muted: true` (все браузеры)
- Некоторые Vimeo видео имеют DRM-ограничения

---

## 6. Фаза 2: Shoppable карточки

### Цель

Улучшить карточку товара: галерея, варианты, рейтинг, wishlist, таймер акции, add-to-cart.

### Новые поля PopoverData

```typescript
interface PopoverData {
  // Существующие (без изменений)
  title?: string;
  price?: string;
  originalPrice?: string;
  description?: string;
  image?: string;
  url?: string;
  ctaText?: string;
  badge?: string;

  // Новые
  images?: string[];              // галерея (свайп)
  rating?: number;                // звёзды 1-5 (поддержка 4.5)
  reviewCount?: number;           // количество отзывов
  variants?: ProductVariant[];    // размер, цвет и т.д.
  wishlist?: boolean;             // кнопка "в избранное"
  wishlisted?: boolean;           // начальное состояние
  countdown?: string | Date;      // таймер акции
  countdownLabel?: string;        // 'Акция заканчивается через'
  secondaryCta?: { text: string; url?: string };
  customFields?: Array<{ label: string; value: string }>;
  sku?: string;                   // артикул для корзины

  // Коллбэки
  onAddToCart?: (data: AddToCartEvent) => void;
  onWishlistToggle?: (wishlisted: boolean) => void;
  onVariantSelect?: (variant: ProductVariant) => void;
}

interface ProductVariant {
  id: string;
  type: string;        // 'size', 'color', 'material'
  label: string;       // 'M', 'Red', 'Cotton'
  color?: string;      // hex для type: 'color'
  price?: string;      // переопределение цены
  available?: boolean; // в наличии (по умолчанию: true)
  selected?: boolean;  // выбран по умолчанию
}
```

### Макет карточки

```
┌──────────────────────────────┐
│  [Галерея]  ← / →           │  ← свайп + точки
├──────────────────────────────┤
│  ❤              SALE         │  ← wishlist + бейдж
│  Название товара             │
│  ★★★★☆ (42 отзыва)          │
│  ~~$120~~  $89               │  ← цена со скидкой
│  Размер: [S] [M] [L] [XL]   │  ← варианты (кнопки)
│  Цвет:   ● ● ●              │  ← свотчи цветов
│  Описание товара...          │
│  ⏱ Акция: 2д 14ч 32м        │  ← таймер
│  Материал: Хлопок            │  ← доп. поля
│  [В корзину]  [Подробнее →]  │  ← CTA
└──────────────────────────────┘
```

### Поведение компонентов

**Галерея:**
- Свайп на мобильных, стрелки на десктопе
- Точки-индикаторы, ленивая загрузка
- Если `images` нет — показывается одна `image`

**Варианты:**
- `type: 'color'` — круглые свотчи с цветом
- Остальные типы — кнопки-таблетки
- Недоступные — зачёркнуты/неактивны
- Выбор меняет цену и картинку (если заданы)

**Таймер:**
- Формат: "Xд Xч Xм Xс", обновление каждую секунду
- По истечении: "Завершено", CTA отключён
- Интервал очищается при закрытии поповера

---

## 7. Фаза 3: Визуальный редактор

### Цель

Отдельное веб-приложение для создания хотспотов без кода. На выходе — JSON конфиг для плагина.

### Стек

React 18 + TypeScript + Vite + CSS Modules. Состояние: React Context + useReducer. Undo/Redo: паттерн команд.

### Структура

```
packages/
├── core/       # Существующий плагин
└── editor/     # Новый: приложение-редактор
    ├── src/
    │   ├── components/
    │   │   ├── Toolbar/          # Меню, экспорт, настройки
    │   │   ├── VideoCanvas/      # Видео + оверлей + drag-and-drop
    │   │   ├── HotspotList/      # Левая панель: список хотспотов
    │   │   ├── PropertiesPanel/  # Правая панель: свойства
    │   │   ├── Timeline/         # Нижняя панель: таймлайн
    │   │   └── Preview/          # Режим просмотра
    │   ├── state/                # Контекст, редюсер, история
    │   ├── hooks/                # useVideoPlayer, useDragMarker и др.
    │   └── utils/                # Экспорт/импорт JSON, валидация
    └── package.json
```

### Макет редактора

```
┌──────────────────────────────────────────────────────────────┐
│  [Файл ▾] [Правка ▾] [Шаблоны ▾]   [Превью] [Экспорт JSON] │
├────────────┬──────────────────────────────┬───────────────────┤
│ ХОТСПОТЫ   │       ВИДЕО КАНВАС           │ СВОЙСТВА          │
│            │                              │                   │
│ + Добавить │  ┌────────────────────────┐  │ Позиция           │
│            │  │                        │  │  X: [65] %        │
│ ● Сумка    │  │   Видеоплеер           │  │  Y: [40] %        │
│   12с-25с  │  │         [●] ← хотспот  │  │ Время             │
│            │  │                        │  │  Начало: [0:12]   │
│ ● Туфли    │  └────────────────────────┘  │  Конец:  [0:25]   │
│   30с-45с  │                              │ Контент           │
│            │  URL: [https://...]          │  Название: [...]  │
│            │                              │  Цена: [...]      │
│            │                              │ Стиль             │
│            │                              │  Маркер: [dot ▾]  │
├────────────┴──────────────────────────────┴───────────────────┤
│  ◀ ▶ 0:15 / 1:30           ТАЙМЛАЙН                         │
│  ├────────────────────────────────────────────────────────────┤
│  │ ████████             (Сумка)                              │
│  │                 █████████ (Туфли)                         │
│  ├────────────────────────────────────────────────────────────┤
│  0:00    0:15    0:30    0:45    1:00    1:15    1:30         │
└──────────────────────────────────────────────────────────────┘
```

### Основные фичи

1. **Drag-and-drop** — клик на видео создаёт хотспот, перетаскивание двигает
2. **Таймлайн** — drag краёв для startTime/endTime, перетаскивание целого блока
3. **Панель свойств** — все настройки выбранного хотспота
4. **Live-превью** — переключение edit/preview, превью использует реальный плагин
5. **JSON экспорт/импорт** — генерация конфига, загрузка существующего
6. **Undo/Redo** — стек истории (Ctrl+Z / Ctrl+Shift+Z)
7. **Кейфрейм-редактор** — добавление точек motion на таймлайне
8. **Шаблоны** — пресеты: "Товарная витрина", "Туториал", "Тур"
9. **YouTube/Vimeo** — вставить ссылку и работать

### Горячие клавиши редактора

| Клавиша | Действие |
|---------|----------|
| `Ctrl+Z` | Отмена |
| `Ctrl+Shift+Z` | Повтор |
| `Delete` | Удалить выбранный хотспот |
| `Ctrl+D` | Дублировать хотспот |
| `Ctrl+S` | Сохранить в LocalStorage |
| `Ctrl+E` | Экспорт JSON |
| `Space` | Play/pause видео |
| `←` / `→` | Перемотка ±1с |
| `Ctrl+Click` | Создать хотспот в месте клика |
| `Escape` | Снять выделение / выйти из превью |
| `P` | Режим превью |

### Формат экспорта

Стандартный JSON `CIVideoHotspotConfig` — подключается к плагину напрямую:

```json
{
  "src": "https://youtube.com/watch?v=...",
  "theme": "light",
  "hotspots": [
    {
      "id": "hotspot-1",
      "x": "65%",
      "y": "40%",
      "startTime": 12,
      "endTime": 25,
      "label": "Сумка",
      "data": {
        "title": "Дизайнерская сумка",
        "price": "$899",
        "image": "https://example.com/bag.jpg"
      }
    }
  ],
  "chapters": [
    { "id": "intro", "title": "Вступление", "startTime": 0 }
  ]
}
```

---

## 8. Фаза 4: Будущее

### Аналитика

```typescript
onAnalytics?: (event: {
  type: 'hotspot_click' | 'popover_open' | 'cta_click' | 'add_to_cart';
  hotspotId: string;
  videoTime: number;
}) => void;
```

### Ветвление

```typescript
action?:
  | { type: 'seek'; time: number }       // перейти на момент
  | { type: 'video'; src: string }       // переключить видео
  | { type: 'url'; href: string }        // открыть ссылку
```

### Квизы

```typescript
quiz?: {
  question: string;
  type: 'multiple-choice' | 'text' | 'rating';
  options?: string[];
  correctAnswer?: string | number;
  onAnswer?: (answer, isCorrect) => void;
}
```

### Условная логика

```typescript
condition?: {
  requiredClicks?: string[];       // показать если кликнули на эти хотспоты
  custom?: (state) => boolean;     // произвольное условие
}
```

---

## 9. Архитектура

### Граф зависимостей (v2.0.0)

```
CIVideoHotspot (главный класс)
├── PlayerFactory
│   ├── HTML5Adapter
│   ├── HLSAdapter (extends HTML5 + hls.js)
│   ├── YouTubeAdapter
│   └── VimeoAdapter
├── TimelineEngine → MotionEngine
├── Controls
│   ├── ProgressBar (индикаторы, главы)
│   ├── Кнопки (play, volume, speed, fullscreen)
│   └── ChapterDropdown
├── Markers (Map<id, button>)
├── Popovers (Map<id, Popover>)
│   ├── Позиционирование (flip/shift)
│   ├── Шаблон (карточка товара + галерея + варианты + рейтинг)
│   └── Санитизация HTML
├── HotspotNav
├── FullscreenControl
├── KeyboardHandler
├── FocusTrap
└── ARIA
```

### Поток событий

```
Клик по маркеру →
  → onHotspotClick callback
  → popover.show()
  → пауза видео (если pauseOnInteract)
  → фокус-трап активирован

Видео timeupdate (~4 раза/сек) →
  → timeline.update(time) → { entered, exited, active }
  → showHotspot() для новых
  → hideHotspot() для исчезнувших
  → updatePosition() для активных с кейфреймами
```

---

## 10. API

### Создание

```typescript
const player = new CIVideoHotspot('#el', { src: '...', hotspots: [...] });
// или
CIVideoHotspot.autoInit(); // из data-атрибутов
```

### Методы экземпляра

**Воспроизведение:**
`play()`, `pause()`, `togglePlay()`, `seek(time)`, `getCurrentTime()`, `getDuration()`, `setVolume(0-1)`, `getVolume()`, `setMuted(bool)`, `isMuted()`, `setPlaybackRate(rate)`, `getPlaybackRate()`

**Хотспоты:**
`open(id)`, `close(id)`, `closeAll()`, `addHotspot(item)`, `removeHotspot(id)`, `updateHotspot(id, updates)`, `getVisibleHotspots()`, `getHotspots()`

**Навигация:**
`nextHotspot()`, `prevHotspot()`, `goToHotspot(id)`, `goToChapter(id)`, `getCurrentChapter()`

**Полноэкранный режим:**
`enterFullscreen()`, `exitFullscreen()`, `isFullscreen()`

**Жизненный цикл:**
`update(config)`, `destroy()`, `getElements()`

### React

```tsx
// Компонент
<CIVideoHotspotViewer src="..." hotspots={[...]} />

// Хук
const { containerRef, instance } = useCIVideoHotspot({ src: '...', hotspots: [...] });
```

---

## 11. Доступность

### Клавиатура

| Клавиша | Действие |
|---------|----------|
| `Space` / `K` | Play / Pause |
| `←` / `→` | Перемотка ±5с |
| `↑` / `↓` | Громкость ±10% |
| `M` | Mute |
| `N` / `P` | Следующий / предыдущий хотспот |
| `F` | Полноэкранный режим |
| `Escape` | Закрыть поповеры |
| `Tab` | Навигация по элементам |

### ARIA

- Маркеры: `<button aria-label="..." aria-haspopup="dialog">`
- Поповеры: `role="dialog"` (клик) или `role="tooltip"` (ховер)
- Фокус-трап в поповерах
- Объявления: "Хотспот появился: [label]", "Глава: [title]"
- `prefers-reduced-motion` — все анимации отключаются

### Поддержка браузеров

Chrome 80+, Firefox 80+, Safari 14+, Edge 80+, iOS Safari 14+, Android Chrome 80+

---

## 12. Сборка

### Команды

| Команда | Описание |
|---------|----------|
| `npm run dev` | Дев-сервер с демо |
| `npm run build` | Полная сборка (ESM + CJS + UMD + React + типы) |
| `npm run test` | Запуск тестов |
| `npm run lint` | Проверка кода |

### Размер бандла

| Пакет | Цель (gzip) |
|-------|-------------|
| Core (v1.0.0) | < 20 КБ |
| Core + YouTube/Vimeo (v2.0.0) | < 25 КБ |
| Core + Shoppable (v2.0.0) | < 28 КБ |
| React обёртка | < 2 КБ |
| Редактор (отдельно) | < 200 КБ |

### Выходные форматы

| Формат | Файл | Для чего |
|--------|------|----------|
| ESM | `.esm.js` | Современные бандлеры |
| CJS | `.cjs.js` | Node.js |
| UMD | `.min.js` | CDN / `<script>` |
| Types | `.d.ts` | TypeScript |
