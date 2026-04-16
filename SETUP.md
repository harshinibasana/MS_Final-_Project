# Travelify — Quick Setup Guide

## Admin URL
👉 http://localhost:3000/admin  (requires admin role)

## Step 1: Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your real MongoDB URI and JWT secret
npm install
npm run dev
```

### Required .env values:
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/travelify
JWT_SECRET=any_random_string_at_least_32_chars
PORT=5001
CLIENT_URL=http://localhost:3000
```

## Step 2: Frontend Setup

```bash
cd frontend
npm install
npm start
```

## Step 3: Create Your Account

1. Go to http://localhost:3000/register
2. Register — the FIRST account automatically gets admin role
3. Log in at http://localhost:3000/login

## Step 4: Admin Access

- **URL**: http://localhost:3000/admin
- Visible in sidebar as ✦ Crown "Admin Panel" 
- Only shown to admin users

### Make existing account admin:
In MongoDB Atlas shell:
```js
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```
Then log out and back in.

## Troubleshooting Login

**"No account found"** → Register first at /register  
**"Incorrect password"** → Check caps lock, try re-registering  
**Backend not responding** → Make sure `npm run dev` is running in /backend  
**MongoDB error** → Check MONGODB_URI in backend/.env is correct  

Check backend terminal — it logs exactly why login fails.
