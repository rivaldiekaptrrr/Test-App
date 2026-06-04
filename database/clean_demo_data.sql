-- ==========================================
-- SCRIPT UNTUK MEMBERSIHKAN DATA DEMO
-- Menghapus semua data dummy ujian, soal, dan akun demo
-- (Kecuali 1 akun Admin utama agar tetap bisa login)
-- ==========================================

-- 1. Hapus semua jawaban murid & log kecurangan
DELETE FROM student_answers;
DELETE FROM cheating_logs;
DELETE FROM exam_sessions;

-- 2. Hapus semua opsi dan soal ujian
DELETE FROM question_options;
DELETE FROM questions;

-- 3. Hapus semua ujian demo
DELETE FROM exams;

-- 4. Hapus akun guru dan murid demo
DELETE FROM users 
WHERE email IN ('teacher@demo.com', 'student@demo.com', 'creator@demo.com', 'user@demo.com');

-- 5. Ubah akun admin demo menjadi akun admin production (Opsional)
UPDATE users 
SET 
    full_name = 'Production Admin',
    email = 'admin@production.com'
WHERE email = 'admin@demo.com';

-- SELESAI!
-- Sekarang database Anda 100% bersih dari data dummy.
-- Anda bisa login menggunakan:
-- Email: admin@production.com
-- Password: Demo123! (Harap segera diganti di menu pengaturan jika sudah ada)
