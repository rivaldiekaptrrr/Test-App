'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAuthToken, isDemoMode } from '@/lib/db/client'
import { PageLoading } from '@/components/Loading'
import { extractKeywords } from '@/lib/utils/autoGrading'
import {
    ChevronLeft,
    Plus,
    Edit3,
    Trash2,
    Check,
    X,
    HelpCircle,
    ListCheck,
    ToggleRight,
    FileText,
    PenTool,
    Brain,
    User,
    Tag
} from 'lucide-react'

interface Question {
    id: string
    question_text: string
    question_type: 'multiple_choice' | 'true_false' | 'essay' | 'short_answer'
    points: number
    order_number: number
    explanation?: string
    options?: QuestionOption[]
}

interface QuestionOption {
    id?: string
    option_text: string
    is_correct: boolean
    order_number: number
}

export default function ManageQuestionsPage() {
    const params = useParams()
    const router = useRouter()
    const examId = params.id as string

    const [exam, setExam] = useState<any>(null)
    const [questions, setQuestions] = useState<Question[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showQuestionModal, setShowQuestionModal] = useState(false)
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)

    const [questionForm, setQuestionForm] = useState({
        question_text: '',
        question_type: 'multiple_choice' as Question['question_type'],
        points: 1,
        explanation: '',
        grading_type: 'manual' as 'manual' | 'auto_keywords',
        expected_answer: '',
        keywords: [] as string[],
        options: [
            { option_text: '', is_correct: false, order_number: 1 },
            { option_text: '', is_correct: false, order_number: 2 },
            { option_text: '', is_correct: false, order_number: 3 },
            { option_text: '', is_correct: false, order_number: 4 }
        ]
    })

    useEffect(() => {
        fetchExamAndQuestions()
    }, [examId])

    const fetchExamAndQuestions = async () => {
        setLoading(true)
        try {
            const demo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
            if (demo) {
                setExam({ id: examId, code: 'DEMO2026', title: 'Demo Exam', status: 'draft' })
                setQuestions([])
                setLoading(false)
                return
            }

            const token = getAuthToken()
            if (!token) {
                router.push('/login')
                return
            }

            // 1. Fetch Exam Details
            const examRes = await fetch(`/api/exams/${examId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (!examRes.ok) {
                const errorData = await examRes.json().catch(() => ({}))
                if (examRes.status === 404) {
                    alert('Exam not found!')
                    router.push('/exams')
                    return
                }
                throw new Error(errorData.error || 'Failed to fetch exam')
            }
            const { exam } = await examRes.json()
            setExam(exam)

            // 2. Fetch Questions
            const qRes = await fetch(`/api/exams/questions/${examId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (!qRes.ok) {
                const errorData = await qRes.json().catch(() => ({}))
                throw new Error(errorData.error || 'Failed to fetch questions')
            }

            const { questions: fetchedQuestions } = await qRes.json()
            setQuestions(fetchedQuestions)

        } catch (error: any) {
            console.error('Error fetching data:', error)
            alert('Failed to load data: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const openQuestionModal = (question?: Question) => {
        if (question) {
            setEditingQuestion(question)

            // For editing: Use existing options or create default ones
            let optionsToUse = question.options || []

            // If no options exist but question type requires them, create defaults
            if (optionsToUse.length === 0) {
                if (question.question_type === 'multiple_choice') {
                    optionsToUse = [
                        { option_text: '', is_correct: false, order_number: 1 },
                        { option_text: '', is_correct: false, order_number: 2 },
                        { option_text: '', is_correct: false, order_number: 3 },
                        { option_text: '', is_correct: false, order_number: 4 }
                    ]
                } else if (question.question_type === 'true_false') {
                    optionsToUse = [
                        { option_text: 'True', is_correct: false, order_number: 1 },
                        { option_text: 'False', is_correct: false, order_number: 2 }
                    ]
                }
            }

            setQuestionForm({
                question_text: question.question_text,
                question_type: question.question_type,
                points: question.points,
                explanation: question.explanation || '',
                grading_type: (question as any).grading_type || 'manual',
                expected_answer: (question as any).expected_answer || '',
                keywords: (question as any).keywords || [],
                options: optionsToUse
            })
        } else {
            setEditingQuestion(null)
            setQuestionForm({
                question_text: '',
                question_type: 'multiple_choice',
                points: 1,
                explanation: '',
                grading_type: 'manual',
                expected_answer: '',
                keywords: [],
                options: [
                    { option_text: '', is_correct: false, order_number: 1 },
                    { option_text: '', is_correct: false, order_number: 2 },
                    { option_text: '', is_correct: false, order_number: 3 },
                    { option_text: '', is_correct: false, order_number: 4 }
                ]
            })
        }
        setShowQuestionModal(true)
    }

    const saveQuestion = async () => {
        setSaving(true)
        try {
            const demo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
            if (demo) {
                alert('Demo Mode: Question saved (not persisted)')
                setShowQuestionModal(false)
                return
            }

            const token = getAuthToken()

            if (editingQuestion) {
                // Update existing question
                const res = await fetch(`/api/questions/${editingQuestion.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        question_text: questionForm.question_text,
                        question_type: questionForm.question_type,
                        points: questionForm.points,
                        explanation: questionForm.explanation,
                        options: (questionForm.question_type === 'multiple_choice' || questionForm.question_type === 'true_false')
                            ? questionForm.options
                            : []
                    })
                })

                if (!res.ok) {
                    const err = await res.json()
                    throw new Error(err.error || 'Failed to update question')
                }

            } else {
                // Create new question
                const res = await fetch(`/api/exams/questions/${examId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        question_text: questionForm.question_text,
                        question_type: questionForm.question_type,
                        points: questionForm.points,
                        explanation: questionForm.explanation,
                        order_index: questions.length + 1,
                        options: (questionForm.question_type === 'multiple_choice' || questionForm.question_type === 'true_false')
                            ? questionForm.options
                            : []
                    })
                })

                if (!res.ok) {
                    const err = await res.json()
                    throw new Error(err.error || 'Failed to create question')
                }
            }

            setShowQuestionModal(false)
            fetchExamAndQuestions()

        } catch (error: any) {
            console.error('Error saving question:', error)
            alert('Failed to save question: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    const deleteQuestion = async (questionId: string) => {
        if (!confirm('Are you sure you want to delete this question?')) return

        try {
            const demo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
            if (demo) {
                alert('Demo Mode: Question deleted (not persisted)')
                return
            }

            const token = getAuthToken()
            const res = await fetch(`/api/questions/${questionId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to delete question')
            }

            fetchExamAndQuestions()
        } catch (error: any) {
            console.error('Error deleting question:', error)
            alert('Failed to delete question: ' + error.message)
        }
    }

    const publishExam = async () => {
        if (questions.length === 0) {
            alert('Please add at least one question before publishing!')
            return
        }

        if (!confirm('Publish this exam? Students will be able to access it.')) return

        try {
            const demo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
            if (demo) {
                alert('Demo Mode: Exam published (not persisted)')
                router.push('/exams')
                return
            }

            const token = getAuthToken()
            const res = await fetch(`/api/exams/${examId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'published' })
            })

            if (!res.ok) throw new Error('Failed to publish exam')

            alert('Exam published successfully!')
            router.push('/exams')
        } catch (error: any) {
            console.error('Error publishing exam:', error)
            alert('Failed to publish exam: ' + error.message)
        }
    }

    if (loading) return <PageLoading title="Loading exam..." />

    return (
        <div className="min-h-screen bg-[#0B1121] text-slate-100">
            {/* Header */}
            <header className="bg-[#0F1623] border-b border-white/5 sticky top-0 z-30 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Link href="/exams" className="text-slate-400 hover:text-white text-xs uppercase tracking-wider font-semibold mb-1 inline-flex items-center gap-1 transition-colors group">
                                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Back to Exams
                            </Link>
                            <div className="flex items-center gap-4">
                                <h1 className="text-2xl font-bold text-white tracking-tight">{exam?.title}</h1>
                                <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${exam?.status === 'published'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    }`}>
                                    {exam?.status}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-400">
                                {questions.length} question{questions.length !== 1 ? 's' : ''}
                            </span>
                            {exam?.status === 'draft' && (
                                <button
                                    onClick={publishExam}
                                    className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg font-semibold hover:from-emerald-500 hover:to-green-500 transition-all shadow-lg shadow-emerald-600/25"
                                >
                                    Publish Exam
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Add Question Button */}
                <button
                    onClick={() => openQuestionModal()}
                    className="w-full mb-6 p-6 border-2 border-dashed border-white/10 rounded-2xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                >
                    <div className="flex items-center justify-center gap-3 text-slate-400 group-hover:text-blue-400">
                        <Plus className="w-6 h-6" />
                        <span className="font-semibold">Add New Question</span>
                    </div>
                </button>

                {/* Questions List */}
                <div className="space-y-4">
                    {questions.map((question, index) => (
                        <div key={question.id} className="bg-[#131B2D] rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-all">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-blue-400 font-bold">{index + 1}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <p className="text-lg font-semibold text-white mb-2">{question.question_text}</p>
                                            <div className="flex items-center gap-3 text-sm">
                                                <span className={`px-2.5 py-1 rounded-lg font-medium ${question.question_type === 'multiple_choice'
                                                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                    : question.question_type === 'true_false'
                                                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                    }`}>
                                                    {question.question_type.replace('_', ' ')}
                                                </span>
                                                <span className="text-slate-400">{question.points} point{question.points !== 1 ? 's' : ''}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openQuestionModal(question)}
                                                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit3 className="w-5 h-5 text-slate-400 hover:text-blue-400" />
                                            </button>
                                            <button
                                                onClick={() => deleteQuestion(question.id)}
                                                className="p-2 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-5 h-5 text-slate-400 hover:text-rose-400" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Options Preview */}
                                    {question.options && question.options.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            {question.options.map((option: any, optIndex: number) => (
                                                <div key={option.id || optIndex} className={`flex items-center gap-3 p-3 rounded-lg border ${option.is_correct
                                                    ? 'bg-emerald-500/5 border-emerald-500/20'
                                                    : 'bg-[#1A2333] border-white/5'
                                                    }`}>
                                                    <span className="text-slate-400 font-mono text-sm">{String.fromCharCode(65 + optIndex)}</span>
                                                    <span className={option.is_correct ? 'text-emerald-400 font-medium' : 'text-slate-300'}>{option.option_text}</span>
                                                    {option.is_correct && (
                                                        <Check className="w-5 h-5 text-emerald-400 ml-auto" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {question.explanation && (
                                        <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                                            <p className="text-xs text-slate-400 mb-1 font-semibold uppercase">Explanation</p>
                                            <p className="text-sm text-slate-300">{question.explanation}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {questions.length === 0 && (
                    <div className="text-center py-16 bg-[#131B2D] rounded-3xl border border-white/5 border-dashed">
                        <div className="w-20 h-20 bg-[#1A2333] rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                            <HelpCircle className="w-10 h-10 text-slate-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No questions yet</h3>
                        <p className="text-slate-400 mb-6">Add your first question to get started</p>
                        <button
                            onClick={() => openQuestionModal()}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/25"
                        >
                            Add Question
                        </button>
                    </div>
                )}
            </main>

            {/* Question Modal */}
            {showQuestionModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-[#0F1623] rounded-2xl border border-white/10 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-[#0F1623] border-b border-white/5 p-6 flex items-center justify-between z-10">
                            <h2 className="text-xl font-bold text-white">
                                {editingQuestion ? 'Edit Question' : 'Add New Question'}
                            </h2>
                            <button
                                onClick={() => setShowQuestionModal(false)}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Question Type */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-3">Question Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { value: 'multiple_choice', label: 'Multiple Choice', icon: <ListCheck className="w-6 h-6" /> },
                                        { value: 'true_false', label: 'True/False', icon: <ToggleRight className="w-6 h-6" /> },
                                        { value: 'essay', label: 'Essay', icon: <FileText className="w-6 h-6" /> },
                                        { value: 'short_answer', label: 'Short Answer', icon: <PenTool className="w-6 h-6" /> }
                                    ].map((type) => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => {
                                                // Reset options when changing type
                                                let newOptions = questionForm.options
                                                if (type.value === 'multiple_choice' && questionForm.question_type !== 'multiple_choice') {
                                                    newOptions = [
                                                        { option_text: '', is_correct: false, order_number: 1 },
                                                        { option_text: '', is_correct: false, order_number: 2 },
                                                        { option_text: '', is_correct: false, order_number: 3 },
                                                        { option_text: '', is_correct: false, order_number: 4 }
                                                    ]
                                                } else if (type.value === 'true_false' && questionForm.question_type !== 'true_false') {
                                                    newOptions = [
                                                        { option_text: 'True', is_correct: false, order_number: 1 },
                                                        { option_text: 'False', is_correct: false, order_number: 2 }
                                                    ]
                                                }
                                                setQuestionForm({ ...questionForm, question_type: type.value as any, options: newOptions })
                                            }}
                                            className={`p-4 rounded-xl border-2 transition-all ${questionForm.question_type === type.value
                                                ? 'border-blue-500 bg-blue-500/10'
                                                : 'border-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            <div className="text-blue-400 mb-2 flex justify-center">{type.icon}</div>
                                            <div className="text-sm font-semibold text-white">{type.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Question Text */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Question *</label>
                                <textarea
                                    required
                                    value={questionForm.question_text}
                                    onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-[#1A2333] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    placeholder="What is the capital of France?"
                                />
                            </div>

                            {/* Points */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Points</label>
                                <input
                                    type="number"
                                    min="0.5"
                                    step="0.5"
                                    value={questionForm.points}
                                    onChange={(e) => setQuestionForm({ ...questionForm, points: parseFloat(e.target.value) })}
                                    className="w-full px-4 py-3 bg-[#1A2333] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Grading Configuration (for Essay/Short Answer) */}
                            {(questionForm.question_type === 'essay' || questionForm.question_type === 'short_answer') && (
                                <div className="space-y-4 p-5 bg-[#1A2438] rounded-xl border border-white/10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Brain className="w-5 h-5 text-purple-400" />
                                        <h3 className="text-sm font-bold text-white">Grading Configuration</h3>
                                    </div>

                                    {/* Grading Type Selector */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-300 mb-3">Grading Method</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setQuestionForm({ ...questionForm, grading_type: 'manual' })}
                                                className={`p-4 rounded-xl border-2 transition-all ${questionForm.grading_type === 'manual'
                                                    ? 'border-blue-500 bg-blue-500/10'
                                                    : 'border-white/10 hover:border-white/20'
                                                    }`}
                                            >
                                                <div className="text-blue-400 mb-2 flex justify-center">
                                                    <User className="w-6 h-6" />
                                                </div>
                                                <div className="text-sm font-semibold text-white">Manual Grading</div>
                                                <p className="text-xs text-slate-400 mt-1">Admin will grade manually</p>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setQuestionForm({ ...questionForm, grading_type: 'auto_keywords' })}
                                                className={`p-4 rounded-xl border-2 transition-all ${questionForm.grading_type === 'auto_keywords'
                                                    ? 'border-purple-500 bg-purple-500/10'
                                                    : 'border-white/10 hover:border-white/20'
                                                    }`}
                                            >
                                                <div className="text-purple-400 mb-2 flex justify-center">
                                                    <Brain className="w-6 h-6" />
                                                </div>
                                                <div className="text-sm font-semibold text-white">Auto Keywords</div>
                                                <p className="text-xs text-slate-400 mt-1">System grades by keyword matching</p>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Auto-Grading Options */}
                                    {questionForm.grading_type === 'auto_keywords' && (
                                        <div className="space-y-4 pt-3 border-t border-white/10">
                                            {/* Expected Answer */}
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-300 mb-2">
                                                    Expected Answer *
                                                </label>
                                                <textarea
                                                    required={questionForm.grading_type === 'auto_keywords'}
                                                    value={questionForm.expected_answer}
                                                    onChange={(e) => {
                                                        const newAnswer = e.target.value
                                                        setQuestionForm({ ...questionForm, expected_answer: newAnswer })

                                                        // Auto-extract keywords when answer changes
                                                        if (newAnswer.trim().length > 10) {
                                                            const extracted = extractKeywords(newAnswer)
                                                            setQuestionForm(prev => ({ ...prev, keywords: extracted }))
                                                        }
                                                    }}
                                                    rows={4}
                                                    className="w-full px-4 py-3 bg-[#131B2D] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                                    placeholder="Type the correct/expected answer here. Keywords will be extracted automatically..."
                                                />
                                                <p className="text-xs text-slate-400 mt-2">
                                                    💡 System will extract keywords from this answer for matching
                                                </p>
                                            </div>

                                            {/* Keywords Display & Edit */}
                                            {questionForm.keywords.length > 0 && (
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                                            <Tag className="w-4 h-4" />
                                                            Extracted Keywords ({questionForm.keywords.length})
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (questionForm.expected_answer) {
                                                                    const extracted = extractKeywords(questionForm.expected_answer)
                                                                    setQuestionForm({ ...questionForm, keywords: extracted })
                                                                }
                                                            }}
                                                            className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
                                                        >
                                                            Re-extract
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {questionForm.keywords.map((keyword, index) => (
                                                            <div
                                                                key={index}
                                                                className="px-3 py-1.5 bg-purple-500/10 text-purple-300 rounded-lg text-sm font-medium border border-purple-500/20 flex items-center gap-2 group"
                                                            >
                                                                <span>{keyword}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newKeywords = questionForm.keywords.filter((_, i) => i !== index)
                                                                        setQuestionForm({ ...questionForm, keywords: newKeywords })
                                                                    }}
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <X className="w-3 h-3 text-purple-400 hover:text-rose-400" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-2">
                                                        📊 Student answers will be matched against these keywords. Click X to remove.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {questionForm.grading_type === 'manual' && (
                                        <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                                            <p className="text-xs text-slate-300">
                                                ✏️ <span className="font-semibold">Manual Grading:</span> You will grade this question manually after students submit their answers. Points will not be auto-calculated.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Options (for MC & T/F) */}
                            {(questionForm.question_type === 'multiple_choice' || questionForm.question_type === 'true_false') && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-3">
                                        Answer Options *
                                    </label>
                                    <div className="space-y-3">
                                        {questionForm.options.map((option, index) => (
                                            <div key={index} className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={option.is_correct}
                                                    onChange={(e) => {
                                                        const newOptions = [...questionForm.options]
                                                        newOptions[index].is_correct = e.target.checked
                                                        setQuestionForm({ ...questionForm, options: newOptions })
                                                    }}
                                                    className="w-5 h-5 rounded border-slate-600 bg-[#1A2333] checked:bg-emerald-600 focus:ring-2 focus:ring-emerald-500"
                                                />
                                                <input
                                                    type="text"
                                                    required
                                                    value={option.option_text}
                                                    onChange={(e) => {
                                                        const newOptions = [...questionForm.options]
                                                        newOptions[index].option_text = e.target.value
                                                        setQuestionForm({ ...questionForm, options: newOptions })
                                                    }}
                                                    disabled={questionForm.question_type === 'true_false'}
                                                    className="flex-1 px-4 py-3 bg-[#1A2333] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">Check the box for correct answer(s)</p>
                                </div>
                            )}

                            {/* Explanation */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">
                                    Explanation (Optional)
                                </label>
                                <textarea
                                    value={questionForm.explanation}
                                    onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-3 bg-[#1A2333] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    placeholder="Explain why the answer is correct..."
                                />
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-white/10 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowQuestionModal(false)}
                                    className="flex-1 py-3 text-center border border-white/10 text-slate-400 rounded-xl font-bold hover:bg-white/5 hover:text-white transition-all"
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={saveQuestion}
                                    disabled={saving}
                                    className="flex-[2] py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {saving ? 'Saving...' : 'Save Question'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
