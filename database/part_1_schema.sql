-- ============================================================================
-- PART 1: SCHEMA SETUP (Sections 1 - 5)
-- ============================================================================

-- Section 1: Cleanup Existing
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

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS exam_status CASCADE;
DROP TYPE IF EXISTS session_status CASCADE;
DROP TYPE IF EXISTS question_type CASCADE;
DROP TYPE IF EXISTS violation_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- Section 2: Custom Types
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'hr', 'student', 'applicant');
CREATE TYPE exam_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE session_status AS ENUM ('not_started', 'in_progress', 'completed', 'blocked', 'graded');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'essay', 'code', 'file_upload');
CREATE TYPE violation_type AS ENUM ('tab_switch', 'multiple_faces', 'no_face', 'phone_detected', 'copy_paste', 'right_click');
CREATE TYPE notification_type AS ENUM ('exam_assigned', 'exam_reminder', 'exam_graded', 'violation_warning');

-- Section 3: Tables
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    domain TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'student',
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    email_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL DEFAULT 60,
    status exam_status DEFAULT 'draft',
    proctoring_enabled BOOLEAN DEFAULT false,
    camera_required BOOLEAN DEFAULT false,
    tab_switch_allowed INTEGER DEFAULT 2,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    question_count INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_type question_type NOT NULL DEFAULT 'multiple_choice',
    question_text TEXT NOT NULL,
    question_order INTEGER NOT NULL DEFAULT 0,
    points INTEGER DEFAULT 1,
    correct_answer TEXT,
    explanation TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, question_order)
);

CREATE TABLE question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    option_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_code TEXT NOT NULL,
    status session_status DEFAULT 'not_started',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    score DECIMAL(5,2),
    max_score INTEGER,
    violation_count INTEGER DEFAULT 0,
    answers JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, user_id)
);

-- Section 4: Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_exams_code ON exams(code);
CREATE INDEX idx_questions_exam ON questions(exam_id);
CREATE INDEX idx_sessions_user ON exam_sessions(user_id);
