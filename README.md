# 🌍 Travelify — Full-Stack Travel Planning App

## Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev        # starts on http://localhost:5001
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env — REACT_APP_API_URL should already be http://localhost:5001/api
npm start          # starts on http://localhost:3000
```

## Environment Variables

### Backend (`backend/.env`)
| Variable | Value |
|----------|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Any long random string |
| `PORT` | `5001` |
| `CLIENT_URL` | `http://localhost:3000` |

### Frontend (`frontend/.env`)
| Variable | Value |
|----------|-------|
| `REACT_APP_API_URL` | `http://localhost:5001/api` |
| `REACT_APP_GOOGLE_MAPS_KEY` | Google Maps API key (optional) |

## Google Maps (Optional)
For live search, nearby places & map tab:
1. Go to https://console.cloud.google.com
2. Enable: **Maps JavaScript API**, **Places API**, **Directions API**
3. Add key to `frontend/.env`

## Features
- 🗺️ **Explore** — 12 curated destinations + live Google Maps search
- 📋 **Trip Plans** — Add/edit/delete tasks per trip with status tracking
- 💰 **Budget** — Expense tracking with charts
- 📅 **Calendar** — Month view with per-trip color coding & daily expenses
- 👥 **Community** — Browse other users' travel plans
- 🏨 Hotels, 🚗 Rentals, 📸 Photos, 🧳 Packing, 📍 Places tabs
- 🔐 JWT auth with bcrypt password hashing

## Notes on Passwords
- Passwords are bcrypt-hashed automatically on registration
- If you have plain-text passwords in MongoDB, they will auto-upgrade on next login
