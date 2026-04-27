# 🚀 Full Setup Guide - Online Exam System

This guide provides step-by-step instructions to set up the Online Exam System from scratch.

---

## 📋 Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **Go** v1.22+ ([Download](https://go.dev/dl/)) (Required for the camera proctoring backend)
- **PostgreSQL** (e.g., [Neon.tech](https://neon.tech/))

---

## 🗄️ Step 1: Database Setup (Neon)

1. Create a project at [Neon.tech](https://neon.tech/).
2. Copy your Connection String (`DATABASE_URL`).
3. Run the SQL scripts in `database/` in this order:
   - `part_1_schema.sql`
   - `part_2_logic_data.sql`
   - `part_3_results_security.sql`

---

## ⚙️ Step 2: Environment Variables

### 2.1 Frontend (`frontend/.env.local`)
Create a file named `.env.local` in the `frontend/` folder:
```env
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
JWT_SECRET=your-32-character-secret-key
NEXT_PUBLIC_DEMO_MODE=true
```

### 2.2 Backend (`golang-backend/.env`)
Create a file named `.env` in the `golang-backend/` folder:
```env
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
JWT_SECRET=your-32-character-secret-key
STORAGE_BASE_PATH=./uploads
PORT=8080
```

---

## 📦 Step 3: Install Dependencies

### 3.1 Frontend
```bash
cd frontend
npm install
```

### 3.2 Backend
```bash
cd golang-backend
go mod tidy
```

---

## 🎬 Step 4: Run the Application

### Option A: Using Start Scripts (Windows Only)
Run `start.bat` or `.\start.ps1` from the root directory. This will start both the frontend and backend automatically.

### Option B: Manual Start
**Terminal 1 (Backend):**
```bash
cd golang-backend
go run cmd/server/main.go
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

---

## 🧪 Step 5: Verify the Setup

1. Open `http://localhost:3000` in your browser.
2. Login with demo credentials:
   - **Admin**: `admin@demo.com` / `Admin123!`
   - **Teacher**: `teacher@demo.com` / `Teacher123!`
   - **Student**: `student@demo.com` / `Student123!`
3. Test a join-by-code exam using the student portal.

---

## 🛠️ Troubleshooting

- **Database Connection Error**: Ensure `?sslmode=require` is added to your `DATABASE_URL` if using Neon.
- **JWT Errors**: Ensure `JWT_SECRET` is identical in both frontend and backend.
- **Port Conflict**: If port 8080 or 3000 is used, kill the process or change the port in `.env` files.
