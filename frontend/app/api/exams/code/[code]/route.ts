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
            email: payload.email as string,
            role: payload.role as string
        }
    } catch {
        return null
    }
}

export async function GET(request: NextRequest, props: { params: Promise<{ code: string }> }) {
    const params = await props.params;
    try {
        const sql = getSQL()
        const user = await getUser(request)

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { code } = params

        // Check if user already completed this exam
        const existingSession = await sql`
            SELECT id, score, completed_at
            FROM exam_sessions
            WHERE user_id = ${user.id}
            AND exam_id = (SELECT id FROM exams WHERE code = ${code})
            AND status = 'completed'
        `

        if (existingSession.length > 0) {
            return NextResponse.json({
                error: 'Exam already completed',
                score: existingSession[0].score
            }, { status: 403 })
        }

        // Get exam details
        const exams = await sql`
            SELECT 
                e.id, 
                e.code, 
                e.title, 
                e.description, 
                e.duration, 
                e.question_count, 
                e.proctoring_enabled,
                e.status,
                u.full_name as instructor_name
            FROM exams e
            LEFT JOIN users u ON e.created_by = u.id
            WHERE e.code = ${code}
            AND e.status = 'published'
        `

        if (exams.length === 0) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        }

        const exam = exams[0]

        // Extract rules (simple logic for now, similar to previous frontend logic)
        let rules = [
            'Full screen mode is mandatory',
            'Tab switching is strictly prohibited',
            'No external devices or materials allowed'
        ]

        if (exam.proctoring_enabled) {
            rules.push('Webcam must be active at all times')
        }

        return NextResponse.json({
            exam: {
                ...exam,
                instructor: exam.instructor_name || 'N/A',
                rules
            }
        })

    } catch (error: any) {
        console.error('Get exam details error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
