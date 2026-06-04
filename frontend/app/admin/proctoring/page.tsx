'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { isDemoMode } from '@/lib/db/client'
import {
    ChevronLeft,
    Video,
    Search,
    Images,
    Camera,
    AlertTriangle,
    Clock,
    Flag,
    List,
    LayoutGrid,
    Target,
    Circle
} from 'lucide-react'

// Demo proctoring data
const demoProctoringData = [
    {
        id: '1',
        sessionId: 'session-001',
        user: { name: 'John Doe', email: 'john@demo.com' },
        exam: 'Programming Fundamentals',
        startTime: '2026-01-11 10:00:00',
        endTime: '2026-01-11 11:00:00',
        status: 'completed',
        snapshots: 120,
        violations: [
            { type: 'tab_switch', time: '10:15:32', count: 1 },
            { type: 'tab_switch', time: '10:45:12', count: 2 },
        ],
        score: 85
    },
    {
        id: '2',
        sessionId: 'session-002',
        user: { name: 'Jane Smith', email: 'jane@demo.com' },
        exam: 'Web Development',
        startTime: '2026-01-11 09:30:00',
        status: 'in_progress',
        snapshots: 45,
        violations: [
            { type: 'window_blur', time: '09:42:15', count: 1 },
        ],
        score: null
    },
    {
        id: '3',
        sessionId: 'session-003',
        user: { name: 'Bob Wilson', email: 'bob@demo.com' },
        exam: 'Database Design',
        startTime: '2026-01-11 08:00:00',
        endTime: '2026-01-11 09:30:00',
        status: 'blocked',
        snapshots: 60,
        violations: [
            { type: 'tab_switch', time: '08:12:00', count: 1 },
            { type: 'tab_switch', time: '08:25:00', count: 2 },
            { type: 'tab_switch', time: '08:30:00', count: 3 },
            { type: 'multiple_faces', time: '08:35:00', count: 1 },
        ],
        score: 0
    }
]

// Demo snapshots
const demoSnapshots = [
    { id: 1, time: '10:00:05', status: 'clean' },
    { id: 2, time: '10:00:35', status: 'clean' },
    { id: 3, time: '10:01:05', status: 'clean' },
    { id: 4, time: '10:01:35', status: 'warning' },
    { id: 5, time: '10:02:05', status: 'clean' },
    { id: 6, time: '10:02:35', status: 'clean' },
]

