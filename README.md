# Blog Platform with Comments

A full-stack blog platform built with React, Vite, Express, TypeScript, and Tailwind CSS.

This repository includes a web frontend for browsing blog posts and comments, plus a backend API for authentication and content support.

## Features

- Browse blog posts and view comments
- Add comments to posts
- User registration and login
- REST API endpoints served by Express
- TypeScript-typed frontend and backend
- Vite-powered React development environment

## Tech Stack

- React
- Vite
- TypeScript
- Express
- Tailwind CSS
- Node.js

## Prerequisites

- Node.js 18 or newer
- npm 10 or newer

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Update `.env` with your values.
4. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - start the development server
- `npm run build` - build the frontend and bundle the server
- `npm run start` - run the built production server
- `npm run preview` - preview the production build
- `npm run clean` - remove build artifacts
- `npm run lint` - run TypeScript type checking

## Environment Variables

Create a `.env` file in the project root with values similar to `.env.example`.

- `GEMINI_API_KEY` - optional API key for external integrations
- `APP_URL` - application base URL

> Do not commit `.env` to source control.

## Project Structure

- `index.html` - application shell
- `src/` - React frontend source files
- `server.ts` - Express backend server
- `server-db.ts` - in-memory database and authentication helpers
- `vite.config.ts` - Vite configuration
- `package.json` - scripts and dependencies
- `tsconfig.json` - TypeScript configuration

## API Endpoints

The backend exposes these main routes:

- `POST /api/auth/register` - register a new user
- `POST /api/auth/login` - login and receive a session token
- `GET /api/auth/me` - get the current authenticated user

### Example: Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"example","email":"user@example.com","password":"secret123"}'
```

### Example: Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'
```

## Notes

- The repository is designed for local development and demo use.
- Replace the in-memory data store with a persistent database for production.
- Keep sensitive keys out of version control.

## Future Improvements

- Add post creation and editing
- Add comment moderation and deletion
- Add real database persistence (PostgreSQL, MongoDB, SQLite)
- Add user roles and permissions
- Add unit and integration tests

## License

This repository is provided as an example project. Use it freely for learning and development.
