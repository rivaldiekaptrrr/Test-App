# 👤 User Creation Guide

This guide describes how to create user accounts for the Exam System.

---

## 🚀 Option 1: Via Frontend Signup (Recommended)

The easiest way to create a new student account is via the signup page:
1. Navigate to `/api/auth/signup` (Backend) or use the frontend signup form.
2. Provide:
   - **Email**
   - **Password**
   - **Full Name**
   - **Organization ID** (Use `00000000-0000-0000-0000-000000000001` for the demo organization).

---

## 🎓 Option 2: Via SQL (Admin/Manual)

To manually create users (especially admins or teachers), run the following SQL in your Neon console:

```sql
-- Template for manual user creation
-- Password will be hashed using pgcrypto's crypt() function
INSERT INTO users (
    email, 
    password_hash, 
    full_name, 
    role, 
    organization_id, 
    is_active
) VALUES (
    'newuser@example.com', 
    crypt('SecurePassword123!', gen_salt('bf')), 
    'New User Name', 
    'student', -- Options: admin, teacher, student
    '00000000-0000-0000-0000-000000000001',
    true
);
```

---

## 🎭 User Roles Explained

### **admin**
- Managed all exams across the organization.
- Can create/edit/delete any user.
- Access to all proctoring logs and analytics.

### **teacher**
- Can create and manage their own exams.
- Can view submissions and grade students for their own exams.

### **student**
- Can browse and take exams they have access to.
- Can view their own results and violation logs.

---

## 🔑 Default Demo Users
If you have run `database/part_2_logic_data.sql`, the following accounts are already created:

- **Admin**: `admin@demo.com` / `Admin123!`
- **Teacher**: `teacher@demo.com` / `Teacher123!`
- **Student**: `student@demo.com` / `Student123!`

---

## 🆘 Troubleshooting

### Error: "duplicate key value"
The email address is already registered. Use a different email or delete the existing user:
```sql
DELETE FROM users WHERE email = 'old@example.com';
```

### Password Not Working
Ensure you are using the `crypt()` function with `gen_salt('bf')` when inserting via SQL. The application expects passwords hashed this way.
