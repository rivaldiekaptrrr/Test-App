# ⚡ Quick Start Cheatsheet

If you already have the environment configured, use these commands to start the system.

---

## 🚀 The Fastest Way (Windows)

Double-click **`start.bat`** in the root folder.
This will:
1. Start the Golang Backend (Port 8080).
2. Start the Next.js Frontend (Port 3000).
3. Open `http://localhost:3000` in your browser.

---

## 💻 Manual Commands

### 1. **Backend**
```bash
cd golang-backend
go run cmd/server/main.go
```

### 2. **Frontend**
```bash
cd frontend
npm run dev
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@demo.com` | `Admin123!` |
| **Teacher** | `teacher@demo.com` | `Teacher123!` |
| **Student** | `student@demo.com` | `Student123!` |

---

## 📁 Key Links

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend Health**: [http://localhost:8080/health](http://localhost:8080/health)
- **Documentation Area**: `./docs/`
- **Database Scripts**: `./database/`
