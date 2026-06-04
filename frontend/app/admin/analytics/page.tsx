'use client'

import { useState } from 'react'
import Link from 'next/link'
import { isDemoMode } from '@/lib/db/client'
import {
    ChevronLeft,
    BarChart2,
    Calendar,
    FileText,
    Users,
    TrendingUp,
    AlertTriangle,
    Clock,
    CheckCircle
} from 'lucide-react'

// Demo analytics data
const weeklyData = [
    { day: 'Mon', exams: 12, participants: 145, violations: 3 },
    { day: 'Tue', exams: 18, participants: 210, violations: 5 },
    { day: 'Wed', exams: 15, participants: 178, violations: 2 },
    { day: 'Thu', exams: 22, participants: 265, violations: 8 },
    { day: 'Fri', exams: 20, participants: 240, violations: 4 },
    { day: 'Sat', exams: 8, participants: 95, violations: 1 },
    { day: 'Sun', exams: 5, participants: 62, violations: 0 },
]

const violationTypes = [
    { type: 'Tab Switch', count: 45, percentage: 40 },
    { type: 'Window Blur', count: 28, percentage: 25 },
    { type: 'Copy Attempt', count: 22, percentage: 20 },
    { type: 'Multiple Faces', count: 12, percentage: 11 },
    { type: 'No Face', count: 5, percentage: 4 },
]

const topExams = [
    { name: 'Programming Fundamentals', participants: 450, avgScore: 78, completion: 96 },
    { name: 'Web Development', participants: 380, avgScore: 82, completion: 94 },
    { name: 'Database Design', participants: 320, avgScore: 71, completion: 91 },
    { name: 'React Advanced', participants: 280, avgScore: 85, completion: 98 },
    { name: 'Python Basics', participants: 250, avgScore: 79, completion: 95 },
]

