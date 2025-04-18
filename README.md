# Genshin TCG Draft (Драфтилка)

## Быстрый старт

### 1. Установите pnpm (https://pnpm.io/ru/installation)

### 2. Запустите сборку и старт:

```sh
pnpm install
pnpm run dev
```

- По умолчанию backend стартует на http://localhost:3001
- Frontend на http://localhost:5173

### 3. Docker (опционально)

```sh
docker-compose up --build
```

---

- База данных должна лежать в папке `/backend/database.sqlite`
- Изображения — в `/backend/images`

---

## Структура
- `backend/` — Node.js/Express API + WebSocket
- `frontend/` — React + i18next + styled-components

---

## TODO
- [ ] API для карт
- [ ] Конструктор драфтов
- [ ] WebSocket-синхронизация
- [ ] История драфта
- [ ] Двуязычный интерфейс
- [ ] Темная/светлая тема
