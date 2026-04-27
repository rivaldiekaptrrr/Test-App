-- ============================================================================
-- PART 2: LOGIC & DATA (Sections 6 - 9)
-- ============================================================================

-- Section 6: Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION verify_password(password TEXT, password_hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN password_hash = crypt(password, password_hash);
END;
$$ LANGUAGE plpgsql;

-- Section 7: Triggers
CREATE TRIGGER update_exams_updated_at 
    BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Section 8: Seed Data (Demo Users)
-- Password for all: Demo123!
INSERT INTO organizations (id, name, slug) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo University', 'demo-univ');

INSERT INTO users (id, email, password_hash, full_name, role, organization_id, is_active)
VALUES 
    ('00000000-0000-0000-0000-000000000010', 'admin@demo.com', crypt('Demo123!', gen_salt('bf', 10)), 'Admin Demo', 'admin', '00000000-0000-0000-0000-000000000001', true),
    ('00000000-0000-0000-0000-000000000020', 'teacher@demo.com', crypt('Demo123!', gen_salt('bf', 10)), 'Teacher Demo', 'teacher', '00000000-0000-0000-0000-000000000001', true);

INSERT INTO exams (id, code, title, description, duration, status, created_by, organization_id)
VALUES 
    ('00000000-0000-0000-0000-000000000100', 'PROG2026', 'Programming Fundamentals', 'Basic programming assessment', 60, 'published', '00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001');

INSERT INTO questions (id, exam_id, question_type, question_text, question_order, points)
VALUES 
    ('00000000-0000-0000-0000-000000001001', '00000000-0000-0000-0000-000000000100', 'multiple_choice', 'What is 1+1?', 1, 1);

INSERT INTO question_options (question_id, option_text, is_correct, option_order)
VALUES 
    ('00000000-0000-0000-0000-000000001001', '2', true, 1),
    ('00000000-0000-0000-0000-000000001001', '3', false, 2);
