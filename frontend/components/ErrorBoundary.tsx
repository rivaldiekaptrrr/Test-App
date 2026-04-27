'use client'

import React, { Component, ReactNode } from 'react'
import Link from 'next/link'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: React.ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        }
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        this.setState({ errorInfo })

        // Log error to console (in production, you'd send to error tracking service)
        console.error('ErrorBoundary caught an error:', error)
        console.error('Error info:', errorInfo)

        // TODO: Send to error tracking service like Sentry
        // if (typeof window !== 'undefined') {
        //     Sentry.captureException(error, { extra: { errorInfo } })
        // }
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        })
    }

    render(): ReactNode {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
                    <div className="text-center max-w-lg mx-auto p-8">
                        {/* Error Icon */}
                        <div className="w-24 h-24 mx-auto mb-8 bg-red-500/20 rounded-full flex items-center justify-center">
                            <svg
                                className="w-12 h-12 text-red-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>

                        {/* Error Message */}
                        <h1 className="text-3xl font-bold text-white mb-4">
                            Oops! Something went wrong
                        </h1>
                        <p className="text-gray-400 mb-8">
                            We're sorry, but something unexpected happened. Please try again or contact support if the problem persists.
                        </p>

                        {/* Error Details (only in development) */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-left">
                                <p className="text-red-400 font-mono text-sm mb-2">
                                    {this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <pre className="text-gray-500 text-xs overflow-auto max-h-32">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-lg"
                            >
                                Try Again
                            </button>
                            <Link href="/">
                                <button className="px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-all">
                                    Go to Homepage
                                </button>
                            </Link>
                        </div>

                        {/* Support Info */}
                        <p className="text-gray-500 text-sm mt-8">
                            If this keeps happening, please contact{' '}
                            <a href="mailto:support@examproctor.com" className="text-blue-400 hover:underline">
                                support@examproctor.com
                            </a>
                        </p>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
