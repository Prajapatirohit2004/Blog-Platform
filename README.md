# Blog Platform with Comments

A developer-friendly blog application that demonstrates a complete React + Express workflow with authentication, publishing, and commenting.

This project is designed to run locally and includes a working frontend, API server, and JSON-backed persistence for posts, comments, users, and sessions.

## What this project includes

- A React + Vite frontend with a clean dashboard-style UI
- An Express backend with REST endpoints for posts, comments, and authentication
- User registration and login using JWT-like session tokens stored in `localStorage`
- Built-in demo content, including sample posts and comments
- Persistent storage in `data/db.json` for local development
- Permission guards so only post authors and admins can edit or delete content

## Key features

- Browse blog posts with summaries and details
- Create, update, and delete articles when signed in
- Add comments to any published post
- Register a new account or log in with an existing one
- Comment deletion by comment author, post author, or admin
- Local JSON database backed by `server-db.ts`

## Tech stack

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
2. Duplicate the example environment file:
   ```bash
   cp .env.example .env
   ```
   On Windows PowerShell:
   ```powershell
   copy .env.example .env
   ```
3. Adjust values in `.env` if needed.
4. Start the development server:
   ```bash
   npm run dev
   ```

The app runs in development mode with Vite and the Express backend serving API routes on the same port.

## Available scripts

- `npm run dev` - run the development server
- `npm run build` - build the frontend and bundle the server
- `npm run start` - start the production build
- `npm run preview` - preview the production build locally
- `npm run clean` - remove build artifacts
- `npm run lint` - run TypeScript checks

## Environment variables

Create a local `.env` file from `.env.example` and fill in the values.

- `GEMINI_API_KEY` - optional key for any external integrations
- `APP_URL` - app URL used for self-referential links and callbacks

> Keep `.env` out of version control.

## Project structure

- `index.html` - app shell and entry point
- `src/` - React application code
- `src/App.tsx` - main frontend view and state management
- `src/api.ts` - API helper functions for frontend requests
- `src/types.ts` - shared TypeScript models
- `server.ts` - Express API server and route definitions
- `server-db.ts` - local JSON persistence, hashing, and session handling
- `vite.config.ts` - Vite build configuration
- `data/db.json` - persisted blog data created at runtime

## API Routes

The backend serves the following routes:

- `POST /api/auth/register` - create a new user account
- `POST /api/auth/login` - sign in and receive a session token
- `POST /api/auth/logout` - log out and invalidate the current session
- `GET /api/auth/me` - return the authenticated user's profile
- `GET /api/posts` - list all blog posts
- `GET /api/posts/:id` - fetch a single post and its comments
- `POST /api/posts` - create a new blog post (authenticated)
- `PUT /api/posts/:id` - update an existing post (authenticated, author only)
- `DELETE /api/posts/:id` - delete a post (authenticated, author only)
- `POST /api/posts/:postId/comments` - add a comment to a post (authenticated)
- `DELETE /api/comments/:commentId` - remove a comment (authenticated, author or post owner)
- `GET /api/health` - health check endpoint

### Example: register a new account

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"tester","email":"tester@example.com","password":"Password123"}'
```

### Example: create a new post

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"My First Post","content":"Post body content","summary":"Short preview text"}'
```

## Notes

- The current persistence layer is a local JSON database stored in `data/db.json`.
- The app is intended for demo and local development purposes.
- In production, replace the JSON backend with a proper database such as PostgreSQL or MongoDB.
- The project already includes sample content, so you can run it immediately after install.

## Future improvements

- Add user profile pages and avatars
- Add post categories or tags
- Improve comment moderation and admin controls
- Add unit, integration, and end-to-end tests
- Add deployment instructions for cloud hosting

## License

This repository is provided as an example project for learning and experimentation.
