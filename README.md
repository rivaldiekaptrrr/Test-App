# 🎓 ExamProctor - Online Exam System with Anti-Cheating

A powerful online examination platform with advanced anti-cheating proctoring features.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Go](https://img.shields.io/badge/Go-1.24-00ADD8)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)

## ✨ Features

### 🔐 Anti-Cheating & Proctoring
- **Camera Monitoring** - Real-time webcam capture with automatic snapshots
- **Tab Detection** - Instant detection of tab/window switching
- **Copy-Paste Block** - Prevents clipboard operations during exams
- **AI Face Detection** - Detects multiple faces and phone usage (optional)
- **Violation Logging** - Complete audit trail with timestamps
- **Auto-Block** - Automatic exam termination after threshold violations

### 📝 Exam Management
- Dynamic question types (Multiple Choice, Essay, Code, File Upload)
- Countdown timer with visual warnings
- Real-time answer auto-save
- Question shuffling
- Comprehensive analytics

### 🔒 Security
- JWT authentication with Supabase/PostgreSQL
- Role Based Access Control (RBAC)
- Path sanitization to prevent traversal attacks
- Multi-tenancy support

---

## 📁 Project Structure

```
exam-proctoring-system/
│
├── frontend/                 # Next.js 15 Application
│   ├── app/                 # App Router pages
│   │   ├── page.tsx        # Landing page
│   │   ├── login/          # Authentication
│   │   ├── signup/
│   │   ├── dashboard/      # Admin dashboard
│   │   ├── exams/          # Exam listing
│   │   ├── demo-exam/      # Demo with proctoring
│   │   ├── results/        # Student results
│   │   ├── settings/       # User settings
│   │   └── admin/
│   │       ├── proctoring/ # Proctoring viewer
│   │       └── analytics/  # Analytics dashboard
│   ├── components/
│   │   └── exam/           # Anti-cheating components
│   │       ├── ProctorCamera.tsx
│   │       ├── TabTracker.tsx
│   │       ├── ExamTimer.tsx
│   │       └── ProctoringWrapper.tsx
│   ├── lib/                # Utilities
│   └── package.json
│
├── golang-backend/          # Go API Server
│   ├── cmd/server/         # Entry point
│   ├── internal/
│   │   ├── config/         # Configuration
│   │   ├── handler/        # API handlers
│   │   ├── middleware/     # Auth middleware
│   │   ├── model/          # Data models
│   │   └── service/        # Business logic
│   ├── pkg/utils/          # Utilities
│   └── go.mod
│
├── database/                # SQL Migrations
│   ├── schema.sql          # Database schema
│   ├── rls_policies.sql    # Security policies
│   ├── seed.sql            # Sample data
│   ├── create_demo_users.sql
│   └── quickstart_all_in_one.sql
│
├── start.bat               # Windows start script
├── start.ps1               # PowerShell start script
└── README.md
```

---

## 📄 Documentation

- [Database Schema](./docs/DATABASE_SCHEMA.md) - Detailed table structures and relations.
- [API Reference](./docs/API_REFERENCE.md) - Endpoint definitions and request/response formats.
- [Setup Guide](./docs/SETUP_GUIDE.md) - Detailed installation steps.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Go** 1.22+ ([Download](https://go.dev/dl/))

### 1. Setup Database (Supabase.com)
1. Create a project on [Supabase.com](https://Supabase.com/)
2. Copy your `DATABASE_URL` connection string.
3. Open a SQL console and run the scripts in `/database` in order:
   - `part_1_schema.sql`
   - `part_2_logic_data.sql`
   - `part_3_results_security.sql`

### 2. Configure Environment

**Frontend** (`frontend/.env.local`):
```env
DATABASE_URL=postgresql://user:pass@host/dbname
JWT_SECRET=your-secure-jwt-secret-min-32-chars
NEXT_PUBLIC_DEMO_MODE=true
```

**Backend** (`golang-backend/.env`):
```env
DATABASE_URL=postgresql://user:pass@host/dbname
JWT_SECRET=your-secure-jwt-secret-min-32-chars
STORAGE_BASE_PATH=./uploads
PORT=8080
```


### 4. Install Dependencies
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../golang-backend
go mod tidy
```

### 5. Run Application

**Option A: Using start script (Windows)**
```bash
# Double-click start.bat
# Or run:
.\start.ps1
```

**Option B: Manual**
```bash
# Terminal 1 - Backend
cd golang-backend
go run cmd/server/main.go

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 6. Open Browser
```
http://localhost:3000           # Landing page
http://localhost:3000/demo-exam # Demo with proctoring
http://localhost:3000/dashboard # Admin dashboard
```

---

## 📸 Screenshots

### Landing Page
Modern landing page showcasing anti-cheating features.

### Demo Exam with Proctoring
- Camera preview in corner
- Tab switch counter
- Timer countdown
- Copy-paste blocked

### Admin Dashboard
- Stats overview
- Recent activity
- Quick actions

### Proctoring Viewer
- Session list
- Violation timeline
- Snapshot gallery

---

## 🔧 Configuration

### Demo Mode vs Production Mode

| Mode | Description |
|------|-------------|
| **Demo** | No database required, mock data, perfect for testing |
| **Production** | Full Supabase integration, real data persistence |

Set in `.env.local`:
```env
NEXT_PUBLIC_DEMO_MODE=true   # Demo mode
NEXT_PUBLIC_DEMO_MODE=false  # Production mode
```

### Proctoring Settings

Configure in Settings page or via exam creation:
- Camera snapshot interval (default: 30s)
- Max tab switches allowed (default: 2)
- Face detection (optional)
- Auto-block on violation threshold

---

## 📖 API Endpoints

### Proctoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/proctoring/snapshot` | Upload camera snapshot |
| POST | `/api/v1/proctoring/violation` | Log violation |
| GET | `/api/v1/files/proctoring/:path` | Get snapshot file |

### Configuration
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/config/storage` | Set storage path |
| GET | `/api/v1/config/storage` | Get storage config |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |

---

## 🗄️ Database Schema

### Tables
- `organizations` - Multi-tenancy
- `profiles` - User profiles with roles
- `exams` - Exam configurations
- `question_sets` - JSONB questions
- `exam_sessions` - Student attempts
- `cheating_logs` - Violation records
- `exam_participants` - Access control

### User Roles
- `admin` - Full access
- `teacher` - Manage own exams
- `student` - Take exams

---

## 🧪 Testing

### Test Anti-Cheating Features
1. Open `/demo-exam`
2. Allow camera permission
3. Try switching tabs → Violation counter increases
4. Try Ctrl+C → Copy blocked
5. Wait for timer warning at < 5 minutes

### API Testing
```bash
# Health check
curl http://localhost:8080/api/v1/health
```

---

## 🚢 Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel deploy
```

### Backend (Docker)
```dockerfile
FROM golang:1.22-alpine
WORKDIR /app
COPY . .
RUN go build -o server cmd/server/main.go
CMD ["./server"]
```

### Database
Already hosted on Supabase!

---

## 📝 Documentation

See these files for detailed documentation:
- `SETUP_GUIDE.md` - Step-by-step setup
- `DATABASE_SETUP.md` - Database configuration
- `QUICK_START.md` - Start scripts guide
- `DEMO_VS_PRODUCTION.md` - Mode comparison

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Go](https://go.dev/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Built with ❤️ for secure online education**
