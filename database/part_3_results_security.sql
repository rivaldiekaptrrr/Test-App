-- ============================================================================
-- PART 3: RESULTS & SECURITY (Proctoring)
-- ============================================================================

-- Tabel untuk menyimpan detail jawaban pilihan ganda/essay siswa
CREATE TABLE IF NOT EXISTS student_answers (
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

-- Tabel untuk log kecurangan (deteksi wajah, ganti tab, dll)
CREATE TABLE IF NOT EXISTS cheating_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    violation_type violation_type NOT NULL,
    snapshot_path TEXT,
    metadata JSONB DEFAULT '{}',
    auto_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel untuk pemberitahuan ke user
CREATE TABLE IF NOT EXISTS notifications (
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

-- Index tambahan untuk kecepatan pencarian data
CREATE INDEX IF NOT EXISTS idx_answers_session ON student_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_cheating_session ON cheating_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
