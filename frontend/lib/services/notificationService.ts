/**
 * Notification Service
 * Handles creating, fetching, and managing user notifications
 */

// @ts-nocheck
import { supabase } from '@/lib/supabase/client'

export interface Notification {
    id: string
    user_id: string
    type: 'exam_published' | 'exam_submitted' | 'exam_graded' | 'exam_deadline_approaching' | 'violation_detected' | 'retake_allowed'
    title: string
    message: string
    link: string | null
    exam_id: string | null
    session_id: string | null
    read: boolean
    read_at: string | null
    created_at: string
}

/**
 * Fetch notifications for current user
 */
export async function getNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    if (!supabase) return []

    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error fetching notifications:', error)
        return []
    }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
    if (!supabase) return 0

    try {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('read', false)

        if (error) throw error
        return count || 0
    } catch (error) {
        console.error('Error fetching unread count:', error)
        return 0
    }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
    if (!supabase) return false

    try {
        const { error } = await supabase
            .from('notifications')
            .update({
                read: true,
                read_at: new Date().toISOString()
            })
            .eq('id', notificationId)

        if (error) throw error
        return true
    } catch (error) {
        console.error('Error marking notification as read:', error)
        return false
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId: string): Promise<boolean> {
    if (!supabase) return false

    try {
        const { error } = await supabase
            .from('notifications')
            .update({
                read: true,
                read_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('read', false)

        if (error) throw error
        return true
    } catch (error) {
        console.error('Error marking all as read:', error)
        return false
    }
}

/**
 * Create notification (server-side only in production)
 * This is a helper for demo mode
 */
export async function createNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    link?: string,
    examId?: string,
    sessionId?: string
): Promise<string | null> {
    if (!supabase) return null

    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                type,
                title,
                message,
                link: link || null,
                exam_id: examId || null,
                session_id: sessionId || null
            })
            .select('id')
            .single()

        if (error) throw error
        return data?.id || null
    } catch (error) {
        console.error('Error creating notification:', error)
        return null
    }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
    if (!supabase) return false

    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId)

        if (error) throw error
        return true
    } catch (error) {
        console.error('Error deleting notification:', error)
        return false
    }
}

/**
 * Subscribe to real-time notifications
 */
export function subscribeToNotifications(
    userId: string,
    onNotification: (notification: Notification) => void
) {
    if (!supabase) return () => { }

    const channel = supabase
        .channel('notifications')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            },
            (payload) => {
                onNotification(payload.new as Notification)
            }
        )
        .subscribe()

    // Return cleanup function
    return () => {
        if (supabase) {
            supabase.removeChannel(channel)
        }
    }
}

/**
 * Format notification time (relative)
 */
export function formatNotificationTime(createdAt: string): string {
    const now = new Date()
    const created = new Date(createdAt)
    const diffMs = now.getTime() - created.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

    return created.toLocaleDateString()
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: Notification['type']): string {
    switch (type) {
        case 'exam_published':
            return '📚'
        case 'exam_submitted':
            return '✅'
        case 'exam_graded':
            return '📊'
        case 'exam_deadline_approaching':
            return '⏰'
        case 'violation_detected':
            return '⚠️'
        case 'retake_allowed':
            return '🔄'
        default:
            return '🔔'
    }
}
