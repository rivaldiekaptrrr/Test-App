import { NextRequest, NextResponse } from 'next/server'
import postgres from 'postgres'

function getSQL() {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
        throw new Error('DATABASE_URL is not set')
    }
    return postgres(databaseUrl)
}

export async function GET(request: NextRequest) {
    try {
        const sql = getSQL()

        // Get stats from database
        const [
            examsResult,
            usersResult,
            sessionsResult,
            violationsResult
        ] = await Promise.all([
            sql`SELECT COUNT(*) as count FROM exams`,
            sql`SELECT COUNT(*) as count FROM users WHERE role = 'user'`,
            sql`SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
                FROM exam_sessions`,
            sql`SELECT COUNT(*) as count FROM cheating_logs`
        ])

        const totalExams = parseInt(examsResult[0]?.count || '0')
        const totalParticipants = parseInt(usersResult[0]?.count || '0')
        const totalSessions = parseInt(sessionsResult[0]?.total || '0')
        const activeSessions = parseInt(sessionsResult[0]?.active || '0')
        const completedSessions = parseInt(sessionsResult[0]?.completed || '0')
        const cheatingDetected = parseInt(violationsResult[0]?.count || '0')

        // Calculate completion rate
        const completionRate = totalSessions > 0
            ? Math.round((completedSessions / totalSessions) * 100)
            : 0

        // Get recent exams with stats
        const recentExams = await sql`
            SELECT 
                e.id,
                e.code,
                e.title,
                e.description,
                e.duration,
                e.status,
                e.proctoring_enabled,
                e.question_count,
                e.created_at,
                COUNT(DISTINCT es.user_id) as participants,
                COALESCE(AVG(es.score), 0) as avg_score
            FROM exams e
            LEFT JOIN exam_sessions es ON es.exam_id = e.id
            GROUP BY e.id
            ORDER BY e.created_at DESC
            LIMIT 5
        `

        // Get recent activity
        const recentActivity = await sql`
            SELECT 
                es.id,
                es.status,
                es.score,
                es.violation_count,
                es.completed_at,
                es.created_at,
                u.full_name as user_name,
                u.email as user_email,
                e.title as exam_title
            FROM exam_sessions es
            JOIN users u ON u.id = es.user_id
            JOIN exams e ON e.id = es.exam_id
            ORDER BY COALESCE(es.completed_at, es.created_at) DESC
            LIMIT 10
        `

        return NextResponse.json({
            stats: {
                totalExams,
                activeSessions,
                totalParticipants,
                completionRate,
                cheatingDetected
            },
            recentExams: recentExams.map(exam => ({
                id: exam.id,
                code: exam.code,
                title: exam.title,
                description: exam.description || '',
                duration: exam.duration,
                status: exam.status,
                questions: exam.question_count || 0,
                participants: parseInt(exam.participants) || 0,
                avgScore: Math.round(parseFloat(exam.avg_score) || 0),
                category: 'Development' // Default category
            })),
            recentActivity: recentActivity.map((activity, idx) => ({
                id: idx + 1,
                type: activity.violation_count > 0 ? 'violation' :
                    activity.status === 'completed' ? 'exam_complete' : 'exam_start',
                user: activity.user_name || activity.user_email?.split('@')[0] || 'Unknown',
                exam: activity.exam_title,
                time: getTimeAgo(activity.completed_at || activity.created_at),
                score: activity.score || 0,
                violation: activity.violation_count > 0 ? 'Rule Violation' : undefined,
                avatar: getInitials(activity.user_name || activity.user_email || 'U')
            }))
        })

    } catch (error: any) {
        console.error('Dashboard stats error:', error.message || error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch dashboard stats' },
            { status: 500 }
        )
    }
}

function getTimeAgo(date: string | Date): string {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}
