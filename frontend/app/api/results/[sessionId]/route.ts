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
        return { id: payload.sub as string, role: payload.role as string }
    } catch {
        return null
    }
}

export async function GET(request: NextRequest, props: { params: Promise<{ sessionId: string }> }) {
    const params = await props.params;
    try {
        const sql = getSQL()
        const user = await getUser(request)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const sessionId = params.sessionId

        // 1. Get Session Details
        const sessions = await sql`
            SELECT s.id, s.exam_id, s.user_id, s.score, s.answers as session_answers_json, e.title, e.code as exam_code
            FROM exam_sessions s
            JOIN exams e ON s.exam_id = e.id
            WHERE s.id = ${sessionId}
        `

        if (sessions.length === 0) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        const session = sessions[0]

        // Access Control
        // User must be the owner of the session OR a teacher/admin (who owns the exam?)
        // For now, let's allow if user_id matches OR if user is teacher/admin (simplified)
        // Ideally we check if user is the teacher of this exam.
        if (session.user_id !== user.id) {
            // Check if user is teacher of the exam
            const examOwners = await sql`SELECT created_by FROM exams WHERE id = ${session.exam_id}`
            if (examOwners.length === 0 || examOwners[0].created_by !== user.id) {
                return NextResponse.json({ error: 'Access denied' }, { status: 403 })
            }
        }

        // 2. Fetch Questions
        const questions = await sql`
            SELECT id, question_text, question_type, points, order_index, explanation 
            FROM questions 
            WHERE exam_id = ${session.exam_id}
            ORDER BY order_index
        `

        const questionIds = questions.map(q => q.id)

        // 3. Fetch Options
        let optionsMap: Record<string, any[]> = {}
        if (questionIds.length > 0) {
            const options = await sql`
                SELECT id, question_id, option_text, is_correct, order_index
                FROM question_options 
                WHERE question_id = ANY(${questionIds})
                ORDER BY order_index
            `
            options.forEach(opt => {
                if (!optionsMap[opt.question_id]) optionsMap[opt.question_id] = []
                optionsMap[opt.question_id].push(opt)
            })
        }

        // 4. Fetch Student Answers (Granular)
        const studentAnswers = await sql`
            SELECT question_id, selected_option_id, answer_text, is_correct, points_earned
            FROM student_answers
            WHERE session_id = ${sessionId}
        `
        const answersMap = new Map()
        studentAnswers.forEach(a => answersMap.set(a.question_id, a))

        // 5. Combine Data
        const detailedQuestions = questions.map(q => {
            const answer = answersMap.get(q.id)
            const qOptions = optionsMap[q.id] || []

            // Determine selected option text
            let selectedOptionText = null
            if (answer && answer.selected_option_id) {
                const selectedOpt = qOptions.find((o: any) => o.id === answer.selected_option_id)
                if (selectedOpt) selectedOptionText = selectedOpt.option_text
            }

            // Determine correct option text
            const correctOption = qOptions.find((o: any) => o.is_correct)

            return {
                question_id: q.id,
                question_text: q.question_text,
                question_type: q.question_type,
                points: q.points,
                order_number: q.order_index || q.order_number, // Handle inconsistency if any
                student_answer: answer ? (answer.answer_text || null) : null, // Essay/Short answer text
                selected_option_text: selectedOptionText,
                is_correct: answer ? answer.is_correct : null,
                points_earned: answer ? answer.points_earned : 0,
                correct_option_text: correctOption ? correctOption.option_text : null,
                explanation: q.explanation,
                options: qOptions.map((opt: any) => ({
                    id: opt.id,
                    option_text: opt.option_text,
                    is_correct: opt.is_correct,
                    order_number: opt.order_index
                }))
            }
        })

        return NextResponse.json({
            examTitle: session.title,
            score: session.score,
            questions: detailedQuestions
        })

    } catch (error: any) {
        console.error('Fetch results error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
