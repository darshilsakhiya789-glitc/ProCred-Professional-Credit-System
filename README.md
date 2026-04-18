# ProCred™ — Verified Skills. Trusted Credits.

A full-stack MERN app for verifying student achievements and connecting them with recruiters.

---

## 📁 Folder Structure

```
ProCred/
├── backend/                    ← Express + MongoDB API
│   ├── .env                    ← ⚠️  Edit this — add your MongoDB URI
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── server.js
│       ├── config/db.js
│       ├── controllers/        ← auth, achievements, skills, recruiter, contact
│       ├── middleware/         ← auth guard, error handler, file upload
│       ├── models/             ← User, Achievement, Skill, Contact
│       ├── routes/
│       └── utils/
└── frontend/                   ← React 18 + Vite + Tailwind CSS v3
    ├── package.json
    ├── vite.config.ts          ← proxies /api → localhost:5000
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── index.css           ← Tailwind directives + CSS variables
        ├── components/
        │   ├── login-page.tsx
        │   ├── home-page.tsx
        │   ├── student-dashboard.tsx
        │   ├── recruiter-dashboard.tsx
        │   ├── navigation.tsx
        │   ├── about-page.tsx
        │   ├── contact-page.tsx
        │   ├── features-page.tsx
        │   ├── figma/
        │   └── ui/             ← shadcn/ui components (all fixed)
        ├── context/
        │   └── AuthContext.tsx
        └── lib/
            └── api.ts          ← axios + all API helpers
```

---

## 🚀 Setup & Running

### Step 1 — Configure MongoDB

Open **`backend/.env`** and paste your connection string:

```env
# Local MongoDB:
MONGO_URI=mongodb://localhost:27017/procred

# MongoDB Atlas (cloud):
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/procred?retryWrites=true&w=majority
```

> Get a free Atlas cluster at https://cloud.mongodb.com

---

### Step 2 — Run the Backend

```bash
cd backend
npm install
npm run dev          # starts on http://localhost:5000

# Optional: load demo data
npm run seed
```

---

### Step 3 — Run the Frontend

```bash
cd frontend
npm install
npm run dev          # starts on http://localhost:5173
```

Open **http://localhost:5173** in your browser.
Vite automatically proxies `/api/*` requests to the backend — no extra config needed.

---

## 🔐 Demo Accounts (after `npm run seed`)

| Role      | Email                         | Password |
|-----------|-------------------------------|----------|
| Student   | alex.johnson@stanford.edu     | demo123  |
| Recruiter | sarah.recruiter@techcorp.com  | demo123  |

---

## 🐛 All Bugs Fixed

| # | Bug | Fix |
|---|-----|-----|
| 1 | Login inputs lose focus on every keystroke | Moved `LoginForm` out of `LoginPage` — was remounting on each render |
| 2 | Tailwind v4 compiled CSS conflicting with v3 setup | Replaced 3 K-line compiled CSS with proper `@tailwind` directives |
| 3 | CSS variables in wrong format (hex vs HSL) | Converted all to HSL space-separated format |
| 4 | `tailwindcss-animate` not installed | Added to `devDependencies` |
| 5 | Button text visible during loading | Replaced with spinner + "Please wait…" block |
| 6 | `@custom-variant dark` Tailwind v4 syntax error | Removed — dark mode works via config |
| 7 | All shadcn/ui imports had version numbers (`@radix-ui/react-separator@1.1.2`) | Stripped versions from all 32+ imports across all UI files |
| 8 | Corrupted `{backend` directory in zip | Removed |
| 9 | No `.env` file — backend crashed immediately | Created `.env` with clear instructions |
| 10 | Page redirection broken after login/logout | Fixed auth guards in `App.tsx` |
| 11 | No MongoDB setup guidance | Added `.env` instructions, better `db.js` error messages |
| 12 | Old duplicate folders in zip | Clean zip with only `backend/` and `frontend/` at root |
