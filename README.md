# AutoService CRM (минимальная версия)

SaaS-скелет CRM для автосервиса: мультитенантность, регистрация/вход, CRUD клиентов с автомобилями, заказ-наряды (работы и запчасти).

**Стек:** .NET 10, PostgreSQL, Redis (в Docker), Angular 19.

## Быстрый старт

### 1. Инфраструктура (Docker)

```bash
cd d:\Projects\AutoProject
docker compose up -d postgres redis
```

API можно запускать локально или в Docker:

```bash
docker compose up -d --build api
```

После изменений в коде API пересоберите образ: `docker compose up -d --build api`.

API: http://localhost:5080/swagger

### 2. Backend (локально)

```bash
cd src\backend
dotnet run --project AutoService.Api
```

По умолчанию: http://localhost:5000 (или порт из `launchSettings.json`). Для фронта настройте `proxy.conf.json` под ваш порт.

Строка подключения в `AutoService.Api/appsettings.json`:

```
Host=localhost;Port=5432;Database=autoservice;Username=autoservice;Password=autoservice
```

Миграции применяются автоматически при старте API.

### 3. Frontend (Node.js LTS)

Установите Node.js с https://nodejs.org (в PATH должны быть `node` и `npm`). После установки **откройте новый терминал**.

```bash
cd src\frontend\auto-service-admin
npm install
npm start
```

Админка: http://localhost:4200

Прокси `/api` → `http://localhost:5080` (Docker) или измените `proxy.conf.json`.

## Сценарий проверки

1. Откройте http://localhost:4200/register
2. Создайте автосервис (slug латиницей, например `my-garage`)
3. На странице **Клиенты** добавьте клиента с одним или несколькими автомобилями
4. На странице **Заказ-наряды** создайте заказ: выберите клиента и авто, статус, строки (работа / запчасть, количество, цена)
5. В Swagger: `POST /api/auth/login` → скопируйте token → Authorize → `GET /api/clients`, `GET /api/workorders`

## API (основное)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/register`, `/api/auth/login` | Регистрация и вход |
| GET/POST/PUT/DELETE | `/api/clients` | Клиенты и автомобили |
| GET/POST/PUT/DELETE | `/api/workorders` | Заказ-наряды и позиции |

Статусы заказа: `Draft`, `InProgress`, `Done`, `Cancelled`. Тип строки: `Labor`, `Part`.

## Структура

```
src/backend/     — .NET API (Domain, Infrastructure, Api)
src/frontend/    — Angular admin
docker-compose.yml
```

## Дальше по плану

- Записи (календарь)
- Telegram-бот для клиентов
- Подписки и лимиты
