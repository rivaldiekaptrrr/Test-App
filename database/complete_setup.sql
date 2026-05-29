-- ============================================================================
-- COMPLETE DATABASE SETUP FOR Supabase DATABASE
-- ============================================================================
-- Description: Complete database schema for Online Exam System with Anti-Cheating
-- Database: Supabase (PostgreSQL)
-- Version: 2.0
-- Created: 2026-01-30
-- 
-- This file contains:
-- 1. Table schemas (users, organizations, exams, questions, etc.)
-- 2. Indexes for performance
-- 3. Triggers and functions
-- 4. Seed data (demo users and exams)
-- 
-- HOW TO USE:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Copy and paste this ENTIRE file
-- 3. Click "Run" ▶️
-- 4. Wait for completion (~10-15 seconds)
-- 5. ✅ Database ready!
-- ============================================================================

-- ============================================================================
-- SECTION 1: EXTENSIONS (Already enabled by default in Supabase)
-- ============================================================================
-- Note: pgcrypto and uuid-ossp are pre-installed in Supabase
-- If you get an error, extensions are already active - just skip this section

-- ============================================================================
-- SECTION 2: DROP EXISTING TABLES (Clean Install)
-- ============================================================================
DROP TABLE IF EXISTS student_answers CASCADE;
DROP TABLE IF EXISTS question_options CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS cheating_logs CASCADE;
DROP TABLE IF EXISTS exam_sessions CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Drop types if they exist
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS exam_status CASCADE;
DROP TYPE IF EXISTS session_status CASCADE;
DROP TYPE IF EXISTS question_type CASCADE;
DROP TYPE IF EXISTS violation_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- ============================================================================
-- SECTION 3: CREATE CUSTOM TYPES
-- ============================================================================
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'hr', 'student', 'applicant');
CREATE TYPE exam_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE session_status AS ENUM ('not_started', 'in_progress', 'completed', 'blocked', 'graded');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'essay', 'code', 'file_upload');
CREATE TYPE violation_type AS ENUM ('tab_switch', 'multiple_faces', 'no_face', 'phone_detected', 'copy_paste', 'right_click');
CREATE TYPE notification_type AS ENUM ('exam_assigned', 'exam_reminder', 'exam_graded', 'violation_warning');

-- ============================================================================
-- SECTION 4: CREATE TABLES
-- ============================================================================

-- Table: organizations (Multi-tenancy support)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    domain TEXT,
    storage_path TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: users (Custom auth - replaces Supabase auth.users)
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

-- Table: sessions (Auth sessions for JWT tokens)
CREATE TABLE auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: exams
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL DEFAULT 60, -- in minutes
    status exam_status DEFAULT 'draft',
    
    -- Proctoring settings
    proctoring_enabled BOOLEAN DEFAULT false,
    camera_required BOOLEAN DEFAULT false,
    screenshot_interval INTEGER DEFAULT 30, -- in seconds
    tab_switch_allowed INTEGER DEFAULT 2,
    
    -- Scheduling
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    
    -- Metadata
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    question_count INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: questions
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_type question_type NOT NULL DEFAULT 'multiple_choice',
    question_text TEXT NOT NULL,
    question_order INTEGER NOT NULL DEFAULT 0,
    points INTEGER DEFAULT 1,
    
    -- For essay/code questions
    correct_answer TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(exam_id, question_order)
);

-- Table: question_options (For multiple choice questions)
CREATE TABLE question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    option_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: exam_sessions (Student exam attempts)
CREATE TABLE exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_code TEXT NOT NULL, -- Denormalized for easy access
    
    -- Session tracking
    status session_status DEFAULT 'not_started',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Results
    score DECIMAL(5,2),
    max_score INTEGER,
    grade TEXT,
    
    -- Violations
    violation_count INTEGER DEFAULT 0,
    auto_blocked BOOLEAN DEFAULT false,
    
    -- Answers stored as JSONB
    answers JSONB DEFAULT '{}',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(exam_id, user_id)
);

-- Table: student_answers (Individual answer records)
CREATE TABLE student_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    selected_option_id UUID REFERENCES question_options(id) ON DELETE SET NULL,
    is_correct BOOLEAN,
    points_earned DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(session_id, question_id)
);

-- Table: cheating_logs (Violation audit trail)
CREATE TABLE cheating_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    violation_type violation_type NOT NULL,
    snapshot_path TEXT,
    metadata JSONB DEFAULT '{}',
    auto_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: notifications (User notifications)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 5: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_active ON users(is_active);

CREATE INDEX idx_auth_sessions_user ON auth_sessions(user_id);
CREATE INDEX idx_auth_sessions_expires ON auth_sessions(expires_at);

CREATE INDEX idx_exams_code ON exams(code);
CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_exams_created_by ON exams(created_by);
CREATE INDEX idx_exams_org ON exams(organization_id);

CREATE INDEX idx_questions_exam ON questions(exam_id);
CREATE INDEX idx_questions_order ON questions(exam_id, question_order);

CREATE INDEX idx_options_question ON question_options(question_id);

