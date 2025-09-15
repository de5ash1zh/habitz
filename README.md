# Habit Tracker App Monorepo

This repository contains a monorepo with a React + Vite frontend and a Node.js + Express backend.

## Structure

```
/
├── frontend/   # React + Vite app
├── backend/    # Node.js + Express API
└── README.md
```

## Getting Started

1) Frontend (React + Vite)
- Initialize: `npm create vite@latest frontend -- --template react`
- Install deps:
  - `npm install react-router-dom axios tailwindcss @tailwindcss/forms lucide-react`
  - `npm install -D tailwindcss postcss autoprefixer`
- Dev server: `npm run dev` (from `frontend/`)

2) Backend (Node.js + Express)
- Initialize: `npm init -y` (from `backend/`)
- Install deps: `npm install express mongoose bcryptjs jsonwebtoken cors dotenv`
- Dev deps: `npm install -D nodemon`
- Start script suggestion (in `backend/package.json`):
  ```json
  {
    "scripts": {
      "dev": "nodemon src/server.js"
    }
  }
  ```

## GitHub
- Create repo: `habit-tracker-app`
- Recommended initial commit flow:
  ```bash
  git init
  git add .
  git commit -m "chore: initialize monorepo structure"
  ```

## Notes
- Use Node 18+.
- Keep environment variables in `backend/.env` (never commit it).
- Tailwind config setup is optional initially and can be added later.
