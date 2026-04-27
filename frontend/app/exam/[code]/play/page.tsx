'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageLoading } from '@/components/Loading'
import { Timer, ArrowLeft, ArrowRight, Save, Check } from 'lucide-react'
import { getAuthToken, getCurrentUser } from '@/lib/db/client'

interface Question {
    id: string
    question_text: string
    question_type: string
    points: number
    order_index: number
    options?: Array<{
        id: string
        option_text: string
        order_index: number
    }>
}

export default function TakeExamPage() {
    const params = useParams()
    const router = useRouter()
    const examCode = params.code as string

    const [loading, setLoading] = useState(true)
    const [exam, setExam] = useState<any>(null)
    const [questions, setQuestions] = useState<Question[]>([])
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [timeRemaining, setTimeRemaining] = useState(0)
    const [submitting, setSubmitting] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchExamAndStart()
    }, [examCode])

    // Timer
    useEffect(() => {
        // JANGAN mulai timer jika data sedang loading atau belum ada soal
        if (loading || questions.length === 0 || timeRemaining <= 0) return

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timer)
                    console.log('⏰ Time is up! Auto-submitting...');
                    submitExam(true) // Auto-submit
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [timeRemaining, loading, questions.length])

    const fetchExamAndStart = async () => {
        setLoading(true)
        try {
            const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
            if (isDemo) {
                alert('Please enable database mode for real exams')
                router.push('/exams')
                return
            }

            const token = getAuthToken()
            const user = getCurrentUser()

            if (!user) {
                router.push(`/login?redirect=/exam/${examCode}/play`)
                return
            }

            // Fetch Exam Play Data (Session, Questions, Options, Timer)
            const res = await fetch(`/api/exams/play/${examCode}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            const data = await res.json()

            if (!res.ok) {
                if (res.status === 403 && data.completed) {
                    alert('You have already completed this exam.')
                    router.push('/dashboard')
                    return
                }
                throw new Error(data.error || 'Failed to load exam')
            }

            setExam(data.exam)
            setSessionId(data.session.id)
            setQuestions(data.questions)
            setAnswers(data.session.answers || {})
            setTimeRemaining(data.session.remainingSeconds)

            console.log('✅ Exam loaded:', data.exam.title)
            console.log('✅ Session ID set to:', data.session.id)

        } catch (error: any) {
            console.error('Error starting exam:', error)
            alert('Failed to start exam: ' + error.message)
            router.push('/dashboard')
        } finally {
            setLoading(false)
        }
    }

    const handleAnswer = (questionId: string, answer: any) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }))
        // In a real app, you would debounce save to server here
    }

    const submitExam = async (autoSubmit = false) => {
        // Validation check before submit (unless auto-submit)
        if (!autoSubmit) {
            const unanswered = questions.length - Object.keys(answers).length
            if (unanswered > 0) {
                if (!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) {
                    return
                }
            } else {
                if (!confirm('Submit your exam? You cannot change your answers after submission.')) {
                    return
                }
            }
        }

        setSubmitting(true)
        try {
            const token = getAuthToken()

            const res = await fetch('/api/exams/session/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    sessionId,
                    answers
                })
            })

            const result = await res.json()

            if (!res.ok) {
                throw new Error(result.error || 'Submission failed')
            }

            alert(`Exam submitted! Your score: ${Number(result.score).toFixed(1)}%`)
            router.push('/dashboard') // Redirect to dashboard or results

        } catch (error: any) {
            console.error('Error submitting exam:', error)
            alert('Failed to submit exam: ' + error.message)
        } finally {
            setSubmitting(false)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (loading) return <PageLoading title="Loading exam..." />

    if (!exam || questions.length === 0) {
        return (
            <div className="min-h-screen bg-[#0B1121] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-white mb-4">No questions available or Error loading.</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    const currentQuestion = questions[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100

    return (
        <div className="min-h-screen bg-[#0B1121] text-slate-100">
            {/* Header with Timer */}
            <header className="bg-[#0F1623] border-b border-white/5 sticky top-0 z-30 backdrop-blur-md">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-bold text-white">{exam.title}</h1>
                            <p className="text-sm text-slate-400">Question {currentQuestionIndex + 1} of {questions.length}</p>
                        </div>

                        {/* Timer & Status */}
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-3 px-4 py-2 rounded-xl font-mono text-lg font-bold ${timeRemaining < 300 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                }`}>
                                <Timer className="w-5 h-5" />
                                {formatTime(timeRemaining)}
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 h-2 bg-[#1A2333] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">
                {/* Question Card */}
                <div className="bg-[#131B2D] rounded-2xl border border-white/5 p-8 mb-6">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-400 font-bold">{currentQuestionIndex + 1}</span>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-start justify-between mb-4">
                                <h2 className="text-2xl font-semibold text-white">{currentQuestion.question_text}</h2>
                                <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-sm font-semibold border border-purple-500/20">
                                    {currentQuestion.points} pt{currentQuestion.points !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {/* Answer Options */}
                            <div className="space-y-3 mt-6">
                                {/* Multiple Choice & True/False */}
                                {(currentQuestion.question_type === 'multiple_choice' || currentQuestion.question_type === 'true_false') && currentQuestion.options && (
                                    currentQuestion.options.map((option, index) => (
                                        <button
                                            key={option.id}
                                            onClick={() => handleAnswer(currentQuestion.id, option.id)}
                                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${answers[currentQuestion.id] === option.id
                                                ? 'border-blue-500 bg-blue-500/10'
                                                : 'border-white/10 hover:border-white/20 bg-[#1A2333]'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${answers[currentQuestion.id] === option.id
                                                    ? 'border-blue-500 bg-blue-500'
                                                    : 'border-slate-500'
                                                    }`}>
                                                    {answers[currentQuestion.id] === option.id && (
                                                        <div className="w-2 h-2 bg-white rounded-full" />
                                                    )}
                                                </div>
                                                <span className="font-mono text-slate-400 font-semibold">{String.fromCharCode(65 + index)}</span>
                                                <span className="text-slate-200">{option.option_text}</span>
                                            </div>
                                        </button>
                                    ))
                                )}

                                {/* Essay */}
                                {currentQuestion.question_type === 'essay' && (
                                    <textarea
                                        value={answers[currentQuestion.id] || ''}
                                        onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                                        rows={8}
                                        className="w-full px-4 py-3 bg-[#1A2333] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                        placeholder="Type your answer here..."
                                    />
                                )}

                                {/* Short Answer */}
                                {currentQuestion.question_type === 'short_answer' && (
                                    <input
                                        type="text"
                                        value={answers[currentQuestion.id] || ''}
                                        onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                                        className="w-full px-4 py-3 bg-[#1A2333] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Type your answer..."
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between gap-4">
                    <button
                        onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="px-6 py-3 border border-white/10 text-slate-300 rounded-xl font-semibold hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Previous
                    </button>

                    {/* Question Navigator */}
                    <div className="flex gap-2 overflow-x-auto py-2 px-4">
                        {questions.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentQuestionIndex(index)}
                                className={`w-10 h-10 rounded-lg font-semibold transition-all ${index === currentQuestionIndex
                                    ? 'bg-blue-600 text-white'
                                    : answers[questions[index].id]
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-[#1A2333] text-slate-400 border border-white/10 hover:border-white/20'
                                    }`}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>

                    {currentQuestionIndex < questions.length - 1 ? (
                        <button
                            onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 transition-all flex items-center gap-2"
                        >
                            Next
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={() => submitExam(false)}
                            disabled={submitting}
                            className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-bold hover:from-emerald-500 hover:to-green-500 shadow-lg shadow-emerald-600/25 disabled:opacity-50 transition-all"
                        >
                            {submitting ? 'Submitting...' : 'Submit Exam'}
                        </button>
                    )}
                </div>

                {/* Answer Summary */}
                <div className="mt-6 p-4 bg-[#131B2D] rounded-xl border border-white/5">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Answered:</span>
                        <span className="font-semibold text-emerald-400">{Object.keys(answers).length} / {questions.length}</span>
                    </div>
                </div>
            </main>
        </div>
    )
}
