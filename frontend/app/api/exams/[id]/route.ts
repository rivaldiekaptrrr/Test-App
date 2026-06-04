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

// GET /api/exams/[id] - Get single exam details
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const sql = getSQL()
        const user = await getUser(request)

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        const exams = await sql`
            SELECT 
                id, code, title, description, duration, status,
                proctoring_enabled, camera_required, tab_switch_allowed,
                start_time, end_time, question_count, created_by, created_at
            FROM exams
            WHERE id = ${id}
        `

        if (exams.length === 0) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        }

        const exam = exams[0]

        // Only admin can view draft exams
        if (exam.status === 'draft' && user.role !== 'admin') {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        }

        return NextResponse.json({ exam })

    } catch (error: any) {
        console.error('Get exam error:', error.message || error)
        return NextResponse.json({ error: error.message || 'Failed to fetch exam' }, { status: 500 })
    }
}

// PUT /api/exams/[id] - Update exam (status, details)
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const sql = getSQL()
        const user = await getUser(request)

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Only admins can update exams' }, { status: 403 })
        }

        const { id } = await params
        const body = await request.json()

        // Check exam exists
        const existing = await sql`
            SELECT id FROM exams WHERE id = ${id}
        `

        if (existing.length === 0) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        }

        const { status, title, description, duration, proctoring_enabled, start_time, end_time } = body

        const updated = await sql`
            UPDATE exams SET
                status = COALESCE(${status ?? null}, status),
                title = COALESCE(${title ?? null}, title),
                description = COALESCE(${description ?? null}, description),
                duration = COALESCE(${duration ?? null}, duration),
                proctoring_enabled = COALESCE(${proctoring_enabled ?? null}, proctoring_enabled),
                start_time = COALESCE(${start_time ?? null}, start_time),
                end_time = COALESCE(${end_time ?? null}, end_time),
                updated_at = NOW()
            WHERE id = ${id}
            RETURNING *
        `

        return NextResponse.json({ exam: updated[0] })

    } catch (error: any) {
        console.error('Update exam error:', error.message || error)
        return NextResponse.json({ error: error.message || 'Failed to update exam' }, { status: 500 })
    }
}

// POST /api/exams/[id] - Submit exam answers
export async function POST(request: NextRequest) {
    try {
        const sql = getSQL()
        const user = await getUser(request)

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { sessionId, answers } = body

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
        }

        // 1. Get Session & Exam Info
        const sessions = await sql`
            SELECT s.id, s.exam_id, s.status, e.id as exam_pk
            FROM exam_sessions s
            JOIN exams e ON s.exam_id = e.id
            WHERE s.id = ${sessionId} AND s.user_id = ${user.id}
        `

        if (sessions.length === 0) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }
        const session = sessions[0]

        if (session.status === 'completed') {
            return NextResponse.json({ error: 'Session already completed' }, { status: 400 })
        }

        // 2. Fetch Questions and Correct Answers for Grading
        const questions = await sql`
            SELECT id, question_type, points
            FROM questions
            WHERE exam_id = ${session.exam_id}
        `

        const questionIds = questions.map(q => q.id)

        let correctOptionsMap: Record<string, string> = {}
        if (questionIds.length > 0) {
            const correctOptions = await sql`
                SELECT question_id, id
                FROM question_options
                WHERE question_id = ANY(${questionIds}) AND is_correct = true
            `
            correctOptions.forEach(opt => {
                correctOptionsMap[opt.question_id] = opt.id
            })
        }

        let totalScore = 0
        let maxScore = 0

        for (const q of questions) {
            maxScore += Number(q.points)

            const userAnswer = answers[q.id]
            let isCorrect = false
            let pointsEarned = 0

            if (q.question_type === 'multiple_choice' || q.question_type === 'true_false') {
                const correctOptionId = correctOptionsMap[q.id]
                if (userAnswer && userAnswer === correctOptionId) {
                    isCorrect = true
                    pointsEarned = Number(q.points)
                }
            }

            totalScore += pointsEarned

            if (userAnswer) {
                await sql`
                    INSERT INTO user_answers (
                        session_id, question_id, selected_option_id, answer_text, is_correct, points_earned
                    )
                    VALUES (
                        ${sessionId}, 
                        ${q.id}, 
                        ${(q.question_type === 'multiple_choice' || q.question_type === 'true_false') ? userAnswer : null},
                        ${(q.question_type !== 'multiple_choice' && q.question_type !== 'true_false') ? userAnswer : null},
                        ${isCorrect},
                        ${pointsEarned}
                    )
                    ON CONFLICT (session_id, question_id) 
                    DO UPDATE SET 
                        selected_option_id = EXCLUDED.selected_option_id,
                        answer_text = EXCLUDED.answer_text,
                        is_correct = EXCLUDED.is_correct,
                        points_earned = EXCLUDED.points_earned,
                        updated_at = NOW()
                `
            }
        }

        const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0

        await sql`
            UPDATE exam_sessions
            SET 
                status = 'completed',
                completed_at = NOW(),
                score = ${percentage},
                max_score = ${maxScore},
                answers = ${JSON.stringify(answers)}
            WHERE id = ${sessionId}
        `

        return NextResponse.json({
            success: true,
            score: percentage,
            maxScore: maxScore,
            status: 'completed'
        })

    } catch (error: any) {
        console.error('Submit exam error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
