'use client'

import { useEffect, useState } from 'react'

interface ExamTimerProps {
    durationMinutes: number
    startTime: Date
    onTimeUp: () => void
}

export function ExamTimer({ durationMinutes, startTime, onTimeUp }: ExamTimerProps) {
    const [timeRemaining, setTimeRemaining] = useState<number>(durationMinutes * 60)
    const [isWarning, setIsWarning] = useState(false)
    const [isCritical, setIsCritical] = useState(false)

    useEffect(() => {
        const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000)

        const interval = setInterval(() => {
            const now = new Date()
            const remaining = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000))

            setTimeRemaining(remaining)

            // Warning at 5 minutes
            if (remaining <= 300 && remaining > 60) {
                setIsWarning(true)
            }

            // Critical at 1 minute
            if (remaining <= 60) {
                setIsCritical(true)
            }

            // Time's up
            if (remaining === 0) {
                clearInterval(interval)
                onTimeUp()
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [durationMinutes, startTime, onTimeUp])

    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
            <div className={`px-6 py-3 rounded-lg shadow-lg font-mono text-lg font-bold ${isCritical
                    ? 'bg-red-500 text-white animate-pulse'
                    : isWarning
                        ? 'bg-orange-500 text-white'
                        : 'bg-blue-500 text-white'
                }`}>
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{formatTime(timeRemaining)}</span>
                </div>
            </div>
        </div>
    )
}
