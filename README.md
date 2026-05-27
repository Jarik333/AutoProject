# AutoService CRM (минимальная версия)

SaaS-скелет CRM для автосервиса: мультитенантность, регистрация/вход, CRUD клиентов с автомобилями, календарь записей, заказ-наряды (работы и запчасти).

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

### 2.1 Backend unit-тесты

Тесты находятся в проекте `src/backend/AutoService.Api.Tests` и запускаются по solution:

```bash
cd src\backend
dotnet test AutoService.slnx
```

Тестовый фреймворк: `xUnit` (assertions через `FluentAssertions`, моки через `Moq`).

Покрыты базовые сценарии:

- `AuthService` (`RegisterTenantAsync`, `LoginAsync`) — позитивные и негативные ветки
- `JwtTokenService` — issuer/audience, claims и срок жизни токена
- `ClientVehicleValidation` — проверка клиента и принадлежности авто
- `AuthController` — ветки `Ok` / `Conflict` / `Unauthorized`

Для unit-тестов используется изолированный `EF Core InMemory` контекст на каждый тест.

### 3. Frontend (Node.js LTS)

Установите Node.js с https://nodejs.org (в PATH должны быть `node` и `npm`). После установки **откройте новый терминал**.

```bash
cd src\frontend\auto-service-admin
npm install
npm start
```

Админка: http://localhost:4200

Прокси `/api` → `http://localhost:5080` (Docker) или измените `proxy.conf.json`.

## Тестовые данные (Development)

При первом запуске API в среде **Development** база заполняется демо-набором (если tenant `demo-garage` ещё не существует):

| Поле | Значение |
|------|----------|
| Вход | `owner@demo.local` / `demo123` |
| Slug | `demo-garage` |

Включены 4 клиента с автомобилями, 4 заказ-наряда (с позициями), 6 записей в календаре. Повторный запуск не дублирует данные.

## Сценарий проверки

1. Войдите с демо-учёткой или откройте http://localhost:4200/register
2. Создайте автосервис (slug латиницей, например `my-garage`)
3. На странице **Клиенты** добавьте клиента с одним или несколькими автомобилями
4. На странице **Календарь** нажмите **+ Запись** (или выделите слот): клиент, авто, дата и время начала/окончания
5. **Сохранить** — панель остаётся открытой; **Сохранить и создать заказ-наряд** или **Сформировать заказ-наряд** — черновик ЗН с датой/временем из записи (на событии появится номер ЗН)
6. Перетащите запись на другое время — время обновится в API
7. На странице **Заказ-наряды** добавьте строки (работа / запчасть, количество, цена); дата открытия с точностью до минут
8. В Swagger: `POST /api/auth/login` → скопируйте token → Authorize → `GET /api/clients`, `GET /api/appointments?from=...&to=...`

## API (основное)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/register`, `/api/auth/login` | Регистрация и вход |
| GET/POST/PUT/DELETE | `/api/clients` | Клиенты и автомобили |
| GET/POST/PUT/DELETE | `/api/workorders` | Заказ-наряды и позиции |
| GET | `/api/appointments?from=&to=` | Записи в диапазоне дат (ISO UTC) |
| GET/POST/PUT/DELETE | `/api/appointments` | Записи (календарь) |
| POST | `/api/appointments/{id}/work-order` | Создать черновик заказ-наряда из записи |

Статусы записи: `Scheduled`, `Confirmed`, `Completed`, `Cancelled`.

Статусы заказа: `Draft`, `InProgress`, `Done`, `Cancelled`. Тип строки: `Labor`, `Part`.

## Структура

```
src/backend/     — .NET API (Domain, Infrastructure, Api)
src/frontend/    — Angular admin
docker-compose.yml
```

## Дальше по плану

- Telegram-бот для клиентов
- Подписки и лимиты
