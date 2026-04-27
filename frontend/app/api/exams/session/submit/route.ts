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

        // 3. Calculate Score using Promise.all for async inserts
        let totalScore = 0
        let maxScore = 0

        // Prepare student_answers inserts
        // We'll iterate questions to ensure we grade everything
        for (const q of questions) {
            // maxScore += parseFloat(q.points)
            maxScore += Number(q.points)

            const userAnswer = answers[q.id]
            let isCorrect = false
            let pointsEarned = 0

            // Grading Logic
            if (q.question_type === 'multiple_choice' || q.question_type === 'true_false') {
                const correctOptionId = correctOptionsMap[q.id]
                if (userAnswer && userAnswer === correctOptionId) {
                    isCorrect = true
                    pointsEarned = Number(q.points)
                }
            }
            // For essay/short_answer, we might need manual grading or simple string match
            // Creating a simple auto-grade for short answer could be exact string match if we had the answer text
            // For now, only MC/TF are auto-graded. Others get 0 points pending manual review (conceptually)

            totalScore += pointsEarned

            // Insert into student_answers (or update if exists)
            // Using ON CONFLICT to handle re-submissions if necessary, though logic is one-time submit mostly
            if (userAnswer) {
                await sql`
                    INSERT INTO student_answers (
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

        // Calculate Percentage
        const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0

        // 4. Update Exam Session
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
