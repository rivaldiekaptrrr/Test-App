import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'
import { jwtVerify } from 'jose'

function getSQL() {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
        throw new Error('DATABASE_URL is not set')
    }
    return postgres(databaseUrl)
}

function getJWTSecret() {
    return new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-min-32-characters!')
}

async function getUser(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return null
    try {
        const { payload } = await jwtVerify(token, getJWTSecret())
        return { 
            id: payload.sub as string,
            role: payload.role as string 
        }
    } catch {
        return null
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const sql = getSQL()
        const user = await getUser(request)
        
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // 1. Fetch Exam to verify ownership/existence
        const exams = await sql`
            SELECT id, title, code, created_by 
            FROM exams 
            WHERE id = ${id}
        `
        if (exams.length === 0) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        }
        
        const exam = exams[0]
        
        // Ensure admin owns the exam (optional, but good practice if multi-tenant)
        if (exam.created_by !== user.id) {
            return NextResponse.json({ error: 'You do not have permission to view these submissions' }, { status: 403 })
        }

        // 2. Fetch Sessions + User Profiles
        const sessions = await sql`
            SELECT 
                s.id as session_id,
                s.user_id as student_id,
                u.full_name as student_name,
                u.email as student_email,
                s.status,
                s.score,
                s.max_score,
                s.started_at as started_at,
                s.completed_at as ended_at,
                s.violation_count
            FROM exam_sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.exam_id = ${exam.id} AND s.status = 'completed'
            ORDER BY s.completed_at DESC
        `

        // Format to match expected frontend Submission interface
        const formattedSubmissions = sessions.map(s => {
            let duration = 0
            if (s.started_at && s.ended_at) {
                duration = Math.floor((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000)
            }
            return {
                session_id: s.session_id,
                student_id: s.student_id,
                student_name: s.student_name,
                student_email: s.student_email,
                status: s.status,
                score: s.score,
                max_score: s.max_score,
                started_at: s.started_at,
                ended_at: s.ended_at,
                duration_seconds: duration,
                violation_count: s.violation_count
            }
        })

        return NextResponse.json({
            exam,
            submissions: formattedSubmissions
        })

    } catch (error: any) {
        console.error('Fetch submissions error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
