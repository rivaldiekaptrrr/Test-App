'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAuthToken } from '@/lib/db/client'
import { ChevronLeft, X, Circle } from 'lucide-react'

export default function CreateExamPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        code: '',
        title: '',
        description: '',
        duration: 60,
        proctoring_enabled: true,
        start_time: '',
        end_time: '',
        rules: [
            'Full screen mode is mandatory',
            'Tab switching is strictly prohibited',
            'Webcam must be active at all times',
            'No external devices or materials allowed'
        ]
    })
    const [newRule, setNewRule] = useState('')

    const generateCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let code = ''
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        setFormData({ ...formData, code })
    }

    const addRule = () => {
        if (newRule.trim()) {
            setFormData({
                ...formData,
                rules: [...formData.rules, newRule.trim()]
            })
            setNewRule('')
        }
    }

    const removeRule = (index: number) => {
        setFormData({
            ...formData,
            rules: formData.rules.filter((_, i) => i !== index)
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
            if (demoMode) {
                alert('Demo Mode: Exam created (not saved)')
                router.push('/exams')
                return
            }

            const token = getAuthToken()
            if (!token) {
                router.push('/login')
                return
            }

            // Calculate default start and end times if not provided
            const now = new Date()
            const defaultStartTime = formData.start_time || now.toISOString()
            const defaultEndTime = formData.end_time || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now

            // Prepare description with rules included
            const fullDescription = formData.description + (formData.rules.length > 0
                ? '\n\n---\nRules:\n' + formData.rules.map((r, i) => `${i + 1}. ${r}`).join('\n')
                : '')

            const payload = {
                title: formData.title,
                description: fullDescription,
                duration: formData.duration,
                code: formData.code.toUpperCase(),
                proctoring_enabled: formData.proctoring_enabled,
                start_time: defaultStartTime,
                end_time: defaultEndTime,
                camera_required: formData.proctoring_enabled, // Default logic
                tab_switch_allowed: formData.proctoring_enabled ? 2 : 10
            }

            const response = await fetch('/api/exams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create exam')
            }

            // Redirect to add questions
            router.push(`/exams/${data.exam.id}/questions`)
        } catch (error: any) {
            console.error('Error creating exam:', error)
            alert('Failed to create exam: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

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
                            <h1 className="text-2xl font-bold text-white tracking-tight">Create New Exam</h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info Card */}
                    <div className="bg-[#131B2D] rounded-2xl border border-white/5 p-6">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                            Basic Information
                        </h2>

                        <div className="space-y-4">
                            {/* Exam Code */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">
                                    Exam Code *
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="flex-1 px-4 py-3 bg-[#1A2333] border border-white/10 rounded-xl text-white font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="EXAM2026"
                                        maxLength={20}
                                    />
                                    <button
                                        type="button"
                                        onClick={generateCode}
                                        className="px-6 py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl font-semibold border border-blue-500/20 transition-all"
                                    >
                                        Generate
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">This code will be used by students to access the exam</p>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">
                                    Exam Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#1A2333] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Programming Fundamentals Final Exam"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-[#1A2333] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    placeholder="Comprehensive assessment of basic programming concepts..."
                                />
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">
                                    Duration (minutes) *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 bg-[#1A2333] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Time Window */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                                        Start Time (Optional)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.start_time}
                                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#1A2333] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                                        End Time (Optional)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.end_time}
                                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                        className="w-full px-4 py-3 bg-[#1A2333] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Proctoring Settings */}
                    <div className="bg-[#131B2D] rounded-2xl border border-white/5 p-6">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                            Proctoring Settings
                        </h2>

                        <label className="flex items-start gap-4 cursor-pointer p-4 rounded-xl hover:bg-white/5 transition-colors">
                            <input
                                type="checkbox"
                                checked={formData.proctoring_enabled}
                                onChange={(e) => setFormData({ ...formData, proctoring_enabled: e.target.checked })}
                                className="mt-1 w-5 h-5 rounded border-slate-600 bg-[#1A2333] checked:bg-blue-600 focus:ring-2 focus:ring-blue-500"
                            />
                            <div>
                                <p className="font-semibold text-white">Enable Proctoring</p>
                                <p className="text-sm text-slate-400 mt-1">Require webcam access and detect violations during exam</p>
                            </div>
                        </label>
                    </div>

                    {/* Rules */}
                    <div className="bg-[#131B2D] rounded-2xl border border-white/5 p-6">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-rose-500 rounded-full"></span>
                            Exam Rules
                        </h2>

                        <div className="space-y-3 mb-4">
                            {formData.rules.map((rule, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 bg-[#1A2333] rounded-xl border border-white/5">
                                    <Circle className="w-2 h-2 fill-rose-500 text-rose-500 flex-shrink-0" />
                                    <p className="flex-1 text-sm text-slate-300">{rule}</p>
                                    <button
                                        type="button"
                                        onClick={() => removeRule(index)}
                                        className="text-slate-500 hover:text-rose-400 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newRule}
                                onChange={(e) => setNewRule(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRule())}
                                className="flex-1 px-4 py-3 bg-[#1A2333] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Add a new rule..."
                            />
                            <button
                                type="button"
                                onClick={addRule}
                                className="px-6 py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl font-semibold border border-blue-500/20 transition-all"
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <Link
                            href="/exams"
                            className="flex-1 py-4 text-center border border-white/10 text-slate-400 rounded-xl font-bold hover:bg-white/5 hover:text-white transition-all"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? 'Creating...' : 'Create Exam & Add Questions'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    )
}