export default function AnalyticsPage() {
    const [timeRange, setTimeRange] = useState('week')

    const maxParticipants = Math.max(...weeklyData.map(d => d.participants))

    return (
        <div className="min-h-screen bg-[#0B1121] text-slate-100">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-[#0F1623]/80 backdrop-blur-md border-b border-white/5 z-50 flex items-center px-8">
                <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
                            <span className="p-1 rounded-lg bg-white/5 ml-1 border border-white/5 group-hover:border-white/10 group-hover:bg-white/10 transition-all">
                                <ChevronLeft className="w-4 h-4" />
                            </span>
                            <span className="text-sm font-medium">Dashboard</span>
                        </Link>
                        <div className="h-6 w-px bg-white/10" />
                        <h1 className="text-lg font-bold text-white flex items-center gap-2">
                            <BarChart2 className="w-6 h-6" />
                            Analytics Overview
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                className="appearance-none pl-4 pr-10 py-2 bg-[#131B2D] border border-white/10 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:border-white/20 transition-all shadow-sm"
                            >
                                <option value="week">Last 7 Days</option>
                                <option value="month">Last 30 Days</option>
                                <option value="year">Last Year</option>
                            </select>
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                        {isDemoMode && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-full border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                Demo Mode
                            </span>
                        )}
                    </div>
                </div>
            </header>

            <main className="pt-24 pb-12 px-8 max-w-7xl mx-auto">
                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Total Exams', value: '156', change: '+12%', icon: <FileText className="w-6 h-6" />, color: 'blue' },
                        { label: 'Total Participants', value: '2,847', change: '+18%', icon: <Users className="w-6 h-6" />, color: 'emerald' },
                        { label: 'Avg Score', value: '78%', change: '+3%', icon: <TrendingUp className="w-6 h-6" />, color: 'purple' },
                        { label: 'Violations', value: '112', change: '-5%', icon: <AlertTriangle className="w-6 h-6" />, color: 'rose' },
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-[#131B2D] rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all shadow-lg group">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 border border-${stat.color}-500/20 flex items-center justify-center text-xl`}>
                                    <span className={`text-${stat.color}-500`}>{stat.icon}</span>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${stat.change.startsWith('+')
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    }`}>
                                    {stat.change}
                                </span>
                            </div>
                            <p className="text-3xl font-bold text-white tracking-tight group-hover:scale-105 transition-transform origin-left">{stat.value}</p>
                            <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-wide opacity-80">{stat.label}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Participants Chart */}
                    <div className="lg:col-span-2 bg-[#131B2D] rounded-2xl p-8 border border-white/5 shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                            <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
                            Weekly Activity
                        </h2>
                        <div className="flex items-end justify-between h-64 gap-4 px-2">
                            {weeklyData.map((data, idx) => (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-3 group">
                                    <div className="w-full flex flex-col items-center gap-1 relative">
                                        <span className="absolute -top-8 text-xs font-bold text-white bg-[#0B1121] px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                            {data.participants} Participants
                                        </span>
                                        <div
                                            className="w-full bg-gradient-to-t from-blue-600/80 to-indigo-500/80 rounded-t-lg transition-all duration-300 group-hover:from-blue-500 group-hover:to-indigo-400 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] relative overflow-hidden"
                                            style={{ height: `${(data.participants / maxParticipants) * 200}px` }}
                                        >
                                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </div>
                                    </div>
                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider group-hover:text-white transition-colors">{data.day}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Violation Types */}
                    <div className="bg-[#131B2D] rounded-2xl p-8 border border-white/5 shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                            <span className="w-1 h-5 bg-rose-500 rounded-full"></span>
                            Violation Breakdown
                        </h2>
                        <div className="space-y-6">
                            {violationTypes.map((violation, idx) => (
                                <div key={idx} className="group">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-slate-300 font-medium group-hover:text-white transition-colors">{violation.type}</span>
                                        <span className="text-slate-400 text-sm bg-[#0B1121] px-2 py-0.5 rounded border border-white/5 font-mono">{violation.count}</span>
                                    </div>
                                    <div className="w-full bg-[#0B1121] rounded-full h-2 border border-white/5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${idx === 0 ? 'bg-rose-500' :
                                                idx === 1 ? 'bg-orange-500' :
                                                    idx === 2 ? 'bg-amber-500' :
                                                        idx === 3 ? 'bg-purple-500' :
                                                            'bg-blue-500'
                                                }`}
                                            style={{ width: `${violation.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Exams Table */}
                <div className="bg-[#131B2D] rounded-2xl border border-white/5 mt-8 overflow-hidden shadow-xl">
                    <div className="p-8 border-b border-white/5">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
                            Top Performing Exams
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#1A2438]">
                                <tr>
                                    <th className="text-left px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Exam Name</th>
                                    <th className="text-center px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Participants</th>
                                    <th className="text-center px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Score</th>
                                    <th className="text-center px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Completion</th>
                                    <th className="text-right px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {topExams.map((exam, idx) => (
                                    <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-xl flex items-center justify-center text-white font-bold border border-white/10">
                                                    #{idx + 1}
                                                </div>
                                                <span className="text-white font-semibold group-hover:text-blue-400 transition-colors">{exam.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center text-slate-400 font-mono">{exam.participants}</td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${exam.avgScore >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                exam.avgScore >= 70 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                }`}>
                                                {exam.avgScore}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="w-24 bg-[#0B1121] rounded-full h-1.5 overflow-hidden border border-white/5">
                                                    <div
                                                        className="bg-blue-500 h-full rounded-full"
                                                        style={{ width: `${exam.completion}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-slate-400 text-xs font-bold">{exam.completion}%</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="px-4 py-2 bg-[#1F2937] text-slate-300 rounded-lg hover:bg-white/10 hover:text-white transition-all text-sm font-bold border border-white/5 hover:border-white/20 shadow-sm">
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 shadow-lg shadow-blue-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Clock className="w-20 h-20" />
                        </div>
                        <h3 className="text-blue-100 font-bold mb-2 uppercase tracking-wide text-xs">Peak Hours</h3>
                        <p className="text-3xl font-bold text-white mb-1 tracking-tight">10AM - 2PM</p>
                        <p className="text-blue-200 text-sm font-medium opacity-80">Most active exam period</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 shadow-lg shadow-purple-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Clock className="w-20 h-20" />
                        </div>
                        <h3 className="text-purple-100 font-bold mb-2 uppercase tracking-wide text-xs">Avg Duration</h3>
                        <p className="text-3xl font-bold text-white mb-1 tracking-tight">47 mins</p>
                        <p className="text-purple-200 text-sm font-medium opacity-80">Average exam completion time</p>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 shadow-lg shadow-emerald-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <CheckCircle className="w-20 h-20" />
                        </div>
                        <h3 className="text-emerald-100 font-bold mb-2 uppercase tracking-wide text-xs">Pass Rate</h3>
                        <p className="text-3xl font-bold text-white mb-1 tracking-tight">82%</p>
                        <p className="text-emerald-200 text-sm font-medium opacity-80">Students scoring 60%+</p>
                    </div>
                </div>
            </main>
        </div>
    )
}
