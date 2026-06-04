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

// PUT /api/questions/[id] - Update a question
export async function PUT(
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

        const { question_text, question_type, points, explanation, options } = body

        const metadata = JSON.stringify({ explanation: explanation || '' })

        // Update question
        const questions = await sql`
            UPDATE questions SET
                question_text = COALESCE(${question_text ?? null}, question_text),
                question_type = COALESCE(${question_type ?? null}, question_type),
                points = COALESCE(${points ?? null}, points),
                metadata = COALESCE(${metadata ?? null}, metadata)
            WHERE id = ${id}
            RETURNING *
        `
        
        if (questions.length === 0) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 })
        }
        const updatedQuestion = questions[0]

        // Update options if provided
        let newOptions = []
        if (options && options.length > 0) {
            // Delete old options
            await sql`DELETE FROM question_options WHERE question_id = ${id}`
            
            // Insert new ones
            const optionsData = options.map((opt: any, index: number) => ({
                question_id: id,
                option_text: opt.option_text,
                is_correct: opt.is_correct || false,
                option_order: index + 1
            }))

            newOptions = await sql`
                INSERT INTO question_options ${sql(optionsData, 'question_id', 'option_text', 'is_correct', 'option_order')}
                RETURNING *
            `
        }

        updatedQuestion.options = newOptions

        return NextResponse.json({ question: updatedQuestion })

    } catch (error: any) {
        console.error('Update question error:', error)
        return NextResponse.json({ error: error.message || 'Failed to update question' }, { status: 500 })
    }
}

// DELETE /api/questions/[id] - Delete a question
export async function DELETE(
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

        // Get exam_id first to update question count later
        const existing = await sql`SELECT exam_id FROM questions WHERE id = ${id}`
        if (existing.length === 0) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 })
        }
        const examId = existing[0].exam_id

        // Delete question
        await sql`DELETE FROM questions WHERE id = ${id}`

        // Update exam question_count
        await sql`
            UPDATE exams 
            SET question_count = (SELECT COUNT(*) FROM questions WHERE exam_id = ${examId})
            WHERE id = ${examId}
        `

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Delete question error:', error)
        return NextResponse.json({ error: error.message || 'Failed to delete question' }, { status: 500 })
    }
}
