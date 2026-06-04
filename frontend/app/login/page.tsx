'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { isDemoMode, login } from '@/lib/db/client'
import Link from 'next/link'
import { Shield, AlertCircle, Loader2, Gamepad2 } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const { user, error: loginError } = await login(email, password)

            if (loginError) {
                setError(loginError)
                setLoading(false)
                return
            }

            if (!user) {
                setError('Login failed')
                setLoading(false)
                return
            }

            // Check for redirect URL (from exam access or other protected pages)
            const redirectPath = typeof window !== 'undefined'
                ? sessionStorage.getItem('redirectAfterLogin') || new URLSearchParams(window.location.search).get('redirect')
                : null

            if (redirectPath) {
                // Clear the stored redirect
                sessionStorage.removeItem('redirectAfterLogin')
                router.push(redirectPath)
            } else {
                // Conditional Redirect based on role
                switch (user.role) {
                    case 'admin':
                        router.push('/dashboard')
                        break
                    case 'user':
                    default:
                        router.push('/user')
                        break
                }
            }
        } catch (err: any) {
            setError(err.message || 'Failed to login')
        } finally {
            setLoading(false)
        }
    }

    // Demo quick login
    const handleDemoLogin = async () => {
        setEmail('admin@demo.com')
        setPassword('Demo123!')
        // Auto submit
        const { user } = await login('admin@demo.com', 'Demo123!')
        if (user) {
            router.push('/dashboard')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0B1121] selection:bg-blue-500/30 font-sans relative overflow-hidden">
            {/* Background Atmospherics */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen opacity-20 pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen opacity-20 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md p-6">
                {/* Logo/Brand */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center gap-3 group cursor-pointer mb-6">
                        <div className="relative w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
                            <Shield className="w-6 h-6 text-white relative z-10" />
                        </div>
                    </Link>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back</h1>
                    <p className="text-slate-400 mt-2 text-sm">Sign in to your dashboard</p>
                </div>

                {/* Login Card */}
                <div className="bg-[#0F1623] border border-white/5 rounded-3xl shadow-2xl p-8 relative overflow-hidden backdrop-blur-sm">
                    {/* Top Glow Line */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50" />

                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {isDemoMode && (
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
                            <Gamepad2 className="w-4 h-4" />
                            Demo Mode Active
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@demo.com"
                                className="w-full px-4 py-3 bg-[#1A2333] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
                                required
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2.5">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                                <a href="#" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Forgot password?</a>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-[#1A2333] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 hover:-translate-y-0.5"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                                    Signing in...
                                </span>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    {isDemoMode && (
                        <button
                            onClick={handleDemoLogin}
                            className="w-full mt-4 py-3.5 bg-[#1F2937] text-slate-200 border border-white/10 rounded-xl font-semibold hover:bg-[#374151] hover:text-white transition-all text-sm flex items-center justify-center gap-2"
                        >
                            <Gamepad2 className="w-4 h-4" />
                            Quick Demo Login
                        </button>
                    )}

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-slate-400 text-sm">
                            Don't have an account?{' '}
                            <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                                Create account
                            </Link>
                        </p>
                    </div>

                    {/* Demo Credentials */}
                    {isDemoMode && (
                        <div className="mt-6 p-4 bg-[#1A2333]/50 rounded-xl border border-white/5">
                            <p className="text-[10px] text-slate-500 text-center uppercase tracking-wider font-bold mb-3">Demo Credentials</p>
                            <div className="flex flex-col gap-2">
                                {[
                                    { role: 'Admin', email: 'creator@demo.com', pass: 'Demo123!' },
                                    { role: 'User', email: 'user@demo.com', pass: 'Demo123!' },
                                ].map((cred, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs text-slate-400 px-2 py-1 hover:bg-white/5 rounded transition-colors cursor-pointer group" onClick={() => { setEmail(cred.email); setPassword(cred.pass); }}>
                                        <span className="font-semibold text-slate-300 w-16">{cred.role}</span>
                                        <span className="font-mono">{cred.email}</span>
                                        <span className="text-slate-600 group-hover:text-blue-400 transition-colors">Auto-fill →</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-slate-500 text-xs mt-8">
                    &copy; 2026 ExamProctor. Secure & Proctored.
                </p>
            </div>
        </div>
    )
}
