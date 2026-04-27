'use client'

import { ProctorCamera } from './ProctorCamera'
import { TabTracker } from './TabTracker'
import { ExamTimer } from './ExamTimer'

interface ProctoringWrapperProps {
    sessionId: string
    examConfig: {
        cameraRequired: boolean
        screenshotInterval: number
        tabSwitchAllowed: number
        durationMinutes: number
        startTime: Date
    }
    onExamBlocked: () => void
    onTimeUp: () => void
    children: React.ReactNode
}

export function ProctoringWrapper({
    sessionId,
    examConfig,
    onExamBlocked,
    onTimeUp,
    children
}: ProctoringWrapperProps) {
    return (
        <div className="relative min-h-screen">
            {/* Proctoring Components */}
            <ProctorCamera
                sessionId={sessionId}
                interval={examConfig.screenshotInterval}
                enabled={examConfig.cameraRequired}
                onError={(error) => {
                    console.error('Proctoring error:', error)
                    // Optionally block exam if camera is required
                    if (examConfig.cameraRequired) {
                        alert(error + '\n\nCamera is required for this exam.')
                        onExamBlocked()
                    }
                }}
            />

            <TabTracker
                sessionId={sessionId}
                maxSwitches={examConfig.tabSwitchAllowed}
                enabled={true}
                onBlocked={onExamBlocked}
                onViolation={(count) => {
                    console.log(`Tab switch violation: ${count}`)
                }}
            />

            <ExamTimer
                durationMinutes={examConfig.durationMinutes}
                startTime={examConfig.startTime}
                onTimeUp={onTimeUp}
            />

            {/* Exam Content */}
            <div className="container mx-auto px-4 py-8 pt-20">
                {children}
            </div>

            {/* Fullscreen Notice */}
            <div className="fixed bottom-4 left-4 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm border border-blue-300">
                <p className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Proctoring is active. Do not switch tabs or windows.</span>
                </p>
            </div>
        </div>
    )
}
