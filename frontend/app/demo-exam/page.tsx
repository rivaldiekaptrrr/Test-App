'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProctoringWrapper } from '@/components/exam/ProctoringWrapper'
import { Info } from 'lucide-react'

// Sample exam data
const sampleExam = {
    id: '00000000-0000-0000-0000-000000000002',
    title: 'Sample Programming Test',
    durationMinutes: 60,
    questions: [
        {
            id: 'q1',
            type: 'multiple_choice',
            question_text: 'What is Golang primarily used for?',
            options: [
                { id: 'a', text: 'Backend Development', is_correct: true },
                { id: 'b', text: 'Mobile Apps', is_correct: false },
                { id: 'c', text: 'Game Development', is_correct: false },
                { id: 'd', text: 'Data Analysis', is_correct: false },
            ],
            points: 10,
        },
        {
            id: 'q2',
            type: 'essay',
            question_text: 'Explain the concept of goroutines in Go and how they differ from traditional threads.',
            max_length: 500,
            points: 20,
        },
        {
            id: 'q3',
            type: 'multiple_choice',
            question_text: 'Which of the following is true about channels in Go?',
            options: [
                { id: 'a', text: 'They are used for inter-goroutine communication', is_correct: true },
                { id: 'b', text: 'They can only send data, not receive', is_correct: false },
                { id: 'c', text: 'They are not type-safe', is_correct: false },
                { id: 'd', text: 'They cannot be buffered', is_correct: false },
            ],
            points: 10,
        },
    ],
}

export default function SampleExamPage() {
    const router = useRouter()
    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [sessionId] = useState('demo-session-' + Date.now())

    const examConfig = {
        cameraRequired: true,
        screenshotInterval: 30,
        tabSwitchAllowed: 2,
        durationMinutes: sampleExam.durationMinutes,
        startTime: new Date(),
    }

    const handleAnswer = (questionId: string, answer: any) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer,
        }))
    }

    const handleSubmit = () => {
        console.log('Submitting exam with answers:', answers)
        alert('Exam submitted successfully!')
        router.push('/')
    }

    const handleExamBlocked = () => {
        alert('Exam has been blocked due to policy violations!')
        router.push('/')
    }

    const handleTimeUp = () => {
        alert('Time is up! Auto-submitting exam...')
        handleSubmit()
    }

    const currentQ = sampleExam.questions[currentQuestion]

    return (
        <ProctoringWrapper
            sessionId={sessionId}
            examConfig={examConfig}
            onExamBlocked={handleExamBlocked}
            onTimeUp={handleTimeUp}
        >
            <div className="max-w-4xl mx-auto pb-20">
                {/* Header */}
                <div className="bg-[#131B2D] border border-white/5 rounded-2xl shadow-xl p-8 mb-8 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">{sampleExam.title}</h1>
                    <p className="text-slate-400 mt-2 font-medium">
                        Question {currentQuestion + 1} of {sampleExam.questions.length}
                    </p>
                    <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
                        <p className="text-sm text-blue-200 leading-relaxed">
                            <strong>Assessment Mode Active:</strong> This exam is proctored. Your camera, screen, and audio are being monitored. Do not switch tabs or leave the window.
                        </p>
                    </div>
                </div>

                {/* Question Card */}
                <div className="bg-[#131B2D] border border-white/5 rounded-2xl shadow-xl p-8 mb-8 relative">
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <span className="inline-block bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                                {currentQ.type.replace('_', ' ')}
                            </span>
                            <span className="text-slate-500 text-sm font-semibold">{currentQ.points} Points</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white leading-snug">
                            {currentQ.question_text}
                        </h2>
                    </div>

                    {/* Multiple Choice */}
                    {currentQ.type === 'multiple_choice' && currentQ.options && (
                        <div className="space-y-4">
                            {currentQ.options.map((option: any) => (
                                <label
                                    key={option.id}
                                    className={`flex items-center p-5 border rounded-xl cursor-pointer transition-all duration-200 group ${answers[currentQ.id] === option.id
                                        ? 'border-blue-500 bg-blue-600/10 ring-1 ring-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                        : 'border-white/5 bg-[#0B1121] hover:bg-[#1A2438] hover:border-white/10'
                                        }`}
                                >
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${answers[currentQ.id] === option.id
                                        ? 'border-blue-500 bg-blue-500'
                                        : 'border-slate-600 group-hover:border-slate-500'
                                        }`}>
                                        {answers[currentQ.id] === option.id && (
                                            <div className="w-2.5 h-2.5 bg-white rounded-full" />
                                        )}
                                    </div>
                                    <span className={`ml-4 text-lg ${answers[currentQ.id] === option.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                                        {option.text}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}

                    {/* Essay */}
                    {currentQ.type === 'essay' && (
                        <div>
                            <textarea
                                value={answers[currentQ.id] || ''}
                                onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
                                placeholder="Type your answer here..."
                                className="w-full h-64 p-6 bg-[#0B1121] border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none shadow-inner leading-relaxed"
                                maxLength={currentQ.max_length || 1000}
                            />
                            <div className="flex justify-between mt-3 text-xs font-semibold uppercase tracking-wider">
                                <span className="text-slate-500">Markdown supported</span>
                                <span className={`${(answers[currentQ.id] || '').length > (currentQ.max_length || 1000) * 0.9 ? 'text-amber-400' : 'text-slate-500'}`}>
                                    {(answers[currentQ.id] || '').length} / {currentQ.max_length || 1000} chars
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center mb-10">
                    <button
                        onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestion === 0}
                        className="px-8 py-4 bg-[#1F2937] text-white rounded-xl font-bold hover:bg-[#374151] transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/5 hover:-translate-y-0.5"
                    >
                        ← Previous
                    </button>

                    {currentQuestion === sampleExam.questions.length - 1 ? (
                        <button
                            onClick={handleSubmit}
                            className="px-10 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5 hover:shadow-emerald-600/40"
                        >
                            Submit Exam
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentQuestion(prev => Math.min(sampleExam.questions.length - 1, prev + 1))}
                            className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 hover:shadow-blue-600/40"
                        >
                            Next →
                        </button>
                    )}
                </div>

                {/* Progress */}
                <div className="bg-[#131B2D] border border-white/5 rounded-xl shadow-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Progress</span>
                        <span className="text-sm text-white font-mono bg-[#0B1121] px-2 py-1 rounded border border-white/5">
                            {Object.keys(answers).length} / {sampleExam.questions.length} answered
                        </span>
                    </div>
                    <div className="w-full bg-[#0B1121] rounded-full h-2.5 overflow-hidden border border-white/5">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500 ease-out relative"
                            style={{
                                width: `${(Object.keys(answers).length / sampleExam.questions.length) * 100}%`,
                            }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse-slow"></div>
                        </div>
                    </div>
                </div>
            </div>
        </ProctoringWrapper>
    )
}
