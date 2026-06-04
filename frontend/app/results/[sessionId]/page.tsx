'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAuthToken, isDemoMode } from '@/lib/db/client'
import { PageLoading } from '@/components/Loading'
import { ChevronLeft, Check, X, AlertTriangle, Info } from 'lucide-react'

interface QuestionDetail {
    question_id: string
    question_text: string
    question_type: string
    points: number
    order_number: number
    student_answer: string | null
    selected_option_text: string | null
    is_correct: boolean | null
    points_earned: number
    correct_option_text: string | null
    explanation: string | null
    options: Array<{
        id: string
        option_text: string
        is_correct: boolean
        order_number: number
    }>
}

export default function DetailedAnswersPage() {
    const params = useParams()
    const router = useRouter()
    const sessionId = params.sessionId as string

    const [loading, setLoading] = useState(true)
    const [examTitle, setExamTitle] = useState('')
    const [examId, setExamId] = useState('')
    const [score, setScore] = useState(0)
    const [questions, setQuestions] = useState<QuestionDetail[]>([])
    const [isAdmin, setIsAdmin] = useState(false)
    const [gradingState, setGradingState] = useState<Record<string, { points: number, saving: boolean }>>({})

    useEffect(() => {
        fetchDetailedAnswers()
    }, [sessionId])

    const fetchDetailedAnswers = async () => {
        setLoading(true)
        try {
            const demo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
            if (demo) {
                alert('Demo mode: Detailed answers not available')
                router.push('/results')
                return
            }

            const token = getAuthToken()
            if (!token) {
                router.push('/login')
                return
            }

            const res = await fetch(`/api/results/${sessionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to load results')
            }

            setExamTitle(data.examTitle)
            setExamId(data.examId)
            setScore(data.score || 0)
            setQuestions(data.questions)
            setIsAdmin(data.isAdmin === true)
            
            // Initialize grading state
            const initialGradingState: Record<string, { points: number, saving: boolean }> = {}
            data.questions.forEach((q: QuestionDetail) => {
                if (q.question_type === 'essay' || q.question_type === 'short_answer') {
                    initialGradingState[q.question_id] = {
                        points: q.points_earned || 0,
                        saving: false
                    }
                }
            })
            setGradingState(initialGradingState)

        } catch (error: any) {
            console.error('Error fetching details:', error)
            alert('Failed to load details: ' + error.message)
            router.push('/results')
        } finally {
            setLoading(false)
        }
    }

    const handleSaveGrade = async (questionId: string) => {
        const grade = gradingState[questionId]?.points
        if (grade === undefined) return
        
        const question = questions.find(q => q.question_id === questionId)
        if (!question) return
        
        if (grade < 0 || grade > question.points) {
            alert(`Points must be between 0 and ${question.points}`)
            return
        }

        setGradingState(prev => ({ ...prev, [questionId]: { ...prev[questionId], saving: true } }))
        try {
            const token = getAuthToken()
            const res = await fetch(`/api/results/${sessionId}/grade`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question_id: questionId, points_earned: grade })
            })
            
            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error || 'Failed to save grade')
            }
            
            // Reload data to get updated final score and correct/incorrect status
            await fetchDetailedAnswers()
            alert('Grade saved successfully!')
            
        } catch (error: any) {
            console.error('Grading error:', error)
            alert('Failed to save grade: ' + error.message)
        } finally {
            setGradingState(prev => ({ ...prev, [questionId]: { ...prev[questionId], saving: false } }))
        }
    }

    if (loading) return <PageLoading title="Loading answer details..." />

    const correctCount = questions.filter(q => q.is_correct === true).length
    const wrongCount = questions.filter(q => q.is_correct === false).length
    const unansweredCount = questions.filter(q => q.is_correct === null).length

    return (
        <div className="min-h-screen bg-[#0B1121] text-slate-100">
            {/* Header */}
            <header className="bg-[#0F1623] border-b border-white/5 sticky top-0 z-30 backdrop-blur-md">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <Link href={isAdmin && examId ? `/exams/${examId}/submissions` : '/results'} className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-3 transition-colors text-sm">
                        <ChevronLeft className="w-4 h-4" />
                        Back to {isAdmin ? 'Submissions' : 'Summary'}
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white">{examTitle}</h1>
                            <p className="text-sm text-slate-400">Answer Review</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-black text-blue-400">{parseFloat(String(score || 0)).toFixed(1)}%</div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Final Score</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-emerald-400">{correctCount}</div>
                        <p className="text-xs text-emerald-400 uppercase font-bold mt-1">Correct</p>
                    </div>
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-rose-400">{wrongCount}</div>
                        <p className="text-xs text-rose-400 uppercase font-bold mt-1">Wrong</p>
                    </div>
                    <div className="bg-slate-500/10 border border-slate-500/20 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-slate-400">{unansweredCount}</div>
                        <p className="text-xs text-slate-400 uppercase font-bold mt-1">Unanswered</p>
                    </div>
                </div>

                {/* Questions List */}
                <div className="space-y-6">
                    {questions.map((q, index) => (
                        <div
                            key={q.question_id}
                            className={`bg-[#131B2D] rounded-2xl border p-6 ${q.is_correct === true ? 'border-emerald-500/20' :
                                q.is_correct === false ? 'border-rose-500/20' :
                                    'border-white/5'
                                }`}
                        >
                            {/* Question Header */}
                            <div className="flex items-start gap-4 mb-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold border-2 ${q.is_correct === true ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                    q.is_correct === false ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                                        'bg-slate-500/10 text-slate-400 border-slate-500/30'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="text-lg font-semibold text-white flex-1">{q.question_text}</h3>
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-xs font-bold border border-purple-500/20">
                                                {q.points} pts
                                            </span>
                                            {q.is_correct === true && (
                                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/20 flex items-center gap-1">
                                                    <Check className="w-3 h-3" />
                                                    Correct
                                                </span>
                                            )}
                                            {q.is_correct === false && (
                                                <span className="px-3 py-1 bg-rose-500/10 text-rose-400 rounded-lg text-xs font-bold border border-rose-500/20 flex items-center gap-1">
                                                    <X className="w-3 h-3" />
                                                    Wrong
                                                </span>
                                            )}
                                            {q.is_correct === null && (
                                                <span className="px-3 py-1 bg-slate-500/10 text-slate-400 rounded-lg text-xs font-bold border border-slate-500/20">
                                                    Unanswered
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-500 uppercase font-bold">
                                        {q.question_type.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>

                            {/* Answer Section */}
                            <div className="ml-14 space-y-4">
                                {/* Multiple Choice / True False */}
                                {(q.question_type === 'multiple_choice' || q.question_type === 'true_false') && q.options.length > 0 && (
                                    <div className="space-y-2">
                                        {q.options.map((opt, optIdx) => {
                                            const isSelected = opt.option_text === q.selected_option_text
                                            const isCorrect = opt.is_correct

                                            return (
                                                <div
                                                    key={opt.id}
                                                    className={`p-3 rounded-xl border-2 ${isCorrect ? 'border-emerald-500/30 bg-emerald-500/5' :
                                                        isSelected && !isCorrect ? 'border-rose-500/30 bg-rose-500/5' :
                                                            'border-white/5 bg-[#1A2333]'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-mono text-slate-400 text-sm">{String.fromCharCode(65 + optIdx)}</span>
                                                        <span className={`flex-1 ${isCorrect ? 'text-emerald-400 font-semibold' :
                                                            isSelected && !isCorrect ? 'text-rose-400' :
                                                                'text-slate-300'
                                                            }`}>
                                                            {opt.option_text}
                                                        </span>
                                                        {isSelected && (
                                                            <span className="text-xs text-blue-400 font-bold">Your Answer</span>
                                                        )}
                                                        {isCorrect && (
                                                            <Check className="w-5 h-5 text-emerald-400" />
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                {/* Essay / Short Answer */}
                                {(q.question_type === 'essay' || q.question_type === 'short_answer') && (
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-bold mb-2">Student Answer:</p>
                                        {q.student_answer ? (
                                            <div className="p-4 bg-[#1A2333] border border-white/10 rounded-xl mb-4">
                                                <p className="text-slate-300 whitespace-pre-wrap">{q.student_answer}</p>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-slate-500/5 border border-slate-500/20 rounded-xl text-center mb-4">
                                                <p className="text-slate-500 italic">No answer provided</p>
                                            </div>
                                        )}
                                        
                                        {isAdmin ? (
                                            <div className="flex items-center gap-4 bg-blue-500/5 p-4 rounded-xl border border-blue-500/20">
                                                <div>
                                                    <label className="block text-xs font-bold text-blue-400 uppercase mb-1">
                                                        Award Points (Max: {q.points})
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={q.points}
                                                        step={0.5}
                                                        value={gradingState[q.question_id]?.points ?? ''}
                                                        onChange={(e) => setGradingState(prev => ({ 
                                                            ...prev, 
                                                            [q.question_id]: { ...prev[q.question_id], points: parseFloat(e.target.value) } 
                                                        }))}
                                                        className="w-24 px-3 py-2 bg-[#131B2D] border border-blue-500/30 rounded-lg text-white focus:outline-none focus:border-blue-400"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleSaveGrade(q.question_id)}
                                                    disabled={gradingState[q.question_id]?.saving}
                                                    className="mt-5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                                                >
                                                    {gradingState[q.question_id]?.saving ? 'Saving...' : 'Save Grade'}
                                                </button>
                                                {q.points_earned !== null && (
                                                    <div className="mt-5 text-sm font-semibold text-emerald-400 flex items-center gap-1">
                                                        <Check className="w-4 h-4" /> Graded: {q.points_earned} pts
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" />
                                                Requires manual grading by teacher
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Explanation */}
                                {q.explanation && (
                                    <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                                        <p className="text-xs text-blue-400 uppercase font-bold mb-2 flex items-center gap-2">
                                            <Info className="w-3 h-3" />
                                            Explanation
                                        </p>
                                        <p className="text-sm text-slate-300">{q.explanation}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Back Button */}
                <div className="mt-8">
                    <Link href="/results">
                        <button className="w-full py-4 bg-[#131B2D] border border-white/10 text-white rounded-xl font-bold hover:bg-[#1A2333] hover:border-white/20 transition-all">
                            Back to Summary
                        </button>
                    </Link>
                </div>
            </main>
        </div>
    )
}
