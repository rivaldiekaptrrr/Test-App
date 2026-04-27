'use client'

import { useEffect, useState, useCallback } from 'react'
import { logViolation } from '@/lib/api/golang-client'
import { getAuthToken } from '@/lib/db/client'

interface TabTrackerProps {
    sessionId: string
    maxSwitches: number
    enabled?: boolean
    onBlocked?: () => void
    onViolation?: (count: number) => void
}

export function TabTracker({
    sessionId,
    maxSwitches,
    enabled = true,
    onBlocked,
    onViolation
}: TabTrackerProps) {
    const [switchCount, setSwitchCount] = useState(0)
    const [isBlocked, setIsBlocked] = useState(false)

    const handleViolation = useCallback(async (type: 'tab_switch' | 'window_blur') => {
        if (!enabled || isBlocked) return

        const newCount = switchCount + 1
        setSwitchCount(newCount)
        onViolation?.(newCount)

        try {
            // Get auth token (works in both demo and production mode)
            const token = await getAuthToken()

            // Log to backend (in demo mode, this just logs to console)
            const result = await logViolation(
                sessionId,
                type,
                {
                    count: newCount,
                    timestamp: new Date().toISOString(),
                    max_allowed: maxSwitches
                },
                token
            )

            console.warn(`${type} detected! Count: ${newCount}/${maxSwitches}`)

            // Check if should block
            if (result.auto_blocked || newCount >= maxSwitches) {
                setIsBlocked(true)
                onBlocked?.()

                // Optionally submit exam automatically
                alert('Exam terminated due to excessive tab switching!')
            }
        } catch (error) {
            console.error('Failed to log violation:', error)
        }
    }, [sessionId, switchCount, maxSwitches, enabled, isBlocked, onBlocked, onViolation])

    useEffect(() => {
        if (!enabled || maxSwitches === 0) return

        // Track visibility change (tab switch)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleViolation('tab_switch')
            }
        }

        // Track window blur (switching windows)
        const handleWindowBlur = () => {
            handleViolation('window_blur')
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('blur', handleWindowBlur)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('blur', handleWindowBlur)
        }
    }, [enabled, maxSwitches, handleViolation])

    // Prevent right-click
    useEffect(() => {
        if (!enabled) return

        const preventContextMenu = (e: MouseEvent) => {
            e.preventDefault()
        }

        document.addEventListener('contextmenu', preventContextMenu)

        return () => {
            document.removeEventListener('contextmenu', preventContextMenu)
        }
    }, [enabled])

    // Prevent copy-paste
    useEffect(() => {
        if (!enabled) return

        const preventCopyPaste = async (e: ClipboardEvent) => {
            e.preventDefault()

            // Log attempt (works in demo mode too)
            const token = await getAuthToken()
            await logViolation(
                sessionId,
                'copy_paste_attempt',
                { action: e.type, timestamp: new Date().toISOString() },
                token
            )

            console.warn('Copy/paste disabled during exam')
        }

        document.addEventListener('copy', preventCopyPaste)
        document.addEventListener('paste', preventCopyPaste)
        document.addEventListener('cut', preventCopyPaste)

        return () => {
            document.removeEventListener('copy', preventCopyPaste)
            document.removeEventListener('paste', preventCopyPaste)
            document.removeEventListener('cut', preventCopyPaste)
        }
    }, [enabled, sessionId])

    if (!enabled || maxSwitches === 0) return null

    return (
        <div className="fixed top-4 right-4 z-50">
            <div className={`px-4 py-2 rounded-lg shadow-lg font-medium text-sm ${isBlocked
                ? 'bg-red-500 text-white'
                : switchCount >= maxSwitches * 0.7
                    ? 'bg-orange-500 text-white'
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                }`}>
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>
                        {isBlocked
                            ? 'EXAM BLOCKED'
                            : `Tab Switches: ${switchCount}/${maxSwitches}`
                        }
                    </span>
                </div>

                {!isBlocked && switchCount > 0 && (
                    <p className="text-xs mt-1 opacity-90">
                        {maxSwitches - switchCount} warning{maxSwitches - switchCount !== 1 ? 's' : ''} remaining
                    </p>
                )}
            </div>
        </div>
    )
}
