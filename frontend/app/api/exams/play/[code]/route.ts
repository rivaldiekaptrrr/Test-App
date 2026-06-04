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
            email: payload.email as string,
            role: payload.role as string
        }
    } catch {
        return null
    }
}

// GET /api/exams/play/[code] - Get all data needed to play an exam
export async function GET(
    request: NextRequest,
    { params }: { params: { code: string } }
) {
    try {
        const sql = getSQL()
        const user = await getUser(request)

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { code } = await params

        // 1. Get Exam
        const exams = await sql`
            SELECT id, title, duration, status, proctoring_enabled
            FROM exams
            WHERE code = ${code}
        `
        if (exams.length === 0) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        }
        const exam = exams[0]

        // 2. Get active session for user
        const sessions = await sql`
            SELECT id, status, answers, started_at, completed_at 
            FROM exam_sessions
            WHERE exam_id = ${exam.id} AND user_id = ${user.id}
        `
        if (sessions.length === 0) {
            return NextResponse.json({ error: 'Session not started' }, { status: 400 })
        }
        const session = sessions[0]

        if (session.status === 'completed') {
            return NextResponse.json({ completed: true, error: 'Exam already completed' }, { status: 403 })
        }

        // Calculate remaining time
        // duration is in minutes. started_at is a timestamp
        const started = new Date(session.started_at).getTime()
        const now = new Date().getTime()
        const elapsedSeconds = Math.floor((now - started) / 1000)
        const totalDurationSeconds = exam.duration * 60
        const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds)

        if (remainingSeconds <= 0) {
            // Auto complete if time is up on load (optional logic)
            return NextResponse.json({ completed: true, error: 'Time is up' }, { status: 403 })
        }

        // 3. Get Questions and Options
        const questions = await sql`
            SELECT id, question_text, question_type, points, question_order as order_index
            FROM questions 
            WHERE exam_id = ${exam.id}
            ORDER BY question_order ASC
        `

        if (questions.length > 0) {
            const qIds = questions.map(q => q.id)
            const options = await sql`
                SELECT id, question_id, option_text, option_order as order_index
                FROM question_options 
                WHERE question_id = ANY(${qIds})
                ORDER BY option_order ASC
            `
            
            // Attach options to questions (without is_correct!)
            for (let q of questions) {
                q.options = options.filter(opt => opt.question_id === q.id)
            }
        }

        return NextResponse.json({
            exam: {
                id: exam.id,
                title: exam.title,
                duration: exam.duration
            },
            session: {
                id: session.id,
                status: session.status,
                answers: session.answers || {},
                remainingSeconds
            },
            questions
        })

    } catch (error: any) {
        console.error('Play exam error:', error)
        return NextResponse.json({ error: error.message || 'Failed to load exam data' }, { status: 500 })
    }
}
