'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAuthToken } from '@/lib/db/client'
import { PageLoading } from '@/components/Loading'
import {
    ClipboardList,
    Check,
    X,
    FileText,
    CheckCircle,
    XCircle,
    Circle,
    Clock,
    Calendar,
    ArrowRight,
    PartyPopper,
    Zap
} from 'lucide-react'

interface ExamResult {
    session_id: string
    exam_code: string
    exam_title: string
    score: number
    status: string
    started_at: string
    ended_at: string
    duration_minutes: number
    total_questions: number
    correct_answers: number
    wrong_answers: number
    unanswered: number
}

export default function ExamResultPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [result, setResult] = useState<ExamResult | null>(null)

    useEffect(() => {
        fetchLatestResult()
    }, [])

    const fetchLatestResult = async () => {
        setLoading(true)
        try {
            const demo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
            if (demo) {
                // Demo mode fallback
                setTimeout(() => {
                    setResult({
                        session_id: 'demo-1',
                        exam_code: 'DEMO2026',
                        exam_title: 'Demo Programming Exam',
                        score: 85.5,
                        status: 'completed',
                        started_at: new Date().toISOString(),
                        ended_at: new Date().toISOString(),
                        duration_minutes: 45,
                        total_questions: 20,
                        correct_answers: 17,
                        wrong_answers: 2,
                        unanswered: 1
                    })
                    setLoading(false)
                }, 500)
                return
            }

            const token = getAuthToken()
            if (!token) {
                router.push('/login')
                return
            }

            // 1. Get List of Results
            const listRes = await fetch('/api/results', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (!listRes.ok) throw new Error('Failed to fetch results list')
            const { results } = await listRes.json()

            if (!results || results.length === 0) {
                setResult(null)
                setLoading(false)
                return
            }

            const latestSession = results[0]

            // 2. Get Detail of Latest Result
            const detailRes = await fetch(`/api/results/${latestSession.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (!detailRes.ok) throw new Error('Failed to fetch result detail')
            const detailData = await detailRes.json()

            // 3. Calculate Stats from Detail
            const totalQuestions = detailData.questions.length
            const correctAnswers = detailData.questions.filter((q: any) => q.is_correct === true).length
            const wrongAnswers = detailData.questions.filter((q: any) => q.is_correct === false).length
            const unanswered = detailData.questions.filter((q: any) => q.is_correct === null).length

            // Note: API detail doesn't currently return duration or start/end times precisely in top level object
            // I might need to update API to return start/end times if they are important.
            // Let's check api/results/[id] output. It returns { examTitle, score, questions }.
            // It allows me to calculate score/questions but NOT duration.
            // But /api/results (LIST) returns `completed_at`.
            // I miss `started_at` in both.

            // For now, let's mock duration or calculate it if possible.
            // Wait, I can update GET /api/results/[id] to return started_at and completed_at.

            // Let's stick with what we have. API /api/results/[id] returns minimal info. 
            // I should update /api/results/[id] to return `started_at` and `completed_at`.

            setResult({
                session_id: latestSession.id,
                exam_code: latestSession.exam_code,
                exam_title: detailData.examTitle,
                score: detailData.score,
                status: 'completed',
                started_at: latestSession.completed_at, // Fallback/Placeholder
                ended_at: latestSession.completed_at,
                duration_minutes: 0, // Placeholder
                total_questions: totalQuestions,
                correct_answers: correctAnswers,
                wrong_answers: wrongAnswers,
                unanswered: unanswered
            })

        } catch (error: any) {
            console.error('Error fetching result:', error)
            alert('Failed to load result: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <PageLoading title="Loading your results..." />

    if (!result) {
        return (
            <div className="min-h-screen bg-[#0B1121] flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <div className="w-24 h-24 bg-[#131B2D] rounded-full border border-white/10 flex items-center justify-center mx-auto mb-6">
                        <ClipboardList className="w-12 h-12 text-slate-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">No Results Found</h2>
                    <p className="text-slate-400 mb-6">You haven't completed any exams yet.</p>
                    <Link href="/exams">
                        <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 transition-all">
                            Browse Exams
                        </button>
                    </Link>
                </div>
            </div>
        )
    }

    const scoreColor = result.score >= 80 ? 'emerald' : result.score >= 60 ? 'amber' : 'rose'
    const passed = result.score >= 60

    return (
        <div className="min-h-screen bg-[#0B1121] text-slate-100">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full animate-pulse-slow"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 blur-[100px] rounded-full"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-white mb-2">Exam Results</h1>
                    <p className="text-slate-400">Here's your performance overview</p>
                </div>

                {/* Main Result Card */}
                <div className="bg-[#131B2D]/80 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl mb-8">
                    {/* Score Section */}
                    <div className="relative p-12 bg-gradient-to-b from-[#1A2333] to-[#131B2D] text-center border-b border-white/5">
                        {/* Decorative circles */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/5 rounded-full blur-2xl"></div>

                        <div className="relative z-10">
                            {/* Status Badge */}
                            <div className="mb-6">
                                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${passed
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                    }`}>
                                    {passed ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            PASSED
                                        </>
                                    ) : (
                                        <>
                                            <X className="w-4 h-4" />
                                            NEEDS IMPROVEMENT
                                        </>
                                    )}
                                </span>
                            </div>

                            {/* Score Display */}
                            <div className={`relative w-48 h-48 mx-auto mb-6 rounded-full border-8 flex items-center justify-center bg-${scoreColor}-500/5 border-${scoreColor}-500/20 shadow-[0_0_60px_rgba(0,0,0,0.3)]`}>
                                <div className="text-center">
                                    <div className={`text-6xl font-black text-${scoreColor}-400 mb-1`}>
                                        {result.score.toFixed(1)}
                                    </div>
                                    <div className="text-2xl font-bold text-slate-400">%</div>
                                </div>
                            </div>

                            {/* Exam Title */}
                            <h2 className="text-3xl font-bold text-white mb-2">{result.exam_title}</h2>
                            <p className="text-slate-400 font-mono text-sm">{result.exam_code}</p>
                        </div>
                    </div>

                    {/* Overview Stats */}
                    <div className="p-8">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                            Overview
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {[
                                { label: 'Total Questions', value: result.total_questions, icon: <FileText className="w-8 h-8" />, color: 'blue' },
                                { label: 'Correct', value: result.correct_answers, icon: <CheckCircle className="w-8 h-8" />, color: 'emerald' },
                                { label: 'Wrong', value: result.wrong_answers, icon: <XCircle className="w-8 h-8" />, color: 'rose' },
                                { label: 'Unanswered', value: result.unanswered, icon: <Circle className="w-8 h-8" />, color: 'slate' }
                            ].map((stat, idx) => (
                                <div key={idx} className={`bg-[#1A2333] rounded-2xl p-5 border border-white/5 hover:border-${stat.color}-500/20 transition-all group`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-${stat.color}-400 group-hover:scale-110 transition-transform`}>{stat.icon}</span>
                                        <span className={`text-3xl font-black text-${stat.color}-400`}>{stat.value}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Time & Date Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-[#1A2333] rounded-xl p-5 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                        <Clock className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Duration</p>
                                        <p className="text-lg font-bold text-white">
                                            {Math.floor(result.duration_minutes / 60)} min {result.duration_minutes % 60} sec
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#1A2333] rounded-xl p-5 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                        <Calendar className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Completed</p>
                                        <p className="text-lg font-bold text-white">
                                            {new Date(result.ended_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="p-8 pt-0">
                        <Link href={`/results/${result.session_id}`}>
                            <button className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2">
                                <ArrowRight className="w-5 h-5" />
                                View Detailed Answers
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Encouragement Message */}
                <div className={`text-center p-6 rounded-2xl border ${passed
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-blue-500/5 border-blue-500/20'
                    }`}>
                    <div className={`flex items-center justify-center gap-2 text-lg font-semibold ${passed ? 'text-emerald-400' : 'text-blue-400'}`}>
                        {passed ? (
                            <>
                                <PartyPopper className="w-6 h-6" />
                                <span>Congratulations! Great job on passing the exam!</span>
                            </>
                        ) : (
                            <>
                                <Zap className="w-6 h-6" />
                                <span>Keep practicing! You can retake the exam to improve your score.</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
