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
    if (!token) {
        console.log('No token found in Authorization header');
        return null;
    }
    try {
        const { payload } = await jwtVerify(token, getJWTSecret())
        console.log('Decoded JWT Payload:', payload);
        return {
            id: payload.sub as string,
            role: payload.role as string
        }
    } catch (e: any) {
        console.log(`JWT Verification failed for token ${token.slice(0, 10)}...: ${e.message}`);
        return null
    }
}

// GET Exam Details (by owner)
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const examId = params.id
    console.log('GET Exam Request:', { examId });
    console.log('Headers:', Object.fromEntries(request.headers.entries()));

    try {
        const sql = getSQL()
        const user = await getUser(request)
        if (!user) {
            console.log('Unauthorized request');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log(`Authenticated User: ${user.id} (${user.role})`);

        // Use SELECT * to ensure all fields are returned
        const exams = await sql`
            SELECT * FROM exams 
            WHERE id = ${examId}
        `

        if (exams.length === 0) {
            console.log(`Exam ${examId} not found in database`);
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        }

        const exam = exams[0]
        console.log('Exam Found:', { id: exam.id, created_by: exam.created_by });

        // Verify ownership (unless admin)
        if (user.role !== 'admin' && String(exam.created_by) !== String(user.id)) {
            console.log(`Access denied: User ${user.id} (${user.role}) !== Owner ${exam.created_by}`);
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        return NextResponse.json({ exam })

    } catch (error: any) {
        console.error('API Error in GET /api/exams/[id]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// UPDATE Exam
export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const sql = getSQL()
        const user = await getUser(request)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const examId = params.id
        const body = await request.json()

        // Allowed fields
        const { title, description, duration, status, proctoring_enabled, start_time, end_time } = body

        // Check ownership
        const currentExam = await sql`SELECT created_by FROM exams WHERE id = ${examId}`
        if (currentExam.length === 0) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
        if (currentExam[0].created_by !== user.id) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

        // Update
        const updated = await sql`
            UPDATE exams
            SET 
                title = COALESCE(${title}, title),
                description = COALESCE(${description}, description),
                duration = COALESCE(${duration}, duration),
                status = COALESCE(${status}, status),
                proctoring_enabled = COALESCE(${proctoring_enabled}, proctoring_enabled),
                start_time = COALESCE(${start_time}, start_time),
                end_time = COALESCE(${end_time}, end_time),
                updated_at = NOW()
            WHERE id = ${examId}
            RETURNING *
        `

        return NextResponse.json({ success: true, exam: updated[0] })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
