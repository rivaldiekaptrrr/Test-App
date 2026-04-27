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
            role: payload.role as string
        }
    } catch {
        return null
    }
}

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const sql = getSQL()
        const user = await getUser(request)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const examId = params.id

        // 1. Verify exam ownership or admin status
        const exams = await sql`SELECT id, created_by FROM exams WHERE id = ${examId}`
        if (exams.length === 0) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        }

        if (user.role !== 'admin' && String(exams[0].created_by) !== String(user.id)) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        // 2. Fetch Questions (Use question_order from schema)
        const questions = await sql`
            SELECT id, question_text, question_type, points, question_order as "order_number", explanation
            FROM questions 
            WHERE exam_id = ${examId} 
            ORDER BY question_order
        `

        // 3. Fetch Options for all questions (Use option_order from schema)
        const questionIds = questions.map(q => q.id)
        let optionsMap: Record<string, any[]> = {}

        if (questionIds.length > 0) {
            const options = await sql`
                SELECT id, question_id, option_text, is_correct, option_order as "order_number"
                FROM question_options 
                WHERE question_id = ANY(${questionIds})
                ORDER BY option_order
            `
            options.forEach(opt => {
                if (!optionsMap[opt.question_id]) {
                    optionsMap[opt.question_id] = []
                }
                optionsMap[opt.question_id].push(opt)
            })
        }

        const result = questions.map(q => ({
            ...q,
            options: optionsMap[q.id] || []
        }))

        return NextResponse.json({ questions: result })

    } catch (error: any) {
        console.error('Get questions error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const sql = getSQL()
        const user = await getUser(request)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const examId = params.id

        // Check ownership
        const exams = await sql`SELECT created_by FROM exams WHERE id = ${examId}`
        if (exams.length === 0) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        if (user.role !== 'admin' && String(exams[0].created_by) !== String(user.id)) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        const body = await request.json()
        const {
            question_text,
            question_type,
            points,
            order_number, // Matches frontend
            explanation,
            options
        } = body

        // 1. Insert Question
        const questions = await sql`
            INSERT INTO questions (
                exam_id, question_text, question_type, points, question_order, explanation
            )
            VALUES (
                ${examId}, ${question_text}, ${question_type}, ${points}, ${order_number || 0}, ${explanation}
            )
            RETURNING id, question_text, question_type, points, question_order as "order_number", explanation
        `
        const question = questions[0]

        // 2. Insert Options if any
        if (options && options.length > 0) {
            for (const [idx, opt] of options.entries()) {
                await sql`
                    INSERT INTO question_options (
                        question_id, option_text, is_correct, option_order
                    )
                    VALUES (
                        ${question.id}, ${opt.option_text}, ${opt.is_correct}, ${opt.order_number || idx + 1}
                    )
                `
            }
        }

        return NextResponse.json({ success: true, question })

    } catch (error: any) {
        console.error('Create question error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
