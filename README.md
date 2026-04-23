# Expense Tracker Backend

REST API for authentication and expense tracking, built with `Express`, `TypeScript`, and `Prisma`.

## Stack

- `Node.js`
- `TypeScript`
- `Express`
- `Prisma`
- `PostgreSQL` via `DATABASE_URL`
- `JWT` access and refresh tokens

## Features

- User registration and login
- Access token and refresh token flow
- Auth-protected expense CRUD
- Current month category summary
- Prisma-based database access

## Project Structure

- `src/app.ts`: Express app setup and route registration
- `src/server.ts`: server bootstrap and Prisma connection
- `src/modules/auth`: auth routes, validation, service, controller
- `src/modules/expense`: expense routes, validation, service, controller
- `prisma/schema.prisma`: database schema

## Requirements

- Node.js `18+`
- npm
- A running database connection for `DATABASE_URL`

## Environment Variables

The backend expects these variables:

- `PORT`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES`
- `JWT_REFRESH_EXPIRES`

Example:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/expense_tracker
JWT_ACCESS_SECRET=replace-with-a-strong-secret
JWT_REFRESH_SECRET=replace-with-another-strong-secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
```

## Local Setup

1. Move into the backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create your `.env` file with the variables above.

4. Generate Prisma client:

```bash
npm run prisma:generate
```

5. Run database migrations:

```bash
npm run prisma:migrate
```

6. Start the development server:

```bash
npm run dev
```

The API runs on `http://localhost:3000` by default.

## Scripts

- `npm run dev`: run the API in watch mode with `tsx`
- `npm run build`: compile TypeScript into `dist/`
- `npm run start`: run the built server
- `npm run prisma:generate`: generate Prisma client
- `npm run prisma:migrate`: create/apply local Prisma migrations
- `npm run prisma:deploy`: apply migrations in deploy environments

## Health Check

```http
GET /health
```

Returns:

```json
{ "status": "ok" }
```

## API Routes

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

### Expenses

- `POST /api/v1/expenses`
- `GET /api/v1/expenses`
- `PATCH /api/v1/expenses/:id`
- `DELETE /api/v1/expenses/:id`
- `GET /api/v1/expenses/summary/current-month`

All expense routes require authentication.

## Mobile App Integration

The Flutter app expects the backend base URL to be:

- Android emulator: `http://10.0.2.2:3000/api/v1`
- iOS simulator / desktop: `http://127.0.0.1:3000/api/v1`

If you change the API port, update the mobile app base URL too.
