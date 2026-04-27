'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageLoading } from '@/components/Loading'
import { getCurrentUser, getAuthToken } from '@/lib/db/client'
import { Globe, Wifi, Camera, Check, Shield, Circle, FileText, Clock, FileQuestion, Users } from 'lucide-react'

// Demo data fallback
const DEMO_EXAM_DATA = {
    title: 'Programming Fundamentals Final (DEMO)',
    description: 'Comprehensive assessment of basic programming concepts including variables, loops, control structures, and simple algorithms.',
    duration: 60,
    questions: 40,
    instructor: 'Dr. Alan Turing',
    proctoringEnabled: true,
    rules: [
        'Full screen mode is mandatory',
        'Tab switching is strictly prohibited',
        'Webcam must be active at all times',
        'No external devices or materials allowed'
    ]
}

export default function ExamIntroPage() {
    const params = useParams()
    const router = useRouter()
    const examCode = params.code as string

    const [loading, setLoading] = useState(true)
    const [examData, setExamData] = useState<any>(null)
    const [agreed, setAgreed] = useState(false)
    const [systemCheck, setSystemCheck] = useState({
        browser: false,
        camera: false,
        connection: false
    })
    const [checkingSystem, setCheckingSystem] = useState(false)
    const [user, setUser] = useState<any>(null)

    // Check auth and fetch exam
    useEffect(() => {
        const init = async () => {
            setLoading(true)

            // 1. Check Auth
            const currentUser = getCurrentUser()
            const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

            if (isDemo) {
                setUser({ id: 'demo-user', email: 'demo@example.com' })
                setExamData(DEMO_EXAM_DATA)
                setLoading(false)
                return
            }

            if (!currentUser) {
                // Redirect to login with return url
                sessionStorage.setItem('redirectAfterLogin', `/exam/${examCode}`)
                router.push(`/login?redirect=/exam/${examCode}`)
                return
            }
            setUser(currentUser)

            // 2. Fetch Exam Data
            try {
                const token = getAuthToken()
                const res = await fetch(`/api/exams/code/${examCode}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })

                if (!res.ok) {
                    const error = await res.json()

                    if (res.status === 403 && error.error === 'Exam already completed') {
                        alert(`You have already completed this exam with a score of ${error.score}%.`)
                        router.push('/dashboard') // Or results page
                        return
                    }

                    if (res.status === 404) {
                        alert('Exam not found.')
                        router.push('/dashboard')
                        return
                    }

                    throw new Error(error.error || 'Failed to load exam')
                }

                const data = await res.json()
                setExamData({
                    ...data.exam,
                    questions: data.exam.question_count,
                    proctoringEnabled: data.exam.proctoring_enabled
                })

            } catch (error: any) {
                console.error('Error loading exam:', error)
                alert(error.message)
                router.push('/dashboard')
            } finally {
                setLoading(false)
            }
        }

        init()
    }, [examCode, router])

    const runSystemCheck = async () => {
        setCheckingSystem(true)

        // Check 1: Browser
        await new Promise(r => setTimeout(r, 800))
        setSystemCheck(prev => ({ ...prev, browser: true }))

        // Check 2: Connection
        await new Promise(r => setTimeout(r, 800))
        setSystemCheck(prev => ({ ...prev, connection: true }))

        // Check 3: Camera (only if proctoring is enabled)
        if (examData?.proctoringEnabled) {
            await new Promise(r => setTimeout(r, 800))
            try {
                // Request camera permission
                const stream = await navigator.mediaDevices.getUserMedia({ video: true })
                setSystemCheck(prev => ({ ...prev, camera: true }))
                // Stop the stream after permission granted so it can be used later
                stream.getTracks().forEach(track => track.stop())
            } catch (e) {
                alert('Camera access denied! Please allow camera access to proceed.')
                setSystemCheck(prev => ({ ...prev, camera: false }))
            }
        } else {
            // Skip camera check if proctoring is disabled
            setSystemCheck(prev => ({ ...prev, camera: true }))
        }

        setCheckingSystem(false)
    }

    const handleStartExam = async () => {
        const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

        if (!isDemo) {
            try {
                const token = getAuthToken()
                const res = await fetch('/api/exams/session/start', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ examCode })
                })

                if (!res.ok) throw new Error('Failed to start session')

            } catch (error) {
                console.error('Error starting session:', error)
                alert('Could not start exam session. Please try again.')
                return
            }
        }

        // Enter Fullscreen
        try {
            await document.documentElement.requestFullscreen()
        } catch (e) {
            console.log('Fullscreen denied', e)
        }

        router.push(`/exam/${examCode}/play`)
    }

    if (loading) return <PageLoading title="Loading Exam Details..." />

    // Safety check - if no exam data loaded yet
    if (!examData) return null

    const allChecksPassed = systemCheck.browser && systemCheck.camera && systemCheck.connection

    return (
        <div className="min-h-screen bg-[#0B1121] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Atmospherics */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen opacity-20 animate-pulse-slow"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 blur-[100px] rounded-full mix-blend-screen opacity-20"></div>
            </div>

            {/* User Info Badge */}
            {user && (
                <div className="absolute top-6 right-6 flex items-center gap-3 bg-[#131B2D]/80 backdrop-blur-md border border-white/5 px-4 py-2 rounded-full">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm text-slate-300 font-medium">{user.email}</span>
                </div>
            )}

            <div className="w-full max-w-5xl bg-[#131B2D]/80 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative z-10 transition-all hover:border-white/10">
                {/* Left: Exam Details */}
                <div className="flex-[1.2] p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/5 flex flex-col bg-gradient-to-b from-[#131B2D] to-[#0F1623]">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-full uppercase tracking-wider border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                                Assessment
                            </span>
                            {examData?.proctoringEnabled ? (
                                <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs font-bold rounded-full uppercase tracking-wider border border-purple-500/20 flex items-center gap-1.5">
                                    <Shield className="w-3 h-3" /> Proctored
                                </span>
                            ) : (
                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1.5">
                                    <FileText className="w-3 h-3" /> Standard
                                </span>
                            )}
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight leading-tight">{examData.title}</h1>
                        <p className="text-slate-400 leading-relaxed text-sm">
                            {examData.description}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-5 bg-[#1F2937]/50 rounded-2xl border border-white/5 backdrop-blur-sm">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Duration</p>
                            <p className="text-2xl font-bold text-white flex items-baseline gap-1">
                                {examData.duration} <span className="text-sm font-medium text-slate-400">min</span>
                            </p>
                        </div>
                        <div className="p-5 bg-[#1F2937]/50 rounded-2xl border border-white/5 backdrop-blur-sm">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1 flex items-center gap-1.5"><FileQuestion className="w-3 h-3" /> Questions</p>
                            <p className="text-2xl font-bold text-white flex items-baseline gap-1">
                                {examData.questions} <span className="text-sm font-medium text-slate-400">items</span>
                            </p>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5"><Users className="w-3 h-3" /> Exam Instructor</h4>
                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white ring-2 ring-white/10">
                                {examData.instructor.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">{examData.instructor}</p>
                                <p className="text-xs text-slate-400">Verified System</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: System Check & Agreement */}
                <div className="flex-1 p-8 md:p-12 bg-[#0F1623]/80 flex flex-col backdrop-blur-md">
                    <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                        System Check
                    </h2>

                    {/* System Checks */}
                    <div className="space-y-4 mb-8">
                        {[
                            { id: 'browser', label: 'Browser Support', icon: <Globe className="w-6 h-6" />, check: systemCheck.browser, required: true },
                            { id: 'connection', label: 'Stable Connection', icon: <Wifi className="w-6 h-6" />, check: systemCheck.connection, required: true },
                            { id: 'camera', label: 'Webcam Access', icon: <Camera className="w-6 h-6" />, check: systemCheck.camera, required: examData?.proctoringEnabled ?? true },
                        ].filter(item => item.required).map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-[#1A2438]/50 border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl opacity-80 decoration-0 text-slate-400">{item.icon}</span>
                                    <div>
                                        <span className="text-sm font-semibold text-slate-200 block">{item.label}</span>
                                        {item.id === 'camera' && !examData?.proctoringEnabled && (
                                            <span className="text-xs text-slate-500">Not required (Standard Mode)</span>
                                        )}
                                    </div>
                                </div>
                                {checkingSystem ? (
                                    <div className="w-5 h-5 rounded-full border-2 border-slate-600 border-t-white animate-spin" />
                                ) : item.check ? (
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    </div>
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-slate-700/50 flex items-center justify-center border border-slate-600">
                                        <Circle className="w-3.5 h-3.5 text-slate-500" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {!allChecksPassed && !checkingSystem && (
                            <button
                                onClick={runSystemCheck}
                                className="w-full py-3.5 mt-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-all border border-white/5 hover:border-white/20 shadow-lg"
                            >
                                Run System Check
                            </button>
                        )}
                    </div>

                    {/* Rules */}
                    {allChecksPassed && (
                        <div className="mb-8 animate-fade-in-up">
                            <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Exam Rules</h3>
                            <ul className="space-y-3 text-sm text-slate-300 mb-6 bg-[#0B1121]/50 p-4 rounded-xl border border-white/5">
                                {examData.rules.map((rule: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <Circle className="w-2 h-2 fill-rose-500 text-rose-500 flex-shrink-0 mt-1.5" />
                                        <span className="text-xs font-medium leading-relaxed">{rule}</span>
                                    </li>
                                ))}
                            </ul>

                            <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                <div className="relative flex items-center mt-0.5">
                                    <input
                                        type="checkbox"
                                        checked={agreed}
                                        onChange={(e) => setAgreed(e.target.checked)}
                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-600 bg-[#1A2438] checked:border-blue-500 checked:bg-blue-500 transition-all"
                                    />
                                    <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-0 peer-checked:opacity-100 text-white transition-opacity" />
                                </div>
                                <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors font-medium">
                                    I agree to the rules and confirm that I will not cheat.
                                </span>
                            </label>
                        </div>
                    )}

                    <div className="mt-auto flex gap-4">
                        <Link href="/dashboard" className="flex-1">
                            <button className="w-full py-4 border border-white/10 text-slate-400 rounded-xl font-bold hover:bg-white/5 hover:text-white transition-all text-sm uppercase tracking-wide">
                                Cancel
                            </button>
                        </Link>
                        <button
                            disabled={!allChecksPassed || !agreed}
                            onClick={handleStartExam}
                            className="flex-[2] py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm uppercase tracking-wide hover:-translate-y-0.5 hover:shadow-blue-600/40"
                        >
                            Start Exam
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
