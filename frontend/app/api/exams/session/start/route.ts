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

        const { examCode } = await request.json()
        console.log(`Starting session for user ${user.id}, exam code: ${examCode}`);

        // Get Exam ID
        const exams = await sql`SELECT id FROM exams WHERE code = ${examCode}`
        if (exams.length === 0) {
            console.log(`Exam not found for code: ${examCode}`);
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        }
        const examId = exams[0].id

        // Check for existing active session
        const existingSession = await sql`
            SELECT id FROM exam_sessions 
            WHERE user_id = ${user.id} AND exam_id = ${examId} AND status IN ('in_progress', 'not_started')
        `

        // Create new session if not exists
        let sessionId
        if (existingSession.length > 0) {
            sessionId = existingSession[0].id
            console.log(`Reusing existing session: ${sessionId}`);

            // Update status if it was not_started
            await sql`
                UPDATE exam_sessions 
                SET status = 'in_progress', started_at = COALESCE(started_at, NOW()) 
                WHERE id = ${sessionId}
            `
        } else {
            console.log(`Creating new session for exam ${examId}`);
            const result = await sql`
                INSERT INTO exam_sessions (exam_id, user_id, exam_code, status, started_at)
                VALUES (${examId}, ${user.id}, ${examCode}, 'in_progress', NOW())
                RETURNING id
            `
            sessionId = result[0].id
            console.log(`New session created: ${sessionId}`);
        }

        return NextResponse.json({ sessionId, status: 'started' })

    } catch (error: any) {
        console.error('Start exam session error:', error)
        return NextResponse.json({ error: error.message || 'Failed to start session' }, { status: 500 })
    }
}
