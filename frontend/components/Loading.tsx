'use client'

import React from 'react'

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl'
    text?: string
    fullScreen?: boolean
    className?: string
}

const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
}

export default function LoadingSpinner({
    size = 'lg',
    text = 'Loading...',
    fullScreen = false,
    className = ''
}: LoadingSpinnerProps) {
    const spinner = (
        <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
            <svg
                className={`animate-spin text-blue-500 ${sizeClasses[size]}`}
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
            </svg>
            {text && (
                <p className={`text-slate-400 font-medium ${size === 'sm' ? 'text-sm' : size === 'xl' ? 'text-lg' : 'text-base'}`}>
                    {text}
                </p>
            )}
        </div>
    )

    if (fullScreen) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0B1121]">
                {spinner}
            </div>
        )
    }

    return spinner
}

// Page-level loading component with skeleton
interface PageLoadingProps {
    title?: string
}

export function PageLoading({ title = 'Loading...' }: PageLoadingProps) {
    return (
        <div className="min-h-screen bg-[#0B1121] flex items-center justify-center">
            <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full flex items-center justify-center border border-white/5 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                    <svg
                        className="animate-spin h-10 w-10 text-blue-500"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2 tracking-tight">{title}</h2>
                <p className="text-slate-400 text-sm">Please wait a moment...</p>

                {/* Animated dots */}
                <div className="flex justify-center gap-1.5 mt-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    )
}

// Skeleton loader for cards
export function CardSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="bg-[#131B2D] rounded-2xl p-6 border border-white/5 animate-pulse"
                >
                    <div className="h-4 bg-white/10 rounded w-3/4 mb-4" />
                    <div className="h-3 bg-white/5 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-white/5 rounded w-2/3 mb-4" />
                    <div className="flex gap-2">
                        <div className="h-8 bg-white/10 rounded w-20" />
                        <div className="h-8 bg-white/10 rounded w-20" />
                    </div>
                </div>
            ))}
        </div>
    )
}

// Skeleton loader for table rows
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="bg-[#131B2D] rounded-2xl border border-white/5 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex gap-4 animate-pulse bg-white/[0.02]">
                <div className="h-4 bg-white/10 rounded w-1/4" />
                <div className="h-4 bg-white/10 rounded w-1/4" />
                <div className="h-4 bg-white/10 rounded w-1/4" />
                <div className="h-4 bg-white/10 rounded w-1/4" />
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="p-4 border-b border-white/5 flex gap-4 animate-pulse">
                    <div className="h-4 bg-white/5 rounded w-1/4" />
                    <div className="h-4 bg-white/5 rounded w-1/4" />
                    <div className="h-4 bg-white/5 rounded w-1/4" />
                    <div className="h-4 bg-white/5 rounded w-1/4" />
                </div>
            ))}
        </div>
    )
}
