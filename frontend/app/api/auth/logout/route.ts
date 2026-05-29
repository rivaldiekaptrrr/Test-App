import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'
import { jwtVerify } from 'jose'

const sql = postgres(process.env.DATABASE_URL!)
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-min-32-characters!')

export async function POST(request: NextRequest) {
    try {
        // Get token from Authorization header
        const authHeader = request.headers.get('authorization')
        const token = authHeader?.replace('Bearer ', '')

        if (token) {
            try {
                // Verify token
                const { payload } = await jwtVerify(token, JWT_SECRET)
                const userId = payload.sub as string

                // Delete session from database
                await sql`
                    DELETE FROM auth_sessions
                    WHERE user_id = ${userId}
                `
            } catch {
                // Token invalid, still return success
            }
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Logout error:', error)
        return NextResponse.json({ success: true }) // Always return success for logout
    }
}
