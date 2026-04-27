'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, Check, Loader2 } from 'lucide-react'

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export default function StudentPortal() {
    const [examCode, setExamCode] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleJoinExam = (e: React.FormEvent) => {
        e.preventDefault()
        if (!examCode.trim()) return

        setIsLoading(true)
        // Simulate checking code
        setTimeout(() => {
            // In real app: Validate code against DB
            router.push(`/exam/${examCode}`)
        }, 1000)
    }

    return (
        <div className="min-h-screen bg-[#0B1121] flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Atmospherics */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen opacity-20 animate-pulse-slow"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 blur-[100px] rounded-full mix-blend-screen opacity-20"></div>
            </div>

            {/* Navbar Simple */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
                        <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">ExamProctor</span>
                </div>
                <Link href="/login">
                    <button className="px-4 py-2 text-slate-400 hover:text-white transition-all text-sm font-medium hover:bg-white/5 rounded-lg border border-transparent hover:border-white/5">
                        Log Out
                    </button>
                </Link>
            </div>

            {/* Main Content */}
            <div className="w-full max-w-md relative z-20">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-white mb-4 tracking-tight animate-fade-in-up">Student Portal</h1>
                    <p className="text-slate-400 text-lg animate-fade-in-up delay-75">Enter your exam code to begin</p>
                </div>

                <div className="bg-[#131B2D]/80 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-2xl relative overflow-hidden animate-fade-in-up delay-100">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-50"></div>

                    <form onSubmit={handleJoinExam} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Exam Code</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={examCode}
                                    onChange={(e) => setExamCode(e.target.value)}
                                    placeholder="e.g. EXAM-2024-X"
                                    className="w-full px-6 py-4 bg-[#0B1121] border border-white/10 rounded-xl text-white text-lg placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center uppercase tracking-widest font-mono shadow-inner"
                                    required
                                />
                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                    {examCode && (
                                        <span className="text-emerald-500 animate-fade-in">
                                            <Check className="w-5 h-5" />
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !examCode}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-lg font-bold hover:from-blue-500 hover:to-indigo-500 transform hover:translate-y-[-2px] transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                                    Verifying Code...
                                </span>
                            ) : 'Join Exam'}
                        </button>
                    </form>

                    {isDemoMode && (
                        <div className="mt-8 pt-6 border-t border-white/5">
                            <p className="text-amber-500/80 text-xs font-bold uppercase tracking-wider text-center mb-3">Demo Codes Available</p>
                            <div className="flex justify-center gap-3">
                                <button className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-xs font-mono hover:bg-amber-500/20 transition-colors" onClick={() => setExamCode('DEMO-101')}>
                                    DEMO-101
                                </button>
                                <button className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-xs font-mono hover:bg-amber-500/20 transition-colors" onClick={() => setExamCode('WEB-BASICS')}>
                                    WEB-BASICS
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <p className="text-slate-500 text-sm">
                        Waiting for an exam invite link? Check your email or contact your teacher.
                    </p>
                </div>
            </div>
        </div>
    )
}
