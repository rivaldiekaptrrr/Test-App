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

// GET /api/exams/questions/[id] - Get all questions for an exam
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

        // Fetch questions
        const questions = await sql`
            SELECT * FROM questions 
            WHERE exam_id = ${id}
            ORDER BY question_order ASC
        `

        // Fetch options if any
        if (questions.length > 0) {
            const qIds = questions.map(q => q.id)
            const options = await sql`
                SELECT * FROM question_options 
                WHERE question_id = ANY(${qIds})
                ORDER BY option_order ASC
            `
            
            // Attach options to questions
            for (let q of questions) {
                // Remove correct answers if user is not admin
                q.options = options
                    .filter(opt => opt.question_id === q.id)
                    .map(opt => {
                        if (user.role !== 'admin') {
                            const { is_correct, ...rest } = opt;
                            return rest;
                        }
                        return opt;
                    });
            }
        }

        return NextResponse.json({ questions })

    } catch (error: any) {
        console.error('Get questions error:', error)
        return NextResponse.json({ error: error.message || 'Failed to fetch questions' }, { status: 500 })
    }
}

// POST /api/exams/questions/[id] - Create a new question for an exam
export async function POST(
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
        const body = await request.json()

        const { question_text, question_type, points, explanation, order_index, options } = body

        const metadata = JSON.stringify({ explanation: explanation || '' })

        // Auto-calculate next question_order
        const orderResult = await sql`
            SELECT COALESCE(MAX(question_order), -1) + 1 AS next_order FROM questions WHERE exam_id = ${id}
        `
        const nextOrder = order_index ?? orderResult[0].next_order

        // Insert question
        const questions = await sql`
            INSERT INTO questions (exam_id, question_text, question_type, points, metadata, question_order)
            VALUES (${id}, ${question_text}, ${question_type}, ${points}, ${metadata}, ${nextOrder})
            RETURNING *
        `
        const newQuestion = questions[0]

        // Insert options if provided
        let newOptions = []
        if (options && options.length > 0) {
            const optionsData = options.map((opt: any) => ({
                question_id: newQuestion.id,
                option_text: opt.option_text,
                is_correct: opt.is_correct || false,
                option_order: opt.option_order || 1
            }))

            newOptions = await sql`
                INSERT INTO question_options ${sql(optionsData, 'question_id', 'option_text', 'is_correct', 'option_order')}
                RETURNING *
            `
        }

        newQuestion.options = newOptions

        // Update exam question_count
        await sql`
            UPDATE exams 
            SET question_count = (SELECT COUNT(*) FROM questions WHERE exam_id = ${id})
            WHERE id = ${id}
        `

        return NextResponse.json({ question: newQuestion }, { status: 201 })

    } catch (error: any) {
        console.error('Create question error:', error)
        return NextResponse.json({ error: error.message || 'Failed to create question' }, { status: 500 })
    }
}
