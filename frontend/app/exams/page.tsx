'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getAuthToken, getCurrentUser } from '@/lib/db/client'
import {
    ChevronLeft,
    Plus,
    Search,
    Loader2,
    Clock,
    FileText,
    Copy,
    Link2,
    Settings,
    Edit3,
    Users,
    FileX,
    ListChecks,
    Video
} from 'lucide-react'

// Demo data fallback (kept for reference, but mainly using API now)
const demoExams = [
    {
        id: '1',
        code: 'PROG2026',
        title: 'Programming Fundamentals',
        description: 'Test your basic programming knowledge including variables, loops, and functions.',
        duration: 60,
        question_count: 20,
        status: 'published',
        proctoring_enabled: true,
        start_time: '2026-01-15',
        end_time: '2026-01-30',
    },
    {
        id: '2',
        code: 'WEBDEV24',
        title: 'Web Development Basics',
        description: 'HTML, CSS, and JavaScript fundamentals for modern web development.',
        duration: 45,
        question_count: 15,
        status: 'published',
        proctoring_enabled: true,
        start_time: '2026-01-10',
        end_time: '2026-01-25',
    },
    {
        id: '3',
        code: 'DATABASE2026',
        title: 'Database Design & SQL',
        description: 'Comprehensive test on database concepts, normalization, and SQL queries.',
        duration: 90,
        question_count: 25,
        status: 'published',
        proctoring_enabled: true,
        start_time: '2026-01-12',
        end_time: '2026-02-12',
    }
]

interface Exam {
    id: string
    code: string
    title: string
    description: string
    duration: number
    question_count?: number
    status: string
    proctoring_enabled: boolean
    start_time: string | null
    end_time: string | null
}

