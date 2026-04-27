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
        return { id: payload.sub as string }
    } catch {
        return null
    }
}

export async function GET(request: NextRequest) {
    try {
        const sql = getSQL()
        const user = await getUser(request)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Fetch completed sessions for user
        const results = await sql`
            SELECT s.id, s.exam_id, s.score, s.max_score, s.completed_at, e.title, e.code as exam_code
            FROM exam_sessions s
            JOIN exams e ON s.exam_id = e.id
            WHERE s.user_id = ${user.id} AND s.status = 'completed'
            ORDER BY s.completed_at DESC
        `

        return NextResponse.json({ results })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