CREATE INDEX idx_sessions_exam ON exam_sessions(exam_id);
CREATE INDEX idx_sessions_user ON exam_sessions(user_id);
CREATE INDEX idx_sessions_status ON exam_sessions(status);
CREATE INDEX idx_sessions_exam_code ON exam_sessions(exam_code);

CREATE INDEX idx_answers_session ON student_answers(session_id);
CREATE INDEX idx_answers_question ON student_answers(question_id);

CREATE INDEX idx_cheating_session ON cheating_logs(session_id);
CREATE INDEX idx_cheating_type ON cheating_logs(violation_type);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);

-- ============================================================================
-- SECTION 6: CREATE FUNCTIONS
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Hash password
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN crypt(password, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql;

-- Function: Verify password
CREATE OR REPLACE FUNCTION verify_password(password TEXT, password_hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN password_hash = crypt(password, password_hash);
END;
$$ LANGUAGE plpgsql;

-- Function: Update question count on exam
CREATE OR REPLACE FUNCTION update_exam_question_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
        UPDATE exams 
        SET question_count = (
            SELECT COUNT(*) FROM questions WHERE exam_id = COALESCE(NEW.exam_id, OLD.exam_id)
        )
        WHERE id = COALESCE(NEW.exam_id, OLD.exam_id);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function: Clean expired sessions
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM auth_sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 7: CREATE TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exams_updated_at 
    BEFORE UPDATE ON exams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at 
    BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_sessions_updated_at 
    BEFORE UPDATE ON exam_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_answers_updated_at 
    BEFORE UPDATE ON student_answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update question count
CREATE TRIGGER update_question_count_on_insert
    AFTER INSERT ON questions
    FOR EACH ROW EXECUTE FUNCTION update_exam_question_count();

CREATE TRIGGER update_question_count_on_delete
    AFTER DELETE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_exam_question_count();

-- ============================================================================
-- SECTION 8: SEED DATA
-- ============================================================================

-- Insert demo organization
INSERT INTO organizations (id, name, slug, domain, settings)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Demo University', 'demo-university', 'demo.edu', '{"proctoring_enabled": true}');

-- Insert demo users (passwords are hashed)
-- Password for all: Demo123!
INSERT INTO users (id, email, password_hash, full_name, role, organization_id, email_verified, is_active)
VALUES 
    (
        '00000000-0000-0000-0000-000000000010',
        'admin@demo.com',
        crypt('Demo123!', gen_salt('bf', 10)),
        'Admin Demo',
        'admin',
        '00000000-0000-0000-0000-000000000001',
        true,
        true
    ),
    (
        '00000000-0000-0000-0000-000000000020',
        'teacher@demo.com',
        crypt('Demo123!', gen_salt('bf', 10)),
        'Teacher Demo',
        'teacher',
        '00000000-0000-0000-0000-000000000001',
        true,
        true
    ),
    (
        '00000000-0000-0000-0000-000000000030',
        'student@demo.com',
        crypt('Demo123!', gen_salt('bf', 10)),
        'Student Demo',
        'student',
        '00000000-0000-0000-0000-000000000001',
        true,
        true
    );

-- Insert demo exams (created by teacher)
INSERT INTO exams (id, code, title, description, duration, status, proctoring_enabled, camera_required, tab_switch_allowed, created_by, organization_id)
VALUES 
    (
        '00000000-0000-0000-0000-000000000100',
        'PROG2026',
        'Programming Fundamentals',
        'Test your basic programming knowledge including variables, loops, and functions.',
        60,
        'published',
        true,
        true,
        2,
        '00000000-0000-0000-0000-000000000020',
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        '00000000-0000-0000-0000-000000000101',
        'WEBDEV24',
        'Web Development Basics',
        'HTML, CSS, and JavaScript fundamentals for modern web development.',
        45,
        'published',
        true,
        true,
        2,
        '00000000-0000-0000-0000-000000000020',
        '00000000-0000-0000-0000-000000000001'
    ),
    (
        '00000000-0000-0000-0000-000000000102',
        'DATABASE2026',
        'Database Design & SQL',
        'Comprehensive test on database concepts, normalization, and SQL queries.',
        90,
        'published',
        true,
        false,
        3,
        '00000000-0000-0000-0000-000000000020',
        '00000000-0000-0000-0000-000000000001'
    );

-- Insert sample questions for PROG2026
INSERT INTO questions (id, exam_id, question_type, question_text, question_order, points)
VALUES 
    ('00000000-0000-0000-0000-000000001001', '00000000-0000-0000-0000-000000000100', 'multiple_choice', 'What is the correct syntax for a for loop in JavaScript?', 1, 1),
    ('00000000-0000-0000-0000-000000001002', '00000000-0000-0000-0000-000000000100', 'multiple_choice', 'Which data type is used to store text in most programming languages?', 2, 1),
    ('00000000-0000-0000-0000-000000001003', '00000000-0000-0000-0000-000000000100', 'essay', 'Explain the difference between var, let, and const in JavaScript.', 3, 5),
    ('00000000-0000-0000-0000-000000001004', '00000000-0000-0000-0000-000000000100', 'multiple_choice', 'What does HTML stand for?', 4, 1),
    ('00000000-0000-0000-0000-000000001005', '00000000-0000-0000-0000-000000000100', 'multiple_choice', 'Which symbol is used for comments in JavaScript?', 5, 1);

-- Insert options for question 1
INSERT INTO question_options (question_id, option_text, is_correct, option_order)
VALUES 
    ('00000000-0000-0000-0000-000000001001', 'for (i = 0; i < 10; i++)', true, 1),
    ('00000000-0000-0000-0000-000000001001', 'for i in range(10)', false, 2),
    ('00000000-0000-0000-0000-000000001001', 'foreach (i in 10)', false, 3),
    ('00000000-0000-0000-0000-000000001001', 'loop i to 10', false, 4);

-- Insert options for question 2
INSERT INTO question_options (question_id, option_text, is_correct, option_order)
VALUES 
    ('00000000-0000-0000-0000-000000001002', 'String', true, 1),
    ('00000000-0000-0000-0000-000000001002', 'Integer', false, 2),
    ('00000000-0000-0000-0000-000000001002', 'Boolean', false, 3),
    ('00000000-0000-0000-0000-000000001002', 'Float', false, 4);

-- Insert options for question 4
INSERT INTO question_options (question_id, option_text, is_correct, option_order)
VALUES 
    ('00000000-0000-0000-0000-000000001004', 'Hyper Text Markup Language', true, 1),
    ('00000000-0000-0000-0000-000000001004', 'High Tech Modern Language', false, 2),
    ('00000000-0000-0000-0000-000000001004', 'Hyper Transfer Markup Language', false, 3),
    ('00000000-0000-0000-0000-000000001004', 'Home Tool Markup Language', false, 4);

-- Insert options for question 5
INSERT INTO question_options (question_id, option_text, is_correct, option_order)
VALUES 
    ('00000000-0000-0000-0000-000000001005', '//', true, 1),
    ('00000000-0000-0000-0000-000000001005', '#', false, 2),
    ('00000000-0000-0000-0000-000000001005', '--', false, 3),
    ('00000000-0000-0000-0000-000000001005', '**', false, 4);

-- Insert sample questions for WEBDEV24
INSERT INTO questions (id, exam_id, question_type, question_text, question_order, points)
VALUES 
    ('00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000000101', 'multiple_choice', 'What does CSS stand for?', 1, 1),
    ('00000000-0000-0000-0000-000000002002', '00000000-0000-0000-0000-000000000101', 'multiple_choice', 'Which HTML tag is used to define an internal style sheet?', 2, 1),
    ('00000000-0000-0000-0000-000000002003', '00000000-0000-0000-0000-000000000101', 'essay', 'Explain the box model in CSS.', 3, 5);

-- Insert options for WEBDEV questions
INSERT INTO question_options (question_id, option_text, is_correct, option_order)
VALUES 
    ('00000000-0000-0000-0000-000000002001', 'Cascading Style Sheets', true, 1),
    ('00000000-0000-0000-0000-000000002001', 'Creative Style Sheets', false, 2),
    ('00000000-0000-0000-0000-000000002001', 'Computer Style Sheets', false, 3),
    ('00000000-0000-0000-0000-000000002001', 'Colorful Style Sheets', false, 4);

INSERT INTO question_options (question_id, option_text, is_correct, option_order)
VALUES 
    ('00000000-0000-0000-0000-000000002002', '<style>', true, 1),
    ('00000000-0000-0000-0000-000000002002', '<css>', false, 2),
    ('00000000-0000-0000-0000-000000002002', '<script>', false, 3),
    ('00000000-0000-0000-0000-000000002002', '<styles>', false, 4);

-- ============================================================================
-- SECTION 9: VERIFICATION
-- ============================================================================

-- Show summary
DO $$
DECLARE
    table_count INTEGER;
    user_count INTEGER;
    exam_count INTEGER;
    question_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
    
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO exam_count FROM exams;
    SELECT COUNT(*) INTO question_count FROM questions;
    
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Supabase DATABASE SETUP COMPLETE!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Tables created: %', table_count;
    RAISE NOTICE 'Users created: %', user_count;
    RAISE NOTICE 'Exams created: %', exam_count;
    RAISE NOTICE 'Questions created: %', question_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Demo Credentials:';
    RAISE NOTICE '  Admin: admin@demo.com / Demo123!';
    RAISE NOTICE '  Teacher: teacher@demo.com / Demo123!';
    RAISE NOTICE '  Student: student@demo.com / Demo123!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Copy your Supabase connection string';
    RAISE NOTICE '2. Update frontend .env.local file';
    RAISE NOTICE '3. Start the application!';
    RAISE NOTICE '==========================================';
END $$;

-- Quick verification query
SELECT 
    'organizations' as table_name, COUNT(*) as row_count FROM organizations
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'exams', COUNT(*) FROM exams
UNION ALL
SELECT 'questions', COUNT(*) FROM questions
UNION ALL
SELECT 'question_options', COUNT(*) FROM question_options
ORDER BY table_name;
