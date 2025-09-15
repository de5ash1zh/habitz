# Habits App Backend

Express + Mongoose backend for the Habits Tracker.

## Quick Start

1. Install dependencies

```
npm install
```

2. Create `.env` in `backend/`

```
MONGODB_URI=mongodb://localhost:27017/habits
PORT=3000
# Must match your frontend dev host
FRONTEND_URL=http://localhost:5174
JWT_SECRET=replace-with-strong-secret
NODE_ENV=development
```

3. Run in dev (nodemon)

```
npm run dev
```

4. Health check

```
GET http://localhost:3000/api/health
-> { "status": "ok", "timestamp": "..." }
```

## Project Structure

```
backend/
  src/
    config/
      db.js                # Mongoose connection
    middleware/
      auth.js              # JWT authRequired middleware
      csrf.js              # Double-submit cookie CSRF middleware
    models/
      User.js
      Habit.js
      CheckIn.js
      Follow.js
      index.js
    routes/
      auth.js              # /api/auth/*
      habits.js            # /api/habits/* + streak endpoints
      checkins.js          # /api/checkins/*
      social.js            # /api/* (follow/friends/feed)
      users.js             # /api/users/*
    utils/
      validators.js
      streakCalculator.js  # daily/weekly streak + completion
    server.js              # App bootstrap and CORS
package.json
```

## Data Models (Mongoose)

- User

  - username: String, unique
  - email: String, unique
  - password: String (bcrypt hash)
  - createdAt: Date

- Habit

  - userId: ObjectId (User)
  - name: String (unique per user)
  - category: String (optional)
  - frequency: String enum ['daily','weekly','custom']
  - createdAt: Date

- CheckIn

  - userId: ObjectId (User)
  - habitId: ObjectId (Habit)
  - date: Date (normalized at UTC day)
  - completed: Boolean
  - unique compound index (userId, habitId, date)

- Follow
  - followerId: ObjectId (User)
  - followingId: ObjectId (User)
  - unique compound index (followerId, followingId)

## Middleware

- CORS
  - Allowed origin: `FRONTEND_URL`
  - Credentials enabled
- JSON body parsing
- CSRF protection (`src/middleware/csrf.js`)
  - Double-submit cookie strategy
  - Sets `csrfToken` cookie if absent (non-httpOnly)
  - Requires `X-CSRF-Token` header on non-GET/HEAD/OPTIONS
- Auth (`src/middleware/auth.js`)
  - Reads JWT from `token` httpOnly cookie
  - Populates `req.user = { id: ... }`

## Authentication Routes (`/api/auth`)

- POST `/register`
  - body: { username, email, password, rememberMe? }
  - Creates user, returns `{ user }`, sets httpOnly `token` cookie
  - `rememberMe: true` extends cookie to 30 days
- POST `/login`
  - body: { email, password, rememberMe? }
  - Verifies creds, returns `{ user }`, sets httpOnly `token` cookie
- GET `/me` (authRequired)
  - returns current user `{ user }`
- POST `/logout`
  - clears `token` cookie
- GET `/availability`
  - query: `username`, `email`
  - returns `{ available: boolean }`
- POST `/refresh` (authRequired)
  - issues fresh `token` cookie, `{ ok: true }`

## Habits API (`/api/habits`)

All routes require auth.

- GET `/` → `{ habits: Habit[] }`
- POST `/` → create habit
- GET `/:id` → single habit
- PUT `/:id` → update habit
- DELETE `/:id` → delete habit

### Streak Endpoints

- GET `/:id/streaks` →

```
{
  daily:   { currentStreak, longestStreak },
  weekly:  { currentStreak, longestStreak },
  completion: { days: 7, done, completionRate }
}
```

- POST `/:id/validate-streaks` → `{ ok: true, server: { currentStreak, longestStreak } }`

Streak logic lives in `src/utils/streakCalculator.js` and:

- Normalizes dates to UTC day/week (Sunday as start)
- Handles duplicates, gaps, and future dates

## Check-ins API (`/api/checkins`)

- POST `/` → toggle/create check-in for a day/week
  - body: { habitId, date(YYYY-MM-DD or ISO), completed }
  - server normalizes to UTC day/week based on habit frequency
- GET `/:habitId` → list check-ins in a range
  - query: `from`, `to` (YYYY-MM-DD)

## Social API (`/api`) and Users (`/api/users`)

- POST `/follow` → { followingId }
- DELETE `/unfollow/:userId`
- GET `/friends` → followed users
- GET `/feed` → recent activity of friends
- GET `/users/search` → `?q=term&limit=20`

## Security

- Cookies: httpOnly `token`, SameSite Lax in dev (None+Secure in prod)
- CSRF: double-submit cookie + `X-CSRF-Token`
- CORS: restricted to `FRONTEND_URL`
- Passwords: bcrypt salted hashes
- Validation: route and schema level; ObjectId checks; duplicate avoidance with unique indexes
- Inactivity: frontend auto-logout after 30 minutes (see FE README)

## Environment & Ops

- MongoDB 4.4+ recommended
- Node 18+
- Logs: use server console; integrate with your platform logging for prod
- Health: `GET /api/health`

## Development Notes

- Update `FRONTEND_URL` if your Vite dev server uses a different port.
- JWT expiry set to 7 days; `/auth/refresh` can extend session.
- Run tests & linters as you add them; current repo ships API only.

- src/server.js — Express app, CORS, env, DB connection
- src/config/db.js — MongoDB connection helper
- src/models/ — Mongoose models (User, Habit, CheckIn, Follow)

## Models Overview

