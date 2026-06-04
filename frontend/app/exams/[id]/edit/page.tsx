'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getAuthToken } from '@/lib/db/client'
import { ChevronLeft, X, Circle, Save } from 'lucide-react'
import { PageLoading } from '@/components/Loading'

export default function EditExamPage() {
    const router = useRouter()
    const params = useParams()
    const examId = params.id as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        code: '',
        title: '',
        description: '',
        duration: 60,
        proctoring_enabled: true,
        start_time: '',
        end_time: '',
        status: 'draft',
        rules: [] as string[]
    })
    const [newRule, setNewRule] = useState('')

    useEffect(() => {
        fetchExam()
    }, [examId])

    const fetchExam = async () => {
        try {
            const demo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
            if (demo) {
                setFormData({
                    code: 'DEMO123',
                    title: 'Demo Exam',
                    description: 'This is a demo exam.',
                    duration: 60,
                    proctoring_enabled: true,
                    start_time: new Date().toISOString().slice(0, 16),
                    end_time: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
                    status: 'draft',
                    rules: ['Rule 1', 'Rule 2']
                })
                setLoading(false)
                return
            }

            const token = getAuthToken()
            if (!token) {
                router.push('/login')
                return
            }

            const res = await fetch(`/api/exams/${examId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to fetch exam');
            }
            const { exam } = await res.json()

            // Extract rules from description if they exist
            let description = exam.description || ''
            let extractedRules: string[] = []

            // Check if description contains rules section (simple heuristic based on Create logic)
            // Pattern: \n\n---\nRules:\n1. Rule 1\n2. Rule 2...
            const rulesMatch = description.match(/\n\n---\nRules:\n([\s\S]*)$/)
            if (rulesMatch) {
                // Remove rules from description displayed in text area
                description = description.replace(/\n\n---\nRules:\n[\s\S]*$/, '')
                extractedRules = rulesMatch[1]
                    .split('\n')
                    .map((r: string) => r.replace(/^\d+\.\s*/, '').trim())
                    .filter((r: string) => r)
            }

            setFormData({
                code: exam.code || '',
                title: exam.title || '',
                description: description,
                duration: exam.duration || 60,
                proctoring_enabled: exam.proctoring_enabled ?? true,
                start_time: exam.start_time ? exam.start_time.slice(0, 16) : '',
                end_time: exam.end_time ? exam.end_time.slice(0, 16) : '',
                status: exam.status || 'draft',
                rules: extractedRules
            })
        } catch (error: any) {
            console.error('Error fetching exam:', error)
            alert('Failed to load exam: ' + error.message)
            router.push('/exams')
        } finally {
            setLoading(false)
        }
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
        setSaving(true)

        try {
            const demo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
            if (demo) {
                alert('Demo Mode: Changes saved (not persisted)')
                router.push('/exams')
                return
            }

            const token = getAuthToken()
            if (!token) {
                router.push('/login')
                return
            }

            // Append new rules to description if any added in UI (optional logic)
            const fullDescription = formData.description + (formData.rules.length > 0
                ? '\n\n---\nRules:\n' + formData.rules.map((r, i) => `${i + 1}. ${r}`).join('\n')
                : '')

            const payload = {
                title: formData.title,
                description: fullDescription,
                duration: formData.duration,
                proctoring_enabled: formData.proctoring_enabled,
                start_time: formData.start_time || null,
                end_time: formData.end_time || null,
                status: formData.status
            }

            const res = await fetch(`/api/exams/${examId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            })

            if (!res.ok) throw new Error('Failed to update exam')

            alert('Exam updated successfully!')
            router.push('/exams')
        } catch (error: any) {
            console.error('Error updating exam:', error)
            alert('Failed to update exam: ' + error.message)
        } finally {
            setSaving(false)
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
                            <h1 className="text-2xl font-bold text-white tracking-tight">Edit Exam</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full border border-amber-500/20">
                                Editing
                            </span>
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
                            {/* Exam Code (Read-only) */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">
                                    Exam Code (Cannot be changed)
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    disabled
                                    className="w-full px-4 py-3 bg-[#1A2333]/50 border border-white/5 rounded-xl text-slate-500 font-mono text-lg cursor-not-allowed"
                                />
                                <p className="text-xs text-slate-500 mt-2">Exam code cannot be changed to preserve shared links</p>
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
                            disabled={saving}
                            className="flex-[2] py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {saving ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    )
}
