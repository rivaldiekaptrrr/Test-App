import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'
import { SignJWT } from 'jose'

// Create SQL client lazily to ensure env vars are loaded
function getSQL() {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
        throw new Error('DATABASE_URL is not set')
    }
    return postgres(databaseUrl)
}

function getJWTSecret() {
    const secret = process.env.JWT_SECRET || 'fallback-secret-min-32-characters!'
    return new TextEncoder().encode(secret)
}

export async function POST(request: NextRequest) {
    try {
        const sql = getSQL()
        const JWT_SECRET = getJWTSecret()

        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        console.log('Attempting login for:', email)

        // First check if user exists
        const checkUser = await sql`
            SELECT id, email, password_hash, full_name, avatar_url, role, 
                   organization_id, is_active, created_at
            FROM users
            WHERE email = ${email}
            AND is_active = true
        `

        if (checkUser.length === 0) {
            console.log('User not found:', email)
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        const user = checkUser[0]

        // Verify password using database function
        const passwordCheck = await sql`
            SELECT verify_password(${password}, ${user.password_hash}) as valid
        `

        if (!passwordCheck[0]?.valid) {
            console.log('Password invalid for:', email)
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        console.log('Login successful for:', email)

        // Update last login
        await sql`
            UPDATE users 
            SET last_login_at = NOW() 
            WHERE id = ${user.id}
        `

        // Generate JWT token
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        const token = await new SignJWT({
            sub: user.id,
            email: user.email,
            role: user.role
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('7d')
            .sign(JWT_SECRET)

        // Store session in database (simplified - no crypt for token)
        await sql`
            INSERT INTO auth_sessions (user_id, token_hash, expires_at, ip_address, user_agent)
            VALUES (
                ${user.id},
                ${token.slice(0, 50)},
                ${expiresAt.toISOString()},
                ${request.headers.get('x-forwarded-for') || 'unknown'},
                ${request.headers.get('user-agent')?.slice(0, 200) || 'unknown'}
            )
        `

        // Return session
        return NextResponse.json({
            session: {
                user: {
                    id: user.id,
                    email: user.email,
                    full_name: user.full_name,
                    avatar_url: user.avatar_url,
                    role: user.role,
                    organization_id: user.organization_id,
                    is_active: user.is_active,
                    created_at: user.created_at
                },
                token,
                expires_at: expiresAt.toISOString()
            }
        })

    } catch (error: any) {
        console.error('Login error:', error.message || error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
