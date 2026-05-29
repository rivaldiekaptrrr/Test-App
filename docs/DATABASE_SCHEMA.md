# Database Schema Documentation

This document describes the database schema used in the Test App. This is designed to be compatible with PostgreSQL (specifically Supabase.com).

## Tables

### 1. `organizations`
Stores organization/tenant information.
- `id`: UUID (Primary Key)
- `name`: TEXT (Organization Name)
- `slug`: TEXT (Unique identifier for URL)
- `domain`: TEXT (Optional domain filter)
- `settings`: JSONB (Config options)
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ

### 2. `users`
Stores all user information including administrative and student accounts.
- `id`: UUID (Primary Key)
- `email`: TEXT (Unique, used for login)
- `password_hash`: TEXT (Hashed using pgcrypto)
- `full_name`: TEXT
- `avatar_url`: TEXT
- `role`: user_role (ENUM: 'admin', 'teacher', 'hr', 'student', 'applicant')
- `organization_id`: UUID (Foreign Key -> organizations.id)
- `is_active`: BOOLEAN
- `last_login_at`: TIMESTAMPTZ
- `created_at`: TIMESTAMPTZ

### 3. `exams`
Stores exam definitions.
- `id`: UUID (Primary Key)
- `code`: TEXT (Unique, used for join-by-code)
- `title`: TEXT
- `description`: TEXT
- `duration`: INTEGER (Minutes)
- `status`: exam_status (ENUM: 'draft', 'published', 'archived')
- `proctoring_enabled`: BOOLEAN
- `camera_required`: BOOLEAN
- `tab_switch_allowed`: INTEGER
- `created_by`: UUID (Foreign Key -> users.id)
- `created_at`: TIMESTAMPTZ

### 4. `questions`
Questions belonging to an exam.
- `id`: UUID (Primary Key)
- `exam_id`: UUID (Foreign Key -> exams.id)
- `question_type`: question_type (ENUM: 'multiple_choice', 'essay', 'code', 'file_upload')
- `question_text`: TEXT
- `question_order`: INTEGER
- `points`: INTEGER
- `correct_answer`: TEXT (For essay/short answer auto-check or reference)
- `explanation`: TEXT
- `created_at`: TIMESTAMPTZ

### 5. `question_options`
Options for multiple choice questions.
- `id`: UUID (Primary Key)
- `question_id`: UUID (Foreign Key -> questions.id)
- `option_text`: TEXT
- `is_correct`: BOOLEAN
- `option_order`: INTEGER

### 6. `exam_sessions`
Records of a user's attempt at an exam.
- `id`: UUID (Primary Key)
- `exam_id`: UUID (Foreign Key -> exams.id)
- `user_id`: UUID (Foreign Key -> users.id)
- `exam_code`: TEXT (Redundant but useful for tracing)
- `status`: session_status (ENUM: 'not_started', 'in_progress', 'completed', 'blocked', 'graded')
- `started_at`: TIMESTAMPTZ
- `completed_at`: TIMESTAMPTZ
- `score`: DECIMAL(5,2)
- `max_score`: INTEGER
- `answers`: JSONB (Snapshot of answers as JSON)
- `created_at`: TIMESTAMPTZ

### 7. `student_answers`
Granular record of each answer submitted during a session.
- `id`: UUID (Primary Key)
- `session_id`: UUID (Foreign Key -> exam_sessions.id)
- `question_id`: UUID (Foreign Key -> questions.id)
- `selected_option_id`: UUID (Foreign Key -> question_options.id)
- `answer_text`: TEXT (For essay/code)
- `is_correct`: BOOLEAN
- `points_earned`: NUMERIC

### 8. `cheating_logs`
Logs of proctoring violations.
- `id`: UUID (Primary Key)
- `session_id`: UUID (Foreign Key -> exam_sessions.id)
- `violation_type`: violation_type (ENUM: 'tab_switch', 'multiple_faces', 'no_face', 'phone_detected', 'copy_paste', 'right_click')
- `snapshot_url`: TEXT (Linked to Golang backend storage)
- `metadata`: JSONB
- `created_at`: TIMESTAMPTZ

### 9. `notifications`
System notifications for users.
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key -> users.id)
- `type`: notification_type (ENUM: 'exam_assigned', 'exam_reminder', 'exam_graded', 'violation_warning')
- `title`: TEXT
- `message`: TEXT
- `is_read`: BOOLEAN
- `created_at`: TIMESTAMPTZ

## Custom Types (ENUMs)
If migrating to a database without ENUM support, these should be handled as TEXT with CHECK constraints.
- `user_role`: admin, teacher, hr, student, applicant
- `exam_status`: draft, published, archived
- `session_status`: not_started, in_progress, completed, blocked, graded
- `question_type`: multiple_choice, essay, code, file_upload
- `violation_type`: tab_switch, multiple_faces, no_face, phone_detected, copy_paste, right_click
- `notification_type`: exam_assigned, exam_reminder, exam_graded, violation_warning