export default function ExamsListPage() {
    const [exams, setExams] = useState<Exam[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [showToast, setShowToast] = useState(false)
    const [toastMessage, setToastMessage] = useState('')
    const [userRole, setUserRole] = useState<string>('student')

    // Fetch exams from API
    useEffect(() => {
        const fetchExams = async () => {
            setLoading(true)

            try {
                // Check if demo mode via env var (optional check)
                const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

                if (isDemoMode) {
                    setExams(demoExams)
                    setLoading(false)
                    return
                }

                // Get user role for UI logic
                const user = getCurrentUser()
                if (user) {
                    setUserRole(user.role)
                }

                const token = getAuthToken()

                // Fetch from API
                const response = await fetch('/api/exams', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })

                if (!response.ok) {
                    throw new Error('Failed to fetch exams')
                }

                const data = await response.json()
                setExams(data.exams || [])

            } catch (error) {
                console.error('Error fetching exams:', error)
                // If API fails, maybe fallback to empty list or show error
                setExams([])
            } finally {
                setLoading(false)
            }
        }

        fetchExams()
    }, [])

    const filteredExams = exams.filter(exam => {
        const matchesFilter = filter === 'all' || exam.status === filter
        const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (exam.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
            (exam.code?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
        return matchesFilter && matchesSearch
    })

    const copyToClipboard = (text: string, type: 'link' | 'code') => {
        navigator.clipboard.writeText(text).then(() => {
            setToastMessage(type === 'link' ? 'Link Copied!' : 'Code Copied!')
            setShowToast(true)
            setTimeout(() => setShowToast(false), 3000)
        }).catch(() => {
            setToastMessage('Failed to copy!')
            setShowToast(true)
            setTimeout(() => setShowToast(false), 3000)
        })
    }

    const getExamLink = (accessCode: string) => {
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/exam/${accessCode}`
        }
        return `http://localhost:3000/exam/${accessCode}`
    }

    return (
        <div className="min-h-screen bg-[#0B1121] text-slate-100">
            {/* Header */}
            <header className="bg-[#0F1623] border-b border-white/5 sticky top-0 z-30 backdrop-blur-md bg-opacity-80">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <Link href="/dashboard" className="text-slate-400 hover:text-white text-xs uppercase tracking-wider font-semibold mb-1 inline-flex items-center gap-1 transition-colors group">
                                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Back to Dashboard
                            </Link>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Available Exams</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-full border border-emerald-500/20 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Live Database
                            </span>

                            {/* Only show Create Exam for admin/teacher */}
                            {['admin', 'teacher'].includes(userRole) && (
                                <Link href="/exams/create">
                                    <button className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2">
                                        <Plus className="w-5 h-5" />
                                        Create Exam
                                    </button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search exams by title or code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-[#1A2333] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                        />
                    </div>
                    <div className="flex bg-[#1A2333] p-1 rounded-xl border border-white/10">
                        {['all', 'published', 'draft'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${filter === f
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Toast Notification */}
                {showToast && (
                    <div className="fixed bottom-8 right-8 bg-white text-slate-900 px-4 py-3 rounded-xl shadow-2xl font-bold flex items-center gap-2 animate-bounce z-50">
                        <ListChecks className="w-5 h-5 text-emerald-500" />
                        {toastMessage}
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                            <p className="text-slate-400">Loading exams from database...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Stats Bar */}
                        <div className="flex items-center gap-4 mb-6 text-sm">
                            <span className="text-slate-400">
                                <span className="text-white font-bold">{filteredExams.length}</span> exam{filteredExams.length !== 1 ? 's' : ''} found
                            </span>
                            <span className="text-slate-600">|</span>
                            <span className="text-emerald-400">
                                {filteredExams.filter(e => e.status === 'published').length} published
                            </span>
                            <span className="text-slate-600">|</span>
                            <span className="text-amber-400">
                                {filteredExams.filter(e => e.status === 'draft').length} draft
                            </span>
                        </div>

                        {/* Exams Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredExams.map((exam) => (
                                <div
                                    key={exam.id}
                                    className="bg-[#131B2D] rounded-2xl border border-white/5 overflow-hidden hover:border-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 group flex flex-col"
                                >
                                    {/* Card Header */}
                                    <div className="h-32 bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-6 relative flex flex-col justify-between">
                                        <div className="absolute inset-0 bg-[#0B1121]/50 backdrop-blur-sm" />

                                        <div className="relative z-10 flex justify-between items-start">
                                            <span className="px-2.5 py-1 bg-white/10 text-white text-xs font-semibold rounded-lg backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                                                {exam.proctoring_enabled ? <Video className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                                {exam.proctoring_enabled ? 'Proctored' : 'Standard'}
                                            </span>
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border backdrop-blur-md ${exam.status === 'published'
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}>
                                                {exam.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="mb-4">
                                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                                                {exam.title}
                                            </h3>
                                            <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">
                                                {exam.description}
                                            </p>
                                        </div>

                                        {/* Exam Code Display */}
                                        {exam.status === 'published' && (
                                            <div className="mb-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                                                <p className="text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wider">Exam Code</p>
                                                <p className="text-lg font-mono font-bold text-blue-400 tracking-wider flex items-center justify-between">
                                                    {exam.code}
                                                    <button
                                                        onClick={() => copyToClipboard(exam.code, 'code')}
                                                        className="text-slate-500 hover:text-white transition-colors"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                </p>
                                            </div>
                                        )}

                                        {/* Meta Info */}
                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                            <div className="flex items-center gap-2 text-xs text-slate-500 bg-[#1A2333] px-3 py-2 rounded-lg border border-white/5">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                {exam.duration} mins
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 bg-[#1A2333] px-3 py-2 rounded-lg border border-white/5">
                                                <FileText className="w-4 h-4 text-slate-400" />
                                                {exam.question_count || 0} Qs
                                            </div>
                                        </div>

                                        {/* Footer & Actions */}
                                        <div className="mt-auto pt-4 border-t border-white/5 space-y-2">
                                            {/* Admin/Teacher Options */}
                                            {['admin', 'teacher'].includes(userRole) ? (
                                                <>
                                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                                        <button
                                                            onClick={() => copyToClipboard(getExamLink(exam.code), 'link')}
                                                            className="flex items-center justify-center gap-2 py-2 px-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 rounded-lg text-xs font-bold border border-blue-500/20 hover:border-blue-500/30 transition-all col-span-2"
                                                        >
                                                            <Link2 className="w-3.5 h-3.5" />
                                                            Copy Exam Link
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2">
                                                        <Link href={`/exams/${exam.id}/edit`}>
                                                            <button className="w-full py-2 bg-[#1A2333] hover:bg-[#1F2937] text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-1.5">
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                                Edit
                                                            </button>
                                                        </Link>
                                                        <Link href={`/exams/${exam.id}/questions`}>
                                                            <button className="w-full py-2 bg-[#1A2333] hover:bg-[#1F2937] text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-1.5">
                                                                <ListChecks className="w-3.5 h-3.5" />
                                                                Questions
                                                            </button>
                                                        </Link>
                                                    </div>
                                                </>
                                            ) : (
                                                /* Student Options */
                                                <Link href={`/exam/${exam.code}`} className="block">
                                                    <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-600/20 group-hover:shadow-blue-600/40 transform group-hover:-translate-y-0.5">
                                                        Start Exam
                                                    </button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Empty State */}
                        {filteredExams.length === 0 && !loading && (
                            <div className="text-center py-20 bg-[#131B2D] rounded-3xl border border-white/5 border-dashed">
                                <div className="w-20 h-20 bg-[#1A2333] rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                                    <FileX className="w-10 h-10 text-slate-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">No exams found</h3>
                                <p className="text-slate-400 mb-6">
                                    {searchQuery ? 'Try adjusting your search' : 'No exams available yet'}
                                </p>
                                {['admin', 'teacher'].includes(userRole) && (
                                    <Link href="/exams/create">
                                        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors">
                                            Create First Exam
                                        </button>
                                    </Link>
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}
