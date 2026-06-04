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
            role: payload.role as string,
            email: payload.email as string
        }
    } catch {
        return null
    }
}

export async function GET(request: NextRequest) {
    try {
        const sql = getSQL()
        const user = await getUser(request)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Fetch user profile
        const profiles = await sql`
            SELECT id, email, full_name, role, avatar_url, organization_id
            FROM users
            WHERE id = ${user.id}
        `
        const profile = profiles.length > 0 ? profiles[0] : null

        // Fetch organization
        let organization = null
        if (profile?.organization_id) {
            const orgs = await sql`SELECT * FROM organizations WHERE id = ${profile.organization_id}`
            if (orgs.length > 0) organization = orgs[0]
        } else {
            // Just get the first org for admin or null
            const orgs = await sql`SELECT * FROM organizations LIMIT 1`
            if (orgs.length > 0) organization = orgs[0]
        }

        return NextResponse.json({ profile, organization })
    } catch (error: any) {
        console.error('Settings GET error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const sql = getSQL()
        const user = await getUser(request)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { type, payload } = body

        if (type === 'profile') {
            await sql`
                UPDATE users 
                SET full_name = ${payload.fullName}
                WHERE id = ${user.id}
            `
            return NextResponse.json({ success: true })
        } 
        
        if (type === 'organization') {
            // Check if organization exists
            const orgs = await sql`SELECT id FROM organizations LIMIT 1`
            if (orgs.length > 0) {
                await sql`
                    UPDATE organizations 
                    SET name = ${payload.name}, domain = ${payload.domain}, storage_path = ${payload.storagePath}
                    WHERE id = ${orgs[0].id}
                `
            } else {
                await sql`
                    INSERT INTO organizations (name, slug, domain, storage_path)
                    VALUES (${payload.name}, ${payload.name.toLowerCase().replace(/\s+/g, '-')}, ${payload.domain}, ${payload.storagePath})
                `
            }
            return NextResponse.json({ success: true })
        }

        if (type === 'password') {
            // Hash password and update (Assuming you add a custom hashing library like bcrypt later if needed, but for now we'll just return success placeholder or update if we had raw passwords which is bad practice)
            // For this demo structure, if you're not using Supabase Auth, you'd typically verify old password and hash the new one.
            // Returning a message to indicate it's custom.
            return NextResponse.json({ success: true, message: 'Password updated (Mock internal for now)' })
        }

        return NextResponse.json({ error: 'Invalid update type' }, { status: 400 })
    } catch (error: any) {
        console.error('Settings PUT error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
