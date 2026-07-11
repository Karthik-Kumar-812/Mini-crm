# 🧾 Mini CRM — Client Lead Management System

Built for the **Future Interns — Full Stack Web Development (Task 2, 2026)** internship task.

A small but complete CRM: a public website contact form captures leads, and a secure admin dashboard lets you track, follow up on, and convert them — the exact workflow agencies, freelancers, and startups use every day.

Built with the tech stack recommended on the task page:

- **Frontend:** Plain HTML5, CSS3, and vanilla JavaScript (no framework, no build step)
- **Backend:** Node.js + Express.js (REST API)
- **Database:** MongoDB (via Mongoose)
- **Auth:** JWT (JSON Web Tokens) + bcrypt password hashing
- 
GitHub repo: `(https://github.com/Karthik-Kumar-812/Mini-crm)`

---

## 📁 Project Structure

```
mini-crm/
├── frontend/                      # Plain HTML / CSS / JS
│   ├── index.html                 # Demo public site with a real lead-capture form
│   ├── login.html                 # Admin login page
│   ├── dashboard.html             # Admin CRM dashboard (protected)
│   ├── css/
│   │   ├── style.css              # Shared design tokens, buttons, forms
│   │   └── dashboard.css          # Sidebar, table, badges, modal, stat cards
│   ├── js/
│   │   ├── config.js              # API base URL + theme + auth/token helpers
│   │   ├── public-lead-form.js    # Lead capture form logic (index.html)
│   │   ├── auth.js                # Login logic (login.html)
│   │   └── dashboard.js           # Dashboard logic: leads, filters, notes, analytics
│   └── assets/favicon.svg
│
├── backend/                       # Node.js + Express REST API
│   ├── server.js                  # App entry point
│   ├── config/db.js               # MongoDB connection
│   ├── models/
│   │   ├── Lead.js                # Lead schema (+ embedded follow-up notes)
│   │   └── AdminUser.js           # Admin account schema
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT verification
│   │   └── rateLimiter.js         # Abuse protection (public form + login)
│   ├── controllers/
│   │   ├── authController.js      # login / me / change-password
│   │   └── leadController.js      # CRUD + status + notes + analytics
│   ├── routes/
│   │   ├── publicRoutes.js        # POST /api/public/leads (no auth)
│   │   ├── authRoutes.js          # /api/auth/*
│   │   └── leadRoutes.js          # /api/leads/* (JWT protected)
│   ├── utils/
│   │   ├── generateToken.js
│   │   └── seedAdmin.js           # Auto-creates a default admin on first run
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

## ✨ Features Implemented

- ✅ **Public lead capture form** (`index.html`) simulating a real business website's contact form — feeds directly into the CRM
- ✅ **Lead listing** with name, email, phone, source, status, and received date
- ✅ **Lead status workflow**: New → Contacted → Converted (+ Lost), updatable inline from the dashboard table or the detail modal
- ✅ **Follow-up notes** per lead — add unlimited timestamped notes, each attributed to the admin who wrote it
- ✅ **Secure admin login** — JWT-based auth, bcrypt-hashed passwords, protected API routes; the dashboard is inaccessible without a valid session
- ✅ **Search & filter** — search by name/email/message/source, filter by status, both server-side
- ✅ **Pagination** on the leads table
- ✅ **Simple analytics dashboard** — total leads, counts per status, conversion rate, and a 7-day lead volume trend chart
- ✅ **Timestamp tracking** — `createdAt` / `updatedAt` on every lead, timestamped notes
- ✅ **Rate limiting** on the public form (anti-spam) and the login endpoint (anti-brute-force)
- ✅ **Dark / light mode**, fully responsive layout (mobile sidebar collapses to a toggle)
- ✅ **Change password** endpoint so you're not stuck with the seeded default forever
- ✅ Clean JSON API with consistent `{ success, message, data }` responses and centralized error handling

---

## 🔐 How authentication works

1. On first startup, the backend checks if any admin account exists. If not, it creates one from the `DEFAULT_ADMIN_USERNAME` / `DEFAULT_ADMIN_PASSWORD` values in `.env` (bcrypt-hashed before storage) and prints the credentials to the console once.
2. `login.html` posts to `POST /api/auth/login`. On success, the backend returns a signed JWT.
3. The frontend stores the token in `localStorage` and attaches it as `Authorization: Bearer <token>` on every dashboard API call (`js/config.js` → `apiFetch()`).
4. Every route under `/api/leads/*` runs through `requireAuth` middleware — no token, no data. If a token is missing/expired, the API returns `401` and the frontend automatically redirects back to `login.html`.
5. The public lead form (`POST /api/public/leads`) intentionally requires **no** auth — that's the whole point, anyone visiting the business website can submit it — but it is rate-limited.

---

## 🧩 Step 1 — Set up MongoDB

Use either:
- **MongoDB Atlas** (free tier, recommended, no local install): create a cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register), create a database user, allow network access from anywhere (`0.0.0.0/0`) for development, and copy the connection string.
- **Local MongoDB**: install MongoDB Community Server and use `mongodb://localhost:27017/mini_crm_db`.

You don't need to create collections manually — Mongoose creates them automatically the first time data is written.

---

## 💻 Step 2 — Configure and run the backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=a_long_random_string
JWT_EXPIRES_IN=1d

DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=Admin@12345
DEFAULT_ADMIN_FULLNAME=Admin User

CLIENT_ORIGIN=http://127.0.0.1:5500
```

Start the server:

```bash
npm run dev      # nodemon, auto-restarts on changes
# or
npm start
```

Watch the console on first run — it prints your seeded default admin username/password. **Log in and change the password (or the `.env` values) before deploying.**

The API runs at `http://localhost:5000`. Test it's alive: `http://localhost:5000/api/health`

---

## 💻 Step 3 — Run the frontend

Static files only — no build step. Serve the `frontend/` folder so `fetch()` works correctly:

**Option A — VS Code "Live Server" extension (easiest):**
Right-click `frontend/index.html` → "Open with Live Server" (usually serves at `http://127.0.0.1:5500`, matching the default `CLIENT_ORIGIN`).

**Option B — Python's built-in server:**
```bash
cd frontend
python3 -m http.server 5500
```

Then visit:
- `http://localhost:5500/index.html` — the public demo site + lead capture form
- `http://localhost:5500/login.html` — admin login
- `http://localhost:5500/dashboard.html` — the CRM dashboard (redirects to login if not authenticated)

If your frontend runs on a different port/URL, update:
1. `CLIENT_ORIGIN` in `backend/.env`
2. `API_BASE_URL` at the top of `frontend/js/config.js`

---

## 🧪 Try it end-to-end

1. Open `index.html`, submit the contact form as if you were a potential client.
2. Open `login.html`, sign in with the seeded admin credentials.
3. On the dashboard, find your new lead in the table (status: **New**).
4. Change its status to **Contacted**, click the eye icon to open it, and add a follow-up note.
5. Change it to **Converted** and watch the analytics cards + conversion rate update.

---

## ☁️ Step 4 — Deployment

**Frontend:** Netlify, Vercel, or GitHub Pages — all just need to serve the static `frontend/` folder.

**Backend:** Render or Railway — connect your repo, root directory `backend`, build command `npm install`, start command `npm start`. Add all your `.env` values as environment variables in the platform's dashboard (never commit real secrets).

**Database:** MongoDB Atlas free tier.

After deploying:
1. Update `CLIENT_ORIGIN` on the backend to your deployed frontend URL.
2. Update `API_BASE_URL` in `frontend/js/config.js` to your deployed backend URL.
3. Log in and change the default admin password immediately.
4. Update this README's "Live demo" link at the top.

---

## 🧪 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/public/leads` | none | Submit a new lead (rate-limited) |
| POST | `/api/auth/login` | none | Log in, returns a JWT |
| GET | `/api/auth/me` | JWT | Get the current admin's info |
| PATCH | `/api/auth/change-password` | JWT | Change the current admin's password |
| GET | `/api/leads?status=&search=&page=&limit=` | JWT | List/search/filter leads (paginated) |
| GET | `/api/leads/:id` | JWT | Get one lead with its full notes |
| PATCH | `/api/leads/:id/status` | JWT | Update a lead's status |
| POST | `/api/leads/:id/notes` | JWT | Add a follow-up note |
| DELETE | `/api/leads/:id` | JWT | Delete a lead |
| GET | `/api/leads/analytics` | JWT | Totals, per-status counts, conversion rate, 7-day trend |
| GET | `/api/health` | none | API + DB connectivity check |

All responses follow `{ "success": boolean, "message": string, "data"?: any }`.

---

## 🛠️ Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3 (custom design system), vanilla JavaScript (ES6+) |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` password hashing |
| Abuse protection | `express-rate-limit` on the public form and login |
| Deployment | Netlify/Vercel/GitHub Pages (frontend) + Render/Railway (backend) + MongoDB Atlas |

---

## 📝 Notes for the Future Interns submission

- Push this entire project to a **public GitHub repository**.
- Do **not** commit `backend/.env` — only `backend/.env.example` (already covered by `.gitignore`).
- Change the seeded default admin password before considering this "done" — it's meant as a convenience for local development, not production credentials.
- Deploy the live site, then submit the GitHub repo link + live link as your deliverable.

## 💡 Suggestions for taking this further

- Add a "Lost reason" field when marking a lead as Lost, for better reporting.
- Export leads to CSV for use in spreadsheets or other tools.
- Email the admin automatically when a new lead arrives (reuse the Nodemailer pattern from Task 1).
- Add multiple admin roles (e.g. read-only vs. full access) if more than one person manages leads.
