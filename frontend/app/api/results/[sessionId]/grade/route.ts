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
            role: payload.role as string
        }
    } catch {
        return null
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { sessionId: string } }
) {
    try {
        const sql = getSQL()
        const user = await getUser(request)
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized. Only admins can grade.' }, { status: 401 })
        }

        const { sessionId } = await params
        const body = await request.json()
        const { question_id, points_earned } = body

        if (!question_id || points_earned === undefined) {
            return NextResponse.json({ error: 'Missing question_id or points_earned' }, { status: 400 })
        }

        const points = parseFloat(points_earned)
        const is_correct = points > 0

        // 1. Update user_answers
        // Note: we must use UPSERT if the user_answers row doesn't exist, but it should exist if they submitted the exam.
        // Even if they left it blank, it should have been created, or we can upsert.
        await sql`
            INSERT INTO user_answers (session_id, question_id, points_earned, is_correct)
            VALUES (${sessionId}, ${question_id}, ${points}, ${is_correct})
            ON CONFLICT (session_id, question_id) 
            DO UPDATE SET 
                points_earned = EXCLUDED.points_earned, 
                is_correct = EXCLUDED.is_correct
        `

        // 2. Recalculate total score for the session
        // Get total possible points and total earned points
        const stats = await sql`
            SELECT 
                SUM(q.points) as total_possible,
                SUM(COALESCE(ua.points_earned, 0)) as total_earned
            FROM questions q
            JOIN exam_sessions s ON q.exam_id = s.exam_id
            LEFT JOIN user_answers ua ON q.id = ua.question_id AND ua.session_id = s.id
            WHERE s.id = ${sessionId}
        `

        if (stats.length > 0) {
            const totalPossible = parseFloat(stats[0].total_possible) || 1
            const totalEarned = parseFloat(stats[0].total_earned) || 0
            const percentageScore = (totalEarned / totalPossible) * 100

            // 3. Update exam_sessions score
            await sql`
                UPDATE exam_sessions
                SET score = ${percentageScore}
                WHERE id = ${sessionId}
            `
        }

        return NextResponse.json({ success: true, message: 'Grade updated successfully' })
    } catch (error: any) {
        console.error('Grade update error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
