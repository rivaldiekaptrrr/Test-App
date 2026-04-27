import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { jwtVerify } from 'jose'

function getSQL() {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
        throw new Error('DATABASE_URL is not set')
    }
    return neon(databaseUrl)
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
            email: payload.email as string
        }
    } catch {
        return null
    }
}

export async function GET(request: NextRequest, props: { params: Promise<{ code: string }> }) {
    const params = await props.params;
    try {
        const sql = getSQL()
        const user = await getUser(request)

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { code } = params

        console.log('Fetching exam play data for:', code)

        // 1. Get Exam ID and Details
        const exams = await sql`
            SELECT id, title, duration, status
            FROM exams 
            WHERE code = ${code}
        `
        if (exams.length === 0) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        }
        const exam = exams[0]

        // 2. Validate Session
        // Check for active session
        const sessions = await sql`
            SELECT id, status, started_at, answers
            FROM exam_sessions 
            WHERE user_id = ${user.id} AND exam_id = ${exam.id}
            ORDER BY created_at DESC
            LIMIT 1
        `

        let session
        if (sessions.length > 0) {
            session = sessions[0]
            if (session.status === 'completed') {
                return NextResponse.json({ error: 'Exam already completed', completed: true }, { status: 403 })
            }
        } else {
            // If no session exists, that's an error because they should have started it in the intro page
            return NextResponse.json({ error: 'Session not started. Please go back to start.' }, { status: 400 })
        }

        // 3. Get Questions and Options
        const questions = await sql`
            SELECT id, question_text, question_type, points, question_order as "order_index"
            FROM questions
            WHERE exam_id = ${exam.id}
            ORDER BY question_order
        `

        // Get Options for all questions
        const questionIds = questions.map(q => q.id)
        let optionsMap: Record<string, any[]> = {}

        if (questionIds.length > 0) {
            // Need to handle array parameter for IN clause
            // Neon/postgres.js handles arrays automatically in tagged template literals
            const options = await sql`
                SELECT id, question_id, option_text, option_order as "order_index"
                FROM question_options
                WHERE question_id = ANY(${questionIds})
                ORDER BY option_order
            `

            options.forEach(opt => {
                if (!optionsMap[opt.question_id]) {
                    optionsMap[opt.question_id] = []
                }
                optionsMap[opt.question_id].push({
                    id: opt.id,
                    option_text: opt.option_text,
                    order_index: opt.order_index
                    // IMPORTANT: Do NOT send is_correct to frontend
                })
            })
        }

        // Combine questions with options
        const questionsWithOptions = questions.map(q => ({
            ...q,
            options: optionsMap[q.id] || []
        }))

        console.log('Session retrieved from DB:', session ? { id: session.id, status: session.status } : 'NONE');

        // Calculate time remaining
        const startedAt = new Date(session.started_at).getTime()
        const durationMs = exam.duration * 60 * 1000
        const expiresAt = startedAt + durationMs
        const now = Date.now()
        const remainingSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000))

        const responseData = {
            exam: {
                id: exam.id,
                title: exam.title,
                duration: exam.duration
            },
            session: {
                id: session.id,
                status: session.status,
                remainingSeconds,
                answers: session.answers || {} // Previous answers if any
            },
            questions: questionsWithOptions
        };

        console.log('API Response data session ID:', responseData.session.id);
        return NextResponse.json(responseData)

    } catch (error: any) {
        console.error('Get exam play data error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
