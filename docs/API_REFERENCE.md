# API Reference Documentation

This document describes the API endpoints for the Exam System. All endpoints (unless specified) require a JWT token in the `Authorization` header.

**Service URL**: `/api` (Production) or `http://localhost:3000/api` (Local)

---

## 1. Authentication

### **POST `/auth/login`**
Authenticates a user and returns a JWT.
- **Request Body**:
  ```json
  { "email": "user@example.com", "password": "password123" }
  ```
- **Response**:
  ```json
  { "token": "jwt_token_here", "user": { "id": "...", "email": "...", "role": "..." } }
  ```

### **POST `/auth/signup`**
Registers a new user.
- **Request Body**:
  ```json
  { "email": "...", "password": "...", "full_name": "...", "organization_id": "..." }
  ```

---

## 2. Exam Management (Admin/Teacher)

### **GET `/exams`**
Lists all exams available to the user's organization.
- **Query Params**: `page`, `limit`, `search`
- **Response**: `{ "exams": [...] }`

### **GET `/exams/[id]`**
Retrieves full details of a specific exam.

### **POST `/exams`**
Creates a new exam.
- **Note**: Requires role `admin` or `teacher`.

---

## 3. Question Management

### **GET `/exams/[id]/questions`**
Retrieves all questions belonging to an exam.

### **POST `/exams/[id]/questions`**
Adds a new question to an exam.
- **Request Body**:
  ```json
  {
    "question_text": "...",
    "question_type": "multiple_choice",
    "points": 10,
    "options": [
      { "option_text": "Option A", "is_correct": true },
      { "option_text": "Option B", "is_correct": false }
    ]
  }
  ```

---

## 4. Exam Taking (Student)

### **GET `/exams/code/[code]`**
Fetches exam basic info using the public `exam_code`. Used at the registration/intro page.

### **POST `/exams/session/start`**
Initiates an exam session.
- **Request Body**: `{ "examCode": "..." }`
- **Response**: `{ "sessionId": "...", "examId": "..." }`

### **GET `/exams/play/[code]`**
Retrieves the exam play data (questions, existing answers, remaining time).
- **Security**: Questions are returned WITHOUT `is_correct` field.

### **POST `/exams/session/submit`**
Submits exam answers and calculates the final score.
- **Request Body**:
  ```json
  {
    "sessionId": "...",
    "answers": {
      "question_id_1": "option_id_a",
      "question_id_2": "Essay answer text..."
    }
  }
  ```

---

## 5. Dashboard & Results

### **GET `/dashboard`**
Retrieves summarized statistics for the user (Number of exams, recent activity, pass rate).

### **GET `/results`**
Lists completed exam sessions for the current student.

### **GET `/results/[sessionId]`**
Retrieves detailed results for a specific session, including correct/wrong markers for each question.

---

## 6. Admin Tools

### **GET `/admin/users`**
Lists all users. (Admin Only)

---

## Implementation Notes for Future Database Migration
1. **JWT Verification**: Each API route verifies the JWT using the `JWT_SECRET` environment variable. 
2. **Database Client**: Database interactions are abstracted using the Neon serverless driver. To change databases, update `@/lib/db/client.ts` and the `getSQL()` utility in API routes.
3. **Password Security**: Current implementation uses `pgcrypto` in PostgreSQL for hashing (`CRYPT`). If moving to a different DB, ensuring password hashing parity is critical.
