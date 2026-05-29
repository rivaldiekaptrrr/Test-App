# 🚀 Supabase Graphics Database Setup Guide

This guide describes how to set up the database using Supabase (PostgreSQL).

---

## ⚡ Quick Setup (Recommended)

Run the SQL scripts located in the `database/` folder in the following order:

### 1. **Part 1: Schema Setup**
File: `database/part_1_schema.sql`
- Creates all tables (users, exams, questions, etc.)
- Defines ENUM types
- Sets up primary indexes

### 2. **Part 2: Logic & Seed Data**
File: `database/part_2_logic_data.sql`
- Creates database functions and triggers
- Inserts initial seed data (Organization and Demo Users)

### 3. **Part 3: Results & Security**
File: `database/part_3_results_security.sql`
- Completes the schema for results and proctoring
- Adds performance indexes

---

## 🔑 Default Credentials
Once you run `part_2_logic_data.sql`, these users will be available:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@demo.com` | `Admin123!` |
| **Teacher** | `teacher@demo.com` | `Teacher123!` |
| **Student** | `student@demo.com` | `Student123!` |

---

## 🧪 Verification
After running the scripts, you can verify the setup by running this query in your Supabase SQL console:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables:
- `cheating_logs`
- `exam_sessions`
- `exams`
- `organizations`
- `questions`
- `question_options`
- `student_answers`
- `users`

---

## 🔧 Maintenance

### Restarting from Scratch
To clear the database and start over, you can run Part 1 again (it contains `DROP TABLE IF EXISTS CASCADE` statements at the top).

### Moving to Production
In a production environment:
1. Change the default passwords in the `users` table.
2. Ensure `JWT_SECRET` in your `.env.local` matches the secret used for token generation.

