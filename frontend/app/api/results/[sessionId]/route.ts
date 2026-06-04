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
    { params }: { params: { sessionId: string } }
) {
    try {
        const sql = getSQL()
        const user = await getUser(request)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { sessionId } = await params

        // Fetch session info
        let sessions;
        if (user.role === 'admin') {
            sessions = await sql`
                SELECT s.id, s.exam_id, s.score, s.max_score, e.title
                FROM exam_sessions s
                JOIN exams e ON s.exam_id = e.id
                WHERE s.id = ${sessionId}
            `
        } else {
            sessions = await sql`
                SELECT s.id, s.exam_id, s.score, s.max_score, e.title
                FROM exam_sessions s
                JOIN exams e ON s.exam_id = e.id
                WHERE s.id = ${sessionId} AND s.user_id = ${user.id}
            `
        }

        if (sessions.length === 0) {
            return NextResponse.json({ error: 'Result not found' }, { status: 404 })
        }

        const session = sessions[0]

        // Fetch questions and user answers
        const questionsData = await sql`
            SELECT 
                q.id as question_id,
                q.question_text,
                q.question_type,
                q.points,
                q.question_order as order_number,
                q.metadata->>'explanation' as explanation,
                ua.answer_text as student_answer,
                ua.is_correct,
                ua.points_earned,
                so.option_text as selected_option_text,
                co.option_text as correct_option_text
            FROM questions q
            LEFT JOIN user_answers ua ON q.id = ua.question_id AND ua.session_id = ${sessionId}
            LEFT JOIN question_options so ON ua.selected_option_id = so.id
            LEFT JOIN question_options co ON q.id = co.question_id AND co.is_correct = true
            WHERE q.exam_id = ${session.exam_id}
            ORDER BY q.question_order ASC
        `

        // Fetch all options for these questions to display choices
        const qIds = questionsData.map(q => q.question_id)
        let optionsMap: Record<string, any[]> = {}

        if (qIds.length > 0) {
            const allOptions = await sql`
                SELECT id, question_id, option_text, is_correct, option_order as order_number
                FROM question_options
                WHERE question_id = ANY(${qIds})
                ORDER BY option_order ASC
            `
            for (const opt of allOptions) {
                if (!optionsMap[opt.question_id]) {
                    optionsMap[opt.question_id] = []
                }
                optionsMap[opt.question_id].push(opt)
            }
        }

        const questions = questionsData.map(q => ({
            ...q,
            options: optionsMap[q.question_id] || []
        }))

        return NextResponse.json({
            examId: session.exam_id,
            examTitle: session.title,
            score: session.score,
            questions: questions,
            isAdmin: user.role === 'admin'
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
