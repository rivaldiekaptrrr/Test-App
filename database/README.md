# 🗄️ Supabase Database Setup Guide

## ⚠️ PENTING - Cara Run di Supabase

Supabase SQL Editor kadang **tidak bisa menjalankan semua script sekaligus**. Jika error, ikuti cara ini:

---

## 🚀 Quick Start (Recommended)

### Step 1: Run di Supabase SQL Editor
1. Buka [Supabase Dashboard](https://console.Supabase.com)
2. Pilih project Anda
3. Klik **SQL Editor**
4. Copy-paste **SELURUH ISI** file `complete_setup.sql`
5. Klik **Run** ▶️

### Jika Error:
- Error `extension already exists` → **ABAIKAN**, lanjutkan
- Error lain → Coba jalankan per-section (lihat di bawah)

---

## 📋 Run Per-Section (Jika Full Script Error)

Jika script penuh error, jalankan per-bagian:

### Section 1: Drop Tables
```sql
DROP TABLE IF EXISTS student_answers CASCADE;
DROP TABLE IF EXISTS question_options CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS cheating_logs CASCADE;
DROP TABLE IF EXISTS exam_sessions CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS auth_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
```

### Section 2: Drop Types
```sql
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS exam_status CASCADE;
DROP TYPE IF EXISTS session_status CASCADE;
DROP TYPE IF EXISTS question_type CASCADE;
DROP TYPE IF EXISTS violation_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
```

### Section 3: Create Types
```sql
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'hr', 'student', 'applicant');
CREATE TYPE exam_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE session_status AS ENUM ('not_started', 'in_progress', 'completed', 'blocked', 'graded');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'essay', 'code', 'file_upload');
CREATE TYPE violation_type AS ENUM ('tab_switch', 'multiple_faces', 'no_face', 'phone_detected', 'copy_paste', 'right_click');
CREATE TYPE notification_type AS ENUM ('exam_assigned', 'exam_reminder', 'exam_graded', 'violation_warning');
```

### Sisanya...
Lanjutkan copy-paste bagian tables, indexes, functions, triggers, dan seed data dari `complete_setup.sql`.

---

## ✅ Verification

Setelah setup selesai, jalankan query ini untuk verifikasi:

```sql
SELECT 
    'organizations' as table_name, COUNT(*) as rows FROM organizations
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'exams', COUNT(*) FROM exams
UNION ALL SELECT 'questions', COUNT(*) FROM questions
ORDER BY table_name;
```

**Expected Output:**
```
table_name     | rows
---------------|------
exams          | 3
organizations  | 1
questions      | 8
users          | 3
```

---

## 👥 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@demo.com` | `Demo123!` |
| Teacher | `teacher@demo.com` | `Demo123!` |
| Student | `student@demo.com` | `Demo123!` |

---

## 🔗 Cara Dapat DATABASE_URL dari Supabase (Step-by-Step)

### Step 1: Buka Supabase Dashboard
1. Buka browser → https://console.Supabase.com
2. Login dengan akun Supabase Anda

### Step 2: Pilih Project
1. Di dashboard, klik project database Anda
2. Atau jika belum ada project, klik **New Project** dulu

### Step 3: Buka Connection Details
1. Di sidebar kiri, klik **Dashboard** (halaman utama project)
2. Di bagian **Connection Details** (biasanya di kanan atas)
3. Anda akan melihat kotak dengan connection string

### Step 4: Copy Connection String
1. Pastikan dropdown menunjukkan:
   - **Role:** `Supabasedb_owner` (atau user Anda)
   - **Database:** `Supabasedb` (atau nama database Anda)
2. Klik ikon **Copy** di sebelah connection string
3. String yang di-copy akan terlihat seperti ini:

```
postgresql://Supabasedb_owner:password123@ep-green-rain-abc123-pooler.us-east-2.aws.Supabase.com/Supabasedb?sslmode=require
```

### Step 5: Pilih Format yang Benar
Di Supabase, ada beberapa tab/pilihan format:
- **Pooled connection** ← **GUNAKAN INI!** (ada kata `-pooler` di URL)
- **Direct connection** 
- **psql**

**Pilih "Pooled connection"** karena lebih efisien untuk aplikasi web.

### Contoh URL yang Benar:
```
postgresql://Supabasedb_owner:npg_ZsNKISMb13Dr@ep-green-rain-ae46y52i-pooler.us-east-2.aws.Supabase.com/Supabasedb?sslmode=require
```

**Catatan:**
- `Supabasedb_owner` = username
- `npg_ZsNKISMb13Dr` = password (jangan share!)
- `ep-green-rain-ae46y52i-pooler` = endpoint + `-pooler`
- `us-east-2.aws.Supabase.com` = region
- `Supabasedb` = database name
- `sslmode=require` = SSL wajib

---

## 🔧 Frontend Configuration

### Step 1: Buat file `.env.local`
```bash
cd frontend
copy env.example.txt .env.local
```

### Step 2: Edit `.env.local`
Buka file dan isi seperti ini:

```env
# ===========================================
# Supabase DATABASE CONFIGURATION
# ===========================================

# Paste connection string dari Supabase Dashboard di sini:
DATABASE_URL=postgresql://Supabasedb_owner:npg_ZsNKISMb13Dr@ep-green-rain-ae46y52i-pooler.us-east-2.aws.Supabase.com/Supabasedb?sslmode=require

# JWT Secret (buat random string minimal 32 karakter)
# Generate di: https://generate-secret.vercel.app/32
JWT_SECRET=ganti-dengan-secret-key-minimal-32-karakter-random
a124d09bb559bb612637db2349fe2f3b

# ===========================================
# APP CONFIGURATION
# ===========================================

NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_NAME=ExamProctor
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Set ke false untuk pakai database Supabase
NEXT_PUBLIC_DEMO_MODE=false
```

### Step 3: Save dan Run
```bash
npm run dev
```

---

## 🐛 Troubleshooting

### Error: "syntax error at or near EXTENSION"
**Solution:** Abaikan - Extensions sudah terinstall di Supabase

### Error: "type already exists"
**Solution:** Types sudah ada. Run DROP TYPE dulu:
```sql
DROP TYPE IF EXISTS user_role CASCADE;
-- dst...
```

### Error: "relation already exists"
**Solution:** Tables sudah ada. Run DROP TABLE dulu.

### Error: "Connection refused" di frontend
**Solution:** 
1. Pastikan DATABASE_URL sudah benar di `.env.local`
2. Pastikan pakai URL **Pooled connection** (ada `-pooler`)
3. Restart server: `npm run dev`

### Error: "Invalid credentials"
**Solution:** 
1. Copy ulang connection string dari Supabase Dashboard
2. Pastikan password tidak ada karakter special yang ter-encode

---

## 📊 Database Tables (10 tables)

Setelah setup, database akan memiliki:

| Table | Description |
|-------|-------------|
| `organizations` | Multi-tenancy support |
| `users` | User accounts + password hash |
| `auth_sessions` | JWT session tokens |
| `exams` | Exam configurations |
| `questions` | Exam questions |
| `question_options` | Multiple choice options |
| `exam_sessions` | Student exam attempts |
| `student_answers` | Individual answers |
| `cheating_logs` | Anti-cheating violations |
| `notifications` | User notifications |

---

**Happy coding! 🚀**
