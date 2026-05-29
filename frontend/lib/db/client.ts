// Check if running in demo mode
export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

// Database URL (server-side only typically, but kept for reference if needed)
const databaseUrl = process.env.DATABASE_URL || ''

// Types
export interface User {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    role: 'admin' | 'teacher' | 'hr' | 'student' | 'applicant'
    organization_id: string | null
    is_active: boolean
    created_at: string
}

export interface Session {
    user: User
    token: string
    expires_at: string
}

// Demo mode mock user
const demoUsers: Record<string, User> = {
    'admin@demo.com': {
        id: '00000000-0000-0000-0000-000000000010',
        email: 'admin@demo.com',
        full_name: 'Admin Demo',
        avatar_url: null,
        role: 'admin',
        organization_id: '00000000-0000-0000-0000-000000000001',
        is_active: true,
        created_at: new Date().toISOString()
    },
    'teacher@demo.com': {
        id: '00000000-0000-0000-0000-000000000020',
        email: 'teacher@demo.com',
        full_name: 'Teacher Demo',
        avatar_url: null,
        role: 'teacher',
        organization_id: '00000000-0000-0000-0000-000000000001',
        is_active: true,
        created_at: new Date().toISOString()
    },
    'student@demo.com': {
        id: '00000000-0000-0000-0000-000000000030',
        email: 'student@demo.com',
        full_name: 'Student Demo',
        avatar_url: null,
        role: 'student',
        organization_id: '00000000-0000-0000-0000-000000000001',
        is_active: true,
        created_at: new Date().toISOString()
    }
}

// Session storage key
const SESSION_KEY = 'exam_session'

// Get current session from localStorage
export function getStoredSession(): Session | null {
    if (typeof window === 'undefined') return null
    
    const stored = localStorage.getItem(SESSION_KEY)
    if (!stored) return null
    
    try {
        const session = JSON.parse(stored) as Session
        // Check if expired
        if (new Date(session.expires_at) < new Date()) {
            localStorage.removeItem(SESSION_KEY)
            return null
        }
        return session
    } catch {
        localStorage.removeItem(SESSION_KEY)
        return null
    }
}

// Store session in localStorage
export function storeSession(session: Session): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

// Clear session
export function clearSession(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(SESSION_KEY)
}

// Get current user from session
export function getCurrentUser(): User | null {
    const session = getStoredSession()
    return session?.user || null
}

// Get auth token
export function getAuthToken(): string {
    const session = getStoredSession()
    return session?.token || ''
}

// Demo mode helper
export async function getSessionOrDemo(): Promise<{ data: { session: Session | null }, error: Error | null }> {
    if (isDemoMode) {
        const session = getStoredSession()
        return {
            data: { session },
            error: null
        }
    }
    
    const session = getStoredSession()
    return {
        data: { session },
        error: null
    }
}

// Login function (calls API)
export async function login(email: string, password: string): Promise<{ user: User | null, error: string | null }> {
    if (isDemoMode) {
        // Demo mode - check against mock users
        const user = demoUsers[email]
        if (user && password === 'Demo123!') {
            const session: Session = {
                user,
                token: 'demo-token-' + Date.now(),
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            }
            storeSession(session)
            return { user, error: null }
        }
        return { user: null, error: 'Invalid email or password' }
    }
    
    // Production mode - call API
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        
        const data = await response.json()
        
        if (!response.ok) {
            return { user: null, error: data.error || 'Login failed' }
        }
        
        storeSession(data.session)
        return { user: data.session.user, error: null }
    } catch (error) {
        return { user: null, error: 'Network error. Please try again.' }
    }
}

// Signup function (calls API)
export async function signup(email: string, password: string, fullName: string): Promise<{ user: User | null, error: string | null }> {
    if (isDemoMode) {
        return { user: null, error: 'Signup disabled in demo mode' }
    }
    
    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, fullName })
        })
        
        const data = await response.json()
        
        if (!response.ok) {
            return { user: null, error: data.error || 'Signup failed' }
        }
        
        storeSession(data.session)
        return { user: data.session.user, error: null }
    } catch (error) {
        return { user: null, error: 'Network error. Please try again.' }
    }
}

// Logout function
export async function logout(): Promise<void> {
    if (!isDemoMode) {
        try {
            await fetch('/api/auth/logout', { method: 'POST' })
        } catch (error) {
            console.error('Logout error:', error)
        }
    }
    clearSession()
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
    return getStoredSession() !== null
}

// Check user role
export function hasRole(roles: string | string[]): boolean {
    const user = getCurrentUser()
    if (!user) return false
    
    const allowedRoles = Array.isArray(roles) ? roles : [roles]
    return allowedRoles.includes(user.role)
}
