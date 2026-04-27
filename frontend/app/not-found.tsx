import Link from 'next/link'
import { Frown, Home, LayoutDashboard } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

            <div className="relative z-10 text-center max-w-lg mx-auto px-6">
                {/* 404 Large Text */}
                <div className="relative mb-8">
                    <h1 className="text-[180px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 leading-none select-none">
                        404
                    </h1>
                    {/* Glow effect */}
                    <div className="absolute inset-0 text-[180px] font-bold text-blue-500/20 blur-3xl leading-none">
                        404
                    </div>
                </div>

                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Frown className="w-10 h-10 text-blue-400" />
                </div>

                {/* Message */}
                <h2 className="text-3xl font-bold text-white mb-4">
                    Page Not Found
                </h2>
                <p className="text-gray-400 mb-8 text-lg">
                    Oops! The page you're looking for doesn't exist or has been moved.
                    Don't worry, let's get you back on track.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/">
                        <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-blue-500/25">
                            <span className="flex items-center gap-2"><Home className="w-4 h-4" /> Go Home</span>
                        </button>
                    </Link>
                    <Link href="/dashboard">
                        <button className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition-all">
                            <span className="flex items-center gap-2"><LayoutDashboard className="w-4 h-4" /> Dashboard</span>
                        </button>
                    </Link>
                </div>

                {/* Quick Links */}
                <div className="mt-12 pt-8 border-t border-white/10">
                    <p className="text-gray-500 text-sm mb-4">Quick Links</p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link href="/login" className="text-blue-400 hover:text-blue-300 text-sm transition">
                            Login
                        </Link>
                        <span className="text-gray-600">•</span>
                        <Link href="/signup" className="text-blue-400 hover:text-blue-300 text-sm transition">
                            Sign Up
                        </Link>
                        <span className="text-gray-600">•</span>
                        <Link href="/demo-exam" className="text-blue-400 hover:text-blue-300 text-sm transition">
                            Try Demo
                        </Link>
                        <span className="text-gray-600">•</span>
                        <Link href="/settings" className="text-blue-400 hover:text-blue-300 text-sm transition">
                            Settings
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-gray-600 text-xs mt-8">
                    ExamProctor © 2026 • Secure Online Examination Platform
                </p>
            </div>
        </div>
    )
}
