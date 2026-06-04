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

// GET /api/exams/code/[code] - Get exam by code (used for joining)
export async function GET(
    request: NextRequest,
    { params }: { params: { code: string } }
) {
    try {
        const sql = getSQL()
        const user = await getUser(request)

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { code } = await params

        // Fetch exam by code
        const exams = await sql`
            SELECT 
                id, code, title, description, duration, status,
                proctoring_enabled, camera_required, tab_switch_allowed,
                start_time, end_time, question_count, created_by, created_at
            FROM exams
            WHERE code = ${code}
        `

        if (exams.length === 0) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        }

        const exam = exams[0]

        // Only allow non-admins to see published exams
        if (exam.status !== 'published' && user.role !== 'admin') {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        }

        // Check if the user has already completed this exam
        const sessions = await sql`
            SELECT status, score FROM exam_sessions 
            WHERE exam_id = ${exam.id} AND user_id = ${user.id}
        `

        if (sessions.length > 0) {
            const session = sessions[0]
            if (session.status === 'completed') {
                return NextResponse.json(
                    { error: 'Exam already completed', score: session.score }, 
                    { status: 403 }
                )
            }
        }

        return NextResponse.json({ exam })

    } catch (error: any) {
        console.error('Get exam by code error:', error)
        return NextResponse.json({ error: error.message || 'Failed to fetch exam' }, { status: 500 })
    }
}