- Users: { \_id, username, email, password, createdAt }
- Habits: { \_id, userId, name, category, frequency, createdAt }
- CheckIns: { \_id, userId, habitId, date, completed }
- Follows: { \_id, followerId, followingId }

## Troubleshooting

- Ensure MongoDB is running locally or update MONGODB_URI for Atlas.
- If CORS errors occur, verify FRONTEND_URL matches your frontend.

# Habits App Frontend

Vite + React frontend for the Habits Tracker.

## Quick Start

1. Install dependencies

```
npm install
```

2. Environment

```
# .env in frontend/
VITE_API_BASE=http://localhost:3000/api
```

3. Run dev

```
npm run dev
```

The app will start on a Vite port (5173/5174). Ensure the backend `FRONTEND_URL` matches this origin.

## Architecture

- `src/main.jsx` — App bootstrap
- `src/App.jsx` — Routes
- `src/context/AuthContext.jsx` — Cookie-only auth state, inactivity auto-logout, token refresh
- `src/api/axios.js` — Axios instance, `withCredentials`, CSRF header, 401 handling
- `src/api/*` — API helpers (`habits`, `checkins`, `users`, `social`, `auth`)
- `src/components/*` — UI components (NavBar, Layout, Modals, Toasts, Streaks, etc.)
- `src/pages/*` — Route pages (Login, Register, Dashboard, Feed, Profile, Habit forms)
- `src/index.css` — Design tokens, utilities, global styles

## Routing

- Public
  - `/login`, `/register`
- Protected
  - `/dashboard` (default)
  - `/habits/new`, `/habits/:id/edit`
  - `/feed`, `/profile`
- Not Found: `*`
- Guards
  - `ProtectedRoute` redirects unauthenticated users to login
  - `PublicRoute` prevents logged-in users from visiting `/login` or `/register`

## Authentication

- Cookie-only JWT stored in httpOnly cookie `token`
- CSRF protection via `csrfToken` cookie + `X-CSRF-Token` header (added in Axios for non-GET)
- AuthContext
  - `login(email, password, rememberMe)`
  - `register(username, email, password, rememberMe)`
  - `logout()`
  - Loads `/auth/me` on app mount
  - Inactivity auto-logout (30 minutes)
  - Token refresh on window focus and every 6h (`/auth/refresh`)

## API Layer

- `src/api/axios.js` — baseURL from `VITE_API_BASE`, `withCredentials: true`, CSRF header injection, global error toasts
- Habit API
  - `listHabits`, `createHabit`, `updateHabit`, `deleteHabit`
  - `getHabitStreaks(habitId)`, `validateHabitStreaks(habitId, payload)`
- CheckIns API
  - `createOrUpdateCheckIn({ habitId, date, completed })`
  - `getCheckIns(habitId, { from, to })`
- Social API
  - `followUser`, `unfollowUser`, `getFriends`, `getFeed`
- Users API
  - `searchUsers(q, limit)`
- Auth API
  - `checkAvailability({ username?, email? })`

## UI/UX Design System (Monochrome Premium)

- Tokens (in `src/index.css`)
  - Pure black/white + grays: `--charcoal`, `--steel`, `--graphite`, `--fog`, `--smoke`, `--ghost`
  - Buttons: `.btn`, `.btn-primary` (black), `.btn-ghost`, `.btn-icon`
  - Cards: `.card` (base), `.card-premium` (habit cards)
  - Inputs: 2px border, 16x20 padding, black focus ring
  - Typography utilities: `.h1`, `.h2`, `.h3`, `.caption` + `.container`/`.section` spacers
- Shell
  - NavBar: sticky 72px, semi-transparent white with blur, subtle border/shadow
  - Sidebar: solid white card, icon links
- Dashboard
  - Responsive stats grid (auto-fit), premium habit cards, clean meta rows
  - Overflow actions with 3-dot menu; Mark Done micro-interaction
  - Streaks: `StreakRing` (solid black) + `StreakDisplay` (daily/weekly/7d)
- Auth Pages
  - Centered `.auth-wrap` + `.auth-box` (non-rounded, equal size) for `Login` and `Register`

## Components

- `NavBar.jsx` — sticky header, navigation, logout
- `ProtectedLayout.jsx` — sidebar + content grid
- `Modal.jsx` — base modal with overlay
- `ToastProvider.jsx` — toasts + global error events (`toast:error`, `toast:success`)
- `Skeleton.jsx`, `Spinner.jsx` — loading states
- `StreakRing.jsx`, `StreakDisplay.jsx`, `CompletionProgress.jsx` — streak & progress UI
- `ConnectionStatus.jsx` — live backend health ping
- `HabitForm.jsx` — create/edit form

## Pages

- `Login.jsx` — remember me, validation
- `Register.jsx` — confirm password, password rules, availability check, T&C checkbox, remember me
- `Dashboard.jsx` — list, sorting, stats, streaks, actions, create modal
- `Feed.jsx` — recent friend activity, empty states
- `Profile.jsx` — user search, follow/unfollow, friends list
- `HabitNew.jsx` / `HabitEdit.jsx` — full forms
- `NotFound.jsx` — 404 page

## Security

- Cookies only for auth; no localStorage tokens
- CSRF protection enabled end-to-end
- CORS restricted to `FRONTEND_URL`
- Inactivity auto-logout on the client
- Sanitized rendering (React); avoid inserting raw HTML from users

## Development Notes

- Ensure backend `.env` `FRONTEND_URL` matches the Vite dev origin
- Use `VITE_API_BASE` to point the frontend to the backend API
- Adjust typography or tokens in `src/index.css` as you refine the monochrome system
