'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, isDemoMode } from '@/lib/supabase/client'
import { PageLoading } from '@/components/Loading'
import {
    ChevronLeft,
    Trash2,
    FileText,
    Trophy,
    TrendingUp,
    TrendingDown,
    Clock,
    Calendar,
    Search,
    Inbox
} from 'lucide-react'

interface Submission {
    session_id: string
    student_id: string
    student_name: string
    student_email: string
    score: number
    status: string
    started_at: string
    ended_at: string
    duration_seconds: number
}

export default function ExamSubmissionsPage() {
    const params = useParams()
    const router = useRouter()
    const examId = params.id as string

    const [loading, setLoading] = useState(true)
    const [exam, setExam] = useState<any>(null)
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [deleting, setDeleting] = useState<string | null>(null)

    useEffect(() => {
        fetchExamAndSubmissions()
    }, [examId])

    const fetchExamAndSubmissions = async () => {
        setLoading(true)
        try {
            if (isDemoMode) {
                alert('Demo mode: Submissions not available')
                router.push('/exams')
                return
            }

            if (!supabase) throw new Error('Supabase not initialized')

            // Get current user (teacher)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            // Fetch exam
            const { data: examData, error: examError } = await supabase
                .from('exams')
                .select('*')
                .eq('id', examId)
                .eq('teacher_id', user.id) // Only teacher's own exams
                .single()

            if (examError) throw examError
            if (!examData) {
                alert('Exam not found or you do not have access')
                router.push('/exams')
                return
            }

            setExam(examData)

            // Fetch all sessions for this exam
            const { data: sessions, error: sessionsError } = await supabase
                .from('exam_sessions')
                .select('*')
                .eq('exam_code', examData.code)
                .eq('status', 'completed')
                .order('ended_at', { ascending: false })

            if (sessionsError) throw sessionsError

            if (!sessions || sessions.length === 0) {
                setSubmissions([])
                setLoading(false)
                return
            }

            // Fetch all unique user profiles
            const userIds = [...new Set(sessions.map(s => s.user_id))]
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds)

            if (profilesError) throw profilesError

            // Transform data
            const submissionsData: Submission[] = sessions.map(s => {
                const profile = profiles?.find(p => p.id === s.user_id)
                const startTime = new Date(s.started_at).getTime()
                const endTime = new Date(s.ended_at).getTime()
                const durationSeconds = Math.round((endTime - startTime) / 1000)

                return {
                    session_id: s.id,
                    student_id: s.user_id,
                    student_name: profile?.full_name || 'Unknown User',
                    student_email: profile?.email || '',
                    score: s.score || 0,
                    status: s.status,
                    started_at: s.started_at,
                    ended_at: s.ended_at,
                    duration_seconds: durationSeconds
                }
            })

            setSubmissions(submissionsData)

        } catch (error: any) {
            console.error('Error fetching data:', error)
            alert('Failed to load submissions: ' + error.message)
            router.push('/exams')
        } finally {
            setLoading(false)
        }
    }

    const deleteSession = async (sessionId: string, studentName: string) => {
        if (!confirm(`Delete submission from ${studentName}?\n\nThis will:\n- Remove their exam session\n- Delete all their answers\n- Allow them to retake the exam\n\nContinue?`)) {
            return
        }

        setDeleting(sessionId)
        try {
            if (!supabase) throw new Error('Supabase not initialized')

            console.log('🗑️ Attempting to delete session:', sessionId)

            // Delete session (cascade should delete answers)
            const { data, error, status } = await supabase
                .from('exam_sessions')
                .delete()
                .eq('id', sessionId)
                .select() // Return deleted rows to verify

            console.log('Delete response:', { data, error, status })

            if (error) {
                console.error('Delete error:', error)
                throw new Error(`Database error: ${error.message}`)
            }

            // Verify deletion
            const { data: checkData, error: checkError } = await supabase
                .from('exam_sessions')
                .select('id')
                .eq('id', sessionId)
                .maybeSingle()

            if (checkError) throw checkError

            if (checkData) {
                throw new Error('Session was not deleted. Please check permissions.')
            }

            alert('Session deleted successfully!\n\nStudent can now retake the exam.')
            await fetchExamAndSubmissions() // Refresh list

        } catch (error: any) {
            console.error('Error deleting session:', error)
            alert(`Failed to delete session:\n\n${error.message}\n\nPlease check:\n1. You own this exam\n2. Database permissions are correct\n3. Try refreshing the page`)
        } finally {
            setDeleting(null)
        }
    }

    if (loading) return <PageLoading title="Loading submissions..." />

    const avgScore = submissions.length > 0
        ? submissions.reduce((acc, s) => acc + s.score, 0) / submissions.length
        : 0
    const highestScore = submissions.length > 0
        ? Math.max(...submissions.map(s => s.score))
        : 0
    const lowestScore = submissions.length > 0
        ? Math.min(...submissions.map(s => s.score))
        : 0

    return (
        <div className="min-h-screen bg-[#0B1121] text-slate-100">
            {/* Header */}
            <header className="bg-[#0F1623] border-b border-white/5 sticky top-0 z-30 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <Link href="/exams" className="inline-flex items-center gap-1 text-slate-400 hover:text-white mb-3 transition-colors text-sm font-medium group">
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Exams
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white">{exam?.title}</h1>
                            <p className="text-sm text-slate-400">Student Submissions</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-black text-blue-400">{submissions.length}</div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Submissions</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Submissions', value: submissions.length, icon: <FileText className="w-8 h-8" />, color: 'blue' },
                        { label: 'Average Score', value: `${avgScore.toFixed(1)}%`, icon: <TrendingUp className="w-8 h-8" />, color: 'purple' },
                        { label: 'Highest Score', value: `${highestScore.toFixed(1)}%`, icon: <Trophy className="w-8 h-8" />, color: 'emerald' },
                        { label: 'Lowest Score', value: `${lowestScore.toFixed(1)}%`, icon: <TrendingDown className="w-8 h-8" />, color: 'rose' }
                    ].map((stat, idx) => (
                        <div key={idx} className={`bg-[#131B2D] rounded-2xl p-5 border border-white/5 hover:border-${stat.color}-500/20 transition-all`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className={`text-${stat.color}-400`}>{stat.icon}</span>
                                <span className={`text-2xl font-black text-${stat.color}-400`}>{stat.value}</span>
                            </div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Submissions List */}
                {submissions.length === 0 ? (
                    <div className="text-center py-16 bg-[#131B2D] rounded-3xl border border-white/5 border-dashed">
                        <div className="w-20 h-20 bg-[#1A2333] rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                            <Inbox className="w-10 h-10 text-slate-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Submissions Yet</h3>
                        <p className="text-slate-400">Students haven't taken this exam yet.</p>
                    </div>
                ) : (
                    <div className="bg-[#131B2D] rounded-2xl border border-white/5 overflow-hidden">
                        <div className="p-6 border-b border-white/5 bg-[#1A2333]/50">
                            <h2 className="text-lg font-bold text-white">All Submissions</h2>
                        </div>
                        <div className="divide-y divide-white/5">
                            {submissions.map((sub, index) => (
                                <div key={sub.session_id} className="p-6 hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-center gap-6">
                                        {/* Number Badge */}
                                        <div className="w-12 h-12 rounded-full bg-blue-500/10 border-2 border-blue-500/20 flex items-center justify-center flex-shrink-0">
                                            <span className="text-blue-400 font-bold">{index + 1}</span>
                                        </div>

                                        {/* Student Info */}
                                        <div className="flex-1">
                                            <h3 className="font-bold text-white mb-1">{sub.student_name}</h3>
                                            <p className="text-sm text-slate-400">{sub.student_email}</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {Math.floor(sub.duration_seconds / 60)}m {sub.duration_seconds % 60}s
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(sub.ended_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Score */}
                                        <div className="text-right">
                                            <div className={`text-3xl font-black mb-1 ${sub.score >= 80 ? 'text-emerald-400' :
                                                sub.score >= 60 ? 'text-amber-400' :
                                                    'text-rose-400'
                                                }`}>
                                                {sub.score.toFixed(1)}%
                                            </div>
                                            <span className={`text-xs uppercase font-bold ${sub.score >= 60 ? 'text-emerald-500' : 'text-rose-500'
                                                }`}>
                                                {sub.score >= 60 ? 'Passed' : 'Failed'}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <Link href={`/results/${sub.session_id}`}>
                                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500 transition-all text-sm">
                                                    View Details
                                                </button>
                                            </Link>
                                            <button
                                                onClick={() => deleteSession(sub.session_id, sub.student_name)}
                                                disabled={deleting === sub.session_id}
                                                className="px-4 py-2 border border-rose-500/20 text-rose-400 rounded-lg font-semibold hover:bg-rose-500/10 transition-all disabled:opacity-50 text-sm flex items-center gap-2"
                                            >
                                                {deleting === sub.session_id ? 'Deleting...' : (
                                                    <>
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
