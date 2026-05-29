import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'
import { jwtVerify } from 'jose'

// Helper to get SQL client safely
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

// Verify JWT and get user
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

// GET /api/exams - List all exams
export async function GET(request: NextRequest) {
    try {
        const sql = getSQL()
        const user = await getUser(request)

        // Get published exams (or all if teacher/admin)
        let exams
        if (user && ['admin', 'teacher', 'hr'].includes(user.role)) {
            exams = await sql`
                SELECT 
                    id, code, title, description, duration, status,
                    proctoring_enabled, camera_required, tab_switch_allowed,
                    start_time, end_time, question_count, created_by, created_at
                FROM exams
                ORDER BY created_at DESC
            `
        } else {
            // For students or unauthenticated users, show only published exams
            exams = await sql`
                SELECT 
                    id, code, title, description, duration, status,
                    proctoring_enabled, camera_required, tab_switch_allowed,
                    start_time, end_time, question_count, created_at
                FROM exams
                WHERE status = 'published'
                ORDER BY created_at DESC
            `
        }

        console.log(`Returning ${exams.length} exams for user ${user?.id}`);
        if (exams.length > 0) {
            console.log('Sample exam ID:', exams[0].id);
        }
        return NextResponse.json({ exams })

    } catch (error: any) {
        console.error('Get exams error:', error.message || error)
        return NextResponse.json(
            { error: 'Failed to fetch exams' },
            { status: 500 }
        )
    }
}

// POST /api/exams - Create new exam
export async function POST(request: NextRequest) {
    try {
        const sql = getSQL()
        const user = await getUser(request)

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        if (!['admin', 'teacher', 'hr'].includes(user.role)) {
            return NextResponse.json(
                { error: 'Only teachers can create exams' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const {
            code,
            title,
            description,
            duration = 60,
            proctoring_enabled = false,
            camera_required = false,
            tab_switch_allowed = 2,
            start_time,
            end_time
        } = body

        if (!code || !title) {
            return NextResponse.json(
                { error: 'Code and title are required' },
                { status: 400 }
            )
        }

        // Check if code already exists
        const existing = await sql`
            SELECT id FROM exams WHERE code = ${code}
        `

        if (existing.length > 0) {
            return NextResponse.json(
                { error: 'Exam code already exists' },
                { status: 400 }
            )
        }

        // Create exam
        const exams = await sql`
            INSERT INTO exams (
                code, title, description, duration, status,
                proctoring_enabled, camera_required, tab_switch_allowed,
                start_time, end_time, created_by
            )
            VALUES (
                ${code}, ${title}, ${description || null}, ${duration}, 'draft',
                ${proctoring_enabled}, ${camera_required}, ${tab_switch_allowed},
                ${start_time || null}, ${end_time || null}, ${user.id}
            )
            RETURNING *
        `

        return NextResponse.json({ exam: exams[0] }, { status: 201 })

    } catch (error: any) {
        console.error('Create exam error:', error.message || error)
        return NextResponse.json(
            { error: 'Failed to create exam' },
            { status: 500 }
        )
    }
}
