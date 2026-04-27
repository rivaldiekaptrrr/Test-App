'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    subscribeToNotifications,
    formatNotificationTime,
    getNotificationIcon,
    type Notification
} from '@/lib/services/notificationService'

interface NotificationBellProps {
    userId: string
}

export function NotificationBell({ userId }: NotificationBellProps) {
    const router = useRouter()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Fetch notifications
    const fetchNotifications = async () => {
        setLoading(true)
        const data = await getNotifications(userId)
        setNotifications(data)
        const count = await getUnreadCount(userId)
        setUnreadCount(count)
        setLoading(false)
    }

    useEffect(() => {
        fetchNotifications()

        // Subscribe to real-time notifications
        const unsubscribe = subscribeToNotifications(userId, (newNotification) => {
            setNotifications(prev => [newNotification, ...prev])
            setUnreadCount(prev => prev + 1)

            // Show browser notification if supported
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(newNotification.title, {
                    body: newNotification.message,
                    icon: '/favicon.ico'
                })
            }
        })

        return () => unsubscribe()
    }, [userId])

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await markAsRead(notification.id)
            setUnreadCount(prev => Math.max(0, prev - 1))
            setNotifications(prev =>
                prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
            )
        }

        setIsOpen(false)

        // Navigate to link if exists
        if (notification.link) {
            router.push(notification.link)
        }
    }

    const handleMarkAllRead = async () => {
        await markAllAsRead(userId)
        setUnreadCount(0)
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 text-slate-400 hover:text-white bg-[#1F2937] hover:bg-[#374151] rounded-full transition-all border border-white/5 hover:border-white/20 shadow-lg"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-rose-500/50 animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Notification Panel */}
                    <div className="absolute right-0 mt-2 w-96 max-h-[32rem] bg-[#0F1623] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 bg-[#131B2D] flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white">Notifications</h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {unreadCount} unread
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllRead}
                                        className="px-3 py-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors flex items-center gap-1 border border-blue-500/20"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-[26rem] overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center text-slate-400">
                                    Loading...
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                    <p className="text-slate-400 text-sm">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {notifications.map((notification) => (
                                        <button
                                            key={notification.id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`w-full text-left p-4 hover:bg-white/[0.02] transition-colors ${!notification.read ? 'bg-blue-500/5' : ''
                                                }`}
                                        >
                                            <div className="flex gap-3">
                                                <div className="flex-shrink-0 text-2xl">
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <h4 className={`text-sm font-semibold ${!notification.read ? 'text-white' : 'text-slate-300'
                                                            }`}>
                                                            {notification.title}
                                                        </h4>
                                                        {!notification.read && (
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-400 line-clamp-2 mb-1.5">
                                                        {notification.message}
                                                    </p>
                                                    <span className="text-xs text-slate-500">
                                                        {formatNotificationTime(notification.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-white/5 bg-[#0B1121]/50 text-center">
                                <button
                                    onClick={() => {
                                        setIsOpen(false)
                                        // Could add a dedicated notifications page
                                    }}
                                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                                >
                                    View all notifications
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
