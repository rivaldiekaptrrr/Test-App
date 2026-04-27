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

// DELETE Question
export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const sql = getSQL()
        const user = await getUser(request)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const questionId = params.id

        // Check ownership via exam
        const questions = await sql`SELECT exam_id FROM questions WHERE id = ${questionId}`
        if (questions.length === 0) return NextResponse.json({ error: 'Question not found' }, { status: 404 })

        const examId = questions[0].exam_id

        // Check if user owns the exam or is admin
        const exams = await sql`SELECT created_by FROM exams WHERE id = ${examId}`
        if (exams.length === 0) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })

        if (user.role !== 'admin' && String(exams[0].created_by) !== String(user.id)) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        await sql`DELETE FROM questions WHERE id = ${questionId}`

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Delete question error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// UPDATE Question
export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const sql = getSQL()
        const user = await getUser(request)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const questionId = params.id
        const body = await request.json()
        const {
            question_text,
            question_type,
            points,
            explanation,
            options
        } = body

        // Check ownership
        const questions = await sql`SELECT exam_id FROM questions WHERE id = ${questionId}`
        if (questions.length === 0) return NextResponse.json({ error: 'Question not found' }, { status: 404 })
        const examId = questions[0].exam_id

        const exams = await sql`SELECT created_by FROM exams WHERE id = ${examId}`
        if (exams.length === 0) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })

        if (user.role !== 'admin' && String(exams[0].created_by) !== String(user.id)) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        // Update Question
        await sql`
            UPDATE questions
            SET 
                question_text = ${question_text},
                question_type = ${question_type},
                points = ${points},
                explanation = ${explanation},
                updated_at = NOW()
            WHERE id = ${questionId}
        `

        // Update Options
        if (options && options.length > 0) {
            // Delete existing
            await sql`DELETE FROM question_options WHERE question_id = ${questionId}`

            // Insert new (use option_order from schema)
            for (const [idx, opt] of options.entries()) {
                await sql`
                    INSERT INTO question_options (
                        question_id, option_text, is_correct, option_order
                    )
                    VALUES (
                        ${questionId}, ${opt.option_text}, ${opt.is_correct}, ${opt.order_number || idx + 1}
                    )
                `
            }
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Update question error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
