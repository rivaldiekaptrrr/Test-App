import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { SignJWT } from 'jose'

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

export async function POST(request: NextRequest) {
    try {
        const sql = getSQL()
        const { email, password, full_name, role } = await request.json()

        if (!email || !password || !full_name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Validate Role (only allow student/teacher)
        const validRoles = ['student', 'teacher']
        const userRole = validRoles.includes(role) ? role : 'student'

        // Check if user exists
        const existingUsers = await sql`SELECT id FROM users WHERE email = ${email}`
        if (existingUsers.length > 0) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 })
        }

        // Hash Password (using pgcrypto extension)
        // We assume pgcrypto is enabled (it is by default in complete_setup.sql)

        // Insert User
        // Note: organization_id is required by schema but we don't have one in signup flow yet.
        // We will fetch the 'Demo Organization' or create a default one if null not allowed, 
        // OR we updated schema to make it nullable?
        // Let's check schema quick: organization_id UUID REFERENCES...
        // Usually we'd have a default organization for self-signups.
        // Let's grab the first organization for now (Demo University).
        const orgs = await sql`SELECT id FROM organizations LIMIT 1`
        const orgId = orgs.length > 0 ? orgs[0].id : null

        if (!orgId) {
            // Fallback if no org exists (rare case if seeded properly)
            return NextResponse.json({ error: 'No organization found to join' }, { status: 500 })
        }

        const newUsers = await sql`
            INSERT INTO users (
                email, 
                password_hash, 
                full_name, 
                role, 
                organization_id, 
                email_verified, 
                is_active
            )
            VALUES (
                ${email}, 
                crypt(${password}, gen_salt('bf', 10)), 
                ${full_name}, 
                ${userRole}, 
                ${orgId}, 
                true, -- Auto verify for simple flow
                true
            )
            RETURNING id, email, role, full_name
        `

        const user = newUsers[0]

        // Create Session Token
        const token = await new SignJWT({
            sub: user.id,
            email: user.email,
            role: user.role
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(getJWTSecret())

        // Set Cookie
        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            },
            token
        })

        response.cookies.set({
            name: 'auth_token',
            value: token,
            httpOnly: true,
            path: '/',
            maxAge: 86400, // 24 hours
        })

        return response

    } catch (error: any) {
        console.error('Signup error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
