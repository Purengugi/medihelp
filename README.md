# MediHelp - AI Nutritional Health Assistant

## Quick Start

### 1. Backend (Flask)

```bash
cd backend
pip install -r requirements.txt
python setup_db.py      # Creates medihelp.db (run once only)
python app.py           # Starts on http://localhost:5000
```

### 2. Frontend (React)

```bash
cd frontend
npm install
npm start               # Opens http://localhost:3000
```

### Default Admin Login

```
Email:    admin@medihelp.ke
Password: admin123
```

---

## Environment Variables (.env)

Create a file called `.env` inside the `backend/` folder:

```
JWT_SECRET=your-secret-string-here
DB_PATH=medihelp.db
```

### What is JWT_SECRET and how do I get it?

JWT stands for **JSON Web Token** - it's how users stay logged in without sending their password on every request. When a user logs in, the server creates a signed token using your secret string. The secret is like a password that only YOUR server knows, used to sign and verify tokens.

**You must set your own secret - never use the default in production.**

#### How to generate a strong JWT_SECRET (pick one method):

**Option A - Python (easiest, you already have Python):**

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Example output: `a3f9d2c1e8b47f06a2d5c9e1b3f8a4d7c2e6b9f0a1d4c7e2b5f8a3d6c9e2b5f8`

**Option B - Terminal (Linux/Mac):**

```bash
openssl rand -hex 32
```

**Option C - Online generator:**
Go to https://generate-secret.vercel.app/32 - copy the result.

**Option D - Just type anything long (for development/demo only):**

```
JWT_SECRET=medihelp-kca-university-project-2026-purity-njeri-very-long-secret
```

#### Full .env example:

```
JWT_SECRET=a3f9d2c1e8b47f06a2d5c9e1b3f8a4d7c2e6b9f0a1d4c7e2b5f8a3d6c9e2b5f8
DB_PATH=medihelp.db
```

> **Note:** If you don't create a `.env` file, the app still works using a built-in default secret. This is fine for demos and development. For a real deployment, always set your own secret.

---

## Tech Stack

| Layer     | Technology               | Why                              |
| --------- | ------------------------ | -------------------------------- |
| Backend   | Flask 2.3.3 (Python)     | Lightweight, easy to run locally |
| Database  | SQLite                   | No setup needed, single file     |
| Auth      | JWT (Flask-JWT-Extended) | Stateless, secure tokens         |
| Frontend  | React 18                 | Component-based UI               |
| Maps      | OpenStreetMap + Leaflet  | Free, no API key needed          |
| Icons     | Font Awesome 6           | Free, professional icons         |
| AI Engine | JavaScript + Python      | Runs in browser AND server       |

---

## Why Two UIs? (Admin vs User)

This is a common question. The system has **two separate interfaces** by design:

- **User Dashboard** (`/dashboard`) - for regular registered users. They can chat with the AI, view their analysis history, search hospitals, and update their profile. They **cannot** see other users' data.

- **Admin Panel** (`/admin`) - only visible to users with `role = ADMIN`. Admins can view all registered users, edit user details, add/remove hospitals, and see all system analyses. This is like a backend management console.

The same backend API serves both - the difference is the **JWT token**. When you log in as admin, your token contains `role: ADMIN`, which unlocks the admin routes. Regular users get `role: USER` and those routes return 403 Forbidden.

---

## How the AI Works

The AI engine runs entirely in JavaScript in the browser (no internet needed after load):

1. User types symptoms in plain English
2. `analyzer.js` normalizes the text using 150+ synonym mappings
   - "tired" → "fatigue", "hair is falling out" → "hair loss"
3. Normalized text is matched against symptom lists for 10 deficiencies
4. Confidence score = `(matched / total_symptoms) × 3.5 × 100`, capped at 95%
5. Top 3 matches returned with food recommendations, tips, Kenya statistics

The Python backend (`ai_engine.py`) uses identical logic to save results to the database.

---

## Project Structure

```
medihelp/
├── backend/
│   ├── app.py           # All API routes
│   ├── ai_engine.py     # Python symptom analyzer
│   ├── setup_db.py      # Database initializer
│   └── requirements.txt
├── frontend/
│   ├── public/index.html
│   └── src/
│       ├── App.js           # Router + AuthContext
│       ├── api.js           # Axios with JWT
│       ├── engine/
│       │   └── analyzer.js  # JS AI engine (browser)
│       ├── components/
│       │   └── Navbar.js
│       └── pages/
│           ├── Home.js
│           ├── Login.js
│           ├── Register.js
│           ├── Dashboard.js  # Chat, History, Hospitals, Profile
│           └── Admin.js      # User mgmt, Hospital mgmt, Stats
└── README.md
```

---

## Medical Disclaimer

MediHelp is an academic prototype built for KCA University. It provides AI-generated nutritional guidance only and **does not replace professional medical advice, diagnosis, or treatment**. Always confirm deficiencies with blood tests and consult a licensed healthcare professional.

**Emergency:** Call 999 or visit your nearest hospital immediately.