export default function ProctoringViewerPage() {
    const [selectedSession, setSelectedSession] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

    const selectedData = demoProctoringData.find(d => d.id === selectedSession)

    return (
        <div className="min-h-screen bg-[#0B1121] text-slate-100 font-sans">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-[#0F1623]/90 backdrop-blur-md border-b border-white/5 z-50 flex items-center px-8 shadow-sm">
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
                            <span className="p-1 rounded-lg bg-white/5 ml-1 border border-white/5 group-hover:border-white/10 group-hover:bg-white/10 transition-all">
                                <ChevronLeft className="w-4 h-4" />
                            </span>
                            <span className="text-sm font-medium">Dashboard</span>
                        </Link>
                        <div className="h-6 w-px bg-white/10" />
                        <h1 className="text-lg font-bold text-white flex items-center gap-2">
                            <Video className="w-6 h-6" />
                            Proctoring Viewer
                        </h1>
                    </div>
                    {isDemoMode && (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-full border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Demo Mode
                        </span>
                    )}
                </div>
            </header>

            <div className="flex pt-16 h-screen">
                {/* Sessions List */}
                <aside className="w-96 bg-[#0F1623] border-r border-white/5 overflow-y-auto flex flex-col">
                    <div className="p-6 border-b border-white/5 bg-[#0F1623] sticky top-0 z-10">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Exam Sessions</h2>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search sessions..."
                                className="w-full pl-10 pr-4 py-3 bg-[#1A2438] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        </div>
                    </div>

                    <div className="divide-y divide-white/5">
                        {demoProctoringData.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => setSelectedSession(session.id)}
                                className={`p-5 cursor-pointer transition-all hover:bg-white/[0.02] ${selectedSession === session.id
                                    ? 'bg-blue-600/5 border-l-2 border-blue-500'
                                    : 'border-l-2 border-transparent'
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className={`font-semibold text-sm ${selectedSession === session.id ? 'text-white' : 'text-slate-300'}`}>{session.user.name}</h3>
                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{session.exam}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${session.status === 'completed'
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : session.status === 'in_progress'
                                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        }`}>
                                        {session.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 mt-3 text-[10px] font-medium text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <Images className="w-3 h-3" />
                                        {session.snapshots}
                                    </span>
                                    <span className={`flex items-center gap-1 ${session.violations.length > 2 ? 'text-rose-400' : ''}`}>
                                        <AlertTriangle className="w-3 h-3" />
                                        {session.violations.length} violations
                                    </span>
                                    <span className="ml-auto opacity-70">{session.startTime.split(' ')[1]}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8 overflow-y-auto bg-[#0B1121]">
                    {selectedData ? (
                        <div className="max-w-6xl mx-auto space-y-6">
                            {/* Session Header */}
                            <div className="bg-[#131B2D] rounded-2xl p-8 border border-white/5 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <Video className="w-32 h-32" />
                                </div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="flex items-start gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg border border-white/10">
                                            {selectedData.user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold text-white tracking-tight">{selectedData.user.name}</h2>
                                            <p className="text-slate-400 font-medium">{selectedData.user.email}</p>
                                            <div className="flex items-center gap-3 mt-3">
                                                <span className="px-3 py-1 bg-[#1A2438] rounded-lg border border-white/10 text-xs font-mono text-slate-300">
                                                    ID: {selectedData.sessionId}
                                                </span>
                                                <Circle className="w-1.5 h-1.5 fill-slate-500 text-slate-500" />
                                                <span className="text-slate-300 font-medium">{selectedData.exam}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${selectedData.status === 'completed'
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : selectedData.status === 'in_progress'
                                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                            }`}>
                                            {selectedData.status.replace('_', ' ')}
                                        </span>
                                        {selectedData.score !== null && (
                                            <div className="text-right">
                                                <p className="text-3xl font-bold text-white">{selectedData.score}%</p>
                                                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Final Score</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/5">
                                    {[
                                        { label: 'Snapshots', value: selectedData.snapshots, icon: <Camera className="w-4 h-4" /> },
                                        { label: 'Violations', value: selectedData.violations.length, icon: <AlertTriangle className="w-4 h-4" />, alert: selectedData.violations.length > 0 },
                                        { label: 'Start Time', value: selectedData.startTime.split(' ')[1], icon: <Clock className="w-4 h-4" /> },
                                        { label: 'End Time', value: selectedData.endTime?.split(' ')[1] || 'Ongoing', icon: <Flag className="w-4 h-4" /> },
                                    ].map((stat, idx) => (
                                        <div key={idx} className="bg-[#0B1121]/50 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                                            <div className="flex items-center gap-2 mb-1 opacity-70">
                                                <span>{stat.icon}</span>
                                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
                                            </div>
                                            <p className={`text-xl font-bold ${stat.alert ? 'text-rose-400' : 'text-white'}`}>{stat.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Violations Timeline */}
                            {selectedData.violations.length > 0 && (
                                <div className="bg-[#131B2D] rounded-2xl p-8 border border-white/5 shadow-xl">
                                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                        Violations Detected
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedData.violations.map((violation, idx) => (
                                            <div key={idx} className="flex items-center gap-4 p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl hover:bg-rose-500/10 transition-colors group">
                                                <div className="w-10 h-10 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-400 shadow-inner group-hover:scale-110 transition-transform">
                                                    <AlertTriangle className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-white">
                                                        {violation.type.replace('_', ' ').toUpperCase()}
                                                    </p>
                                                    <p className="text-sm text-slate-400 mt-0.5">Detected at <span className="font-mono text-slate-300">{violation.time}</span></p>
                                                </div>
                                                <span className="px-3 py-1 bg-rose-500/20 rounded-lg text-rose-400 text-xs font-bold border border-rose-500/20">
                                                    Count: {violation.count}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Snapshots Grid */}
                            <div className="bg-[#131B2D] rounded-2xl p-8 border border-white/5 shadow-xl">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                        Captured Snapshots
                                    </h3>
                                    <div className="flex bg-[#0B1121] p-1 rounded-lg border border-white/10">
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${viewMode === 'list' ? 'bg-[#1F2937] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            <List className="w-3 h-3" />
                                            List
                                        </button>
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${viewMode === 'grid' ? 'bg-[#1F2937] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            <LayoutGrid className="w-3 h-3" />
                                            Grid
                                        </button>
                                    </div>
                                </div>

                                <div className={viewMode === 'grid' ? 'grid grid-cols-4 gap-4' : 'space-y-2'}>
                                    {demoSnapshots.map((snapshot) => (
                                        <div
                                            key={snapshot.id}
                                            className={`${viewMode === 'grid'
                                                ? 'aspect-video bg-[#0B1121] rounded-xl overflow-hidden relative group border border-white/5 hover:border-blue-500/50 transition-all cursor-pointer'
                                                : 'flex items-center gap-4 p-3 bg-[#0B1121] rounded-xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer'
                                                }`}
                                        >
                                            {viewMode === 'grid' ? (
                                                <>
                                                    <div className="w-full h-full bg-gradient-to-br from-[#1A2438] to-[#0F1623] flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                                                        <Camera className="w-6 h-6 text-slate-600 group-hover:text-blue-400 transition-colors" />
                                                    </div>
                                                    <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-mono text-white backdrop-blur-sm border border-white/10">
                                                        {snapshot.time}
                                                    </div>
                                                    {snapshot.status === 'warning' && (
                                                        <div className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded shadow-lg animate-pulse">
                                                            <AlertTriangle className="w-3 h-3" />
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-12 h-10 bg-[#1A2438] rounded-lg flex items-center justify-center text-slate-400">
                                                        <Camera className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-white text-sm font-semibold">Snapshot #{snapshot.id}</p>
                                                        <p className="text-slate-500 text-xs font-mono">{snapshot.time}</p>
                                                    </div>
                                                    {snapshot.status === 'warning' && (
                                                        <span className="text-rose-400 text-xs font-bold bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 flex items-center gap-1">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            Warning
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <p className="text-center text-slate-500 text-xs font-medium mt-8 border-t border-white/5 pt-4">
                                    {isDemoMode ? '(Demo mode - showing placeholder snapshots)' : 'Click on snapshot to view full size'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center p-12 bg-[#131B2D]/50 rounded-3xl border border-white/5 border-dashed">
                                <div className="w-20 h-20 bg-[#1A2438] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-white/5">
                                    <Video className="w-8 h-8 opacity-50" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Select a Session</h3>
                                <p className="text-slate-400 text-sm max-w-xs mx-auto">Choose an active or completed exam session from the sidebar to view detailed proctoring data.</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}
