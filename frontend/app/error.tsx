'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RefreshCcw, Home } from 'lucide-react'

interface ErrorProps {
    error: Error & { digest?: string }
    reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Global Error:', error)
    }, [error])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            <div className="text-center max-w-lg mx-auto p-8">
                {/* Error Icon */}
                <div className="w-24 h-24 mx-auto mb-8 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
                    <AlertCircle className="w-12 h-12 text-red-400" />
                </div>

                {/* Error Message */}
                <h1 className="text-3xl font-bold text-white mb-4">
                    Something went wrong!
                </h1>
                <p className="text-gray-400 mb-8">
                    We apologize for the inconvenience. An unexpected error has occurred.
                    Please try again or contact support if the problem persists.
                </p>

                {/* Error Details (development only) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-left">
                        <p className="text-red-400 font-mono text-sm break-all">
                            {error.message}
                        </p>
                        {error.digest && (
                            <p className="text-gray-500 text-xs mt-2">
                                Error ID: {error.digest}
                            </p>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => reset()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        <RefreshCcw className="w-5 h-5" />
                        Try Again
                    </button>
                    <Link href="/">
                        <button className="px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-all flex items-center justify-center gap-2">
                            <Home className="w-5 h-5" />
                            Go Home
                        </button>
                    </Link>
                </div>

                {/* Support Link */}
                <p className="text-gray-500 text-sm mt-8">
                    Need help?{' '}
                    <a
                        href="mailto:support@examproctor.com"
                        className="text-blue-400 hover:underline"
                    >
                        Contact Support
                    </a>
                </p>
            </div>
        </div>
    )
}
