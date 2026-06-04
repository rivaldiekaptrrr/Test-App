'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getCurrentUser, getAuthToken } from '@/lib/db/client'
import { PageLoading } from '@/components/Loading'
import {
    LayoutDashboard,
    ListChecks,
    Video,
    BarChart2,
    CheckSquare,
    Users,
    Settings,
    LogOut,
    Plus,
    UserPlus,
    Download,
    Eye,
    ChevronRight,
    Shield,
    AlertTriangle,
    Code,
    Palette,
    Database,
    RefreshCw
} from 'lucide-react'

// Types
interface DashboardStats {
    totalExams: number
    activeSessions: number
    totalParticipants: number
    completionRate: number
    cheatingDetected: number
}

interface Exam {
    id: string
    code: string
    title: string
    description: string
    duration: number
    status: string
    questions: number
    participants: number
    avgScore: number
    category: string
}

interface Activity {
    id: number
    type: string
    user: string
    exam: string
    time: string
    score?: number
    violation?: string
    avatar: string
}

// All Nav Items definition
const allNavItems = [
    {
        id: 'overview',
        label: 'Overview',
        icon: <LayoutDashboard className="w-5 h-5" />,
        href: '/dashboard',
        roles: ['admin', 'teacher']
    },
    {
        id: 'exams',
        label: 'Exams',
        icon: <ListChecks className="w-5 h-5" />,
        href: '/exams',
        roles: ['admin', 'teacher']
    },
    {
        id: 'proctoring',
        label: 'Proctoring',
        icon: <Video className="w-5 h-5" />,
        href: '/admin/proctoring',
        roles: ['admin', 'teacher']
    },
    {
        id: 'analytics',
        label: 'Analytics',
        icon: <BarChart2 className="w-5 h-5" />,
        href: '/admin/analytics',
        roles: ['admin']
    },
    {
        id: 'users',
        label: 'Users',
        icon: <Users className="w-5 h-5" />,
        href: '/admin/users',
        roles: ['admin']
    },
    {
        id: 'settings',
        label: 'Settings',
        icon: <Settings className="w-5 h-5" />,
        href: '/settings',
        roles: ['admin']
    },
]

export default function DashboardPage() {
    const pathname = usePathname()
    const router = useRouter()
    const [userRole, setUserRole] = useState<string | null>(null)
    const [userName, setUserName] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Dashboard data from API
    const [stats, setStats] = useState<DashboardStats>({
        totalExams: 0,
        activeSessions: 0,
        totalParticipants: 0,
        completionRate: 0,
        cheatingDetected: 0
    })
    const [recentExams, setRecentExams] = useState<Exam[]>([])
    const [recentActivity, setRecentActivity] = useState<Activity[]>([])
    const [error, setError] = useState<string | null>(null)

    // Fetch dashboard data from API
    const fetchDashboardData = async () => {
        try {
            setIsRefreshing(true)

            const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
            if (isDemo) {
                setTimeout(() => {
                    setStats({
                        totalExams: 12,
                        activeSessions: 3,
                        totalParticipants: 145,
                        completionRate: 85,
                        cheatingDetected: 2
                    })
                    setRecentExams([
                        { id: '1', code: 'PROG2026', title: 'Programming Fundamentals', description: '', duration: 60, status: 'published', questions: 20, participants: 45, avgScore: 82.5, category: 'Tech' },
                        { id: '2', code: 'MATH101', title: 'Calculus I', description: '', duration: 90, status: 'published', questions: 30, participants: 100, avgScore: 75.0, category: 'Math' }
                    ])
                    setRecentActivity([
                        { id: 1, type: 'exam_complete', user: 'John Doe', exam: 'Programming Fundamentals', time: '5 mins ago', score: 90, avatar: 'JD' },
                        { id: 2, type: 'violation', user: 'Alice Smith', exam: 'Calculus I', time: '12 mins ago', violation: 'Tab Switch Detected', avatar: 'AS' },
                        { id: 3, type: 'exam_start', user: 'Bob Johnson', exam: 'Programming Fundamentals', time: '20 mins ago', avatar: 'BJ' }
                    ])
                    setError(null)
                    setIsRefreshing(false)
                }, 800)
                return
            }

            const token = getAuthToken()

            const response = await fetch('/api/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data')
            }

            const data = await response.json()

            setStats(data.stats)
            setRecentExams(data.recentExams || [])
            setRecentActivity(data.recentActivity || [])
            setError(null)
        } catch (err: any) {
            console.error('Dashboard fetch error:', err)
            setError(err.message)
        } finally {
            setIsRefreshing(false)
        }
    }

    // Check user role and fetch data
    useEffect(() => {
        const init = async () => {
            const user = getCurrentUser()

            if (!user) {
                router.push('/login')
                return
            }

            setUserRole(user.role)
            setUserName(user.full_name || user.email.split('@')[0])

            // If user, redirect to user portal
            if (user.role === 'user') {
                router.replace('/user')
                return
            }

            // Fetch dashboard data
            await fetchDashboardData()
            setIsLoading(false)
        }

        init()
    }, [router])

    if (isLoading) {
        return <PageLoading title="Dashboard" />
    }

    // Filter nav items based on role
    const visibleNavItems = allNavItems.filter(item =>
        userRole && item.roles.includes(userRole)
    )

    return (
        <div className="flex min-h-screen bg-[#0B1121] text-slate-100 font-sans">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-full w-72 bg-[#0F1623] border-r border-white/5 z-50 flex flex-col transition-all duration-300">
                <div className="p-8 pb-8">
                    <Link href="/" className="flex items-center gap-4 group">
                        <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105">
                            <Shield className="w-6 h-6 text-white" />
                            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">ExamProctor</span>
                            <span className="text-[10px] block text-slate-500 uppercase tracking-wider font-bold mt-0.5">
                                {userRole === 'admin' ? 'Admin Panel' : 'Admin Panel'}
                            </span>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    <div className="px-4 mb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Main Menu</div>
                    {visibleNavItems.map((item) => (
                        <Link key={item.id} href={item.href}>
                            <div
                                className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${pathname === item.href
                                    ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                                    }`}
                            >
                                <span className={`transition-colors duration-200 ${pathname === item.href ? 'text-blue-500' : 'text-slate-500 group-hover:text-white'}`}>
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                                {pathname === item.href && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                )}
                            </div>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5 space-y-3 bg-[#0B1121]/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-slate-700 to-slate-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-white/10 group-hover:ring-white/20 transition-all">
                            {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate capitalize group-hover:text-blue-400 transition-colors">{userName}</p>
                            <p className="text-xs text-slate-500 truncate">View Profile</p>
                        </div>
                        <Link href="/login" className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Sign Out">
                            <LogOut className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-72 flex-1 p-8 lg:p-10">
                {/* Header Section */}
                <header className="flex justify-between items-start mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight animate-fade-in-up">Dashboard Overview</h1>
                        <p className="text-slate-400 mt-2 flex items-center gap-2 text-sm animate-fade-in-up delay-75">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                            Welcome back, {userName}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={fetchDashboardData}
                            disabled={isRefreshing}
                            className="p-2.5 text-slate-400 hover:text-white bg-[#1F2937] hover:bg-[#374151] rounded-full transition-all border border-white/5 hover:border-white/20 shadow-lg disabled:opacity-50"
                        >
                            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                        {userRole === 'admin' && (
                            <Link href="/settings">
                                <button className="p-2.5 text-slate-400 hover:text-white bg-[#1F2937] hover:bg-[#374151] rounded-full transition-all border border-white/5 hover:border-white/20 shadow-lg">
                                    <Settings className="w-5 h-5" />
                                </button>
                            </Link>
                        )}
                    </div>
                </header>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                        Error loading data: {error}
                    </div>
                )}

                {/* KPI Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
                    {[
                        {
                            label: 'Total Exams', value: stats.totalExams, icon: <ListChecks className="w-6 h-6" />, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20'
                        },
                        {
                            label: 'Active Sessions', value: stats.activeSessions, icon: <Video className="w-6 h-6" />, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20'
                        },
                        {
                            label: 'Participants', value: stats.totalParticipants, icon: <Users className="w-6 h-6" />, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20'
                        },
                        {
                            label: 'Completion Rate', value: `${stats.completionRate}%`, icon: <CheckSquare className="w-6 h-6" />, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20'
                        },
                        {
                            label: 'Alerts Detected', value: stats.cheatingDetected, isAlert: true, icon: <AlertTriangle className="w-6 h-6" />, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20'
                        },
                    ].map((stat, idx) => (
                        <div key={idx} className={`relative p-6 rounded-2xl bg-[#131B2D] border border-white/5 hover:border-white/10 transition-all duration-300 group shadow-lg`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} border ${stat.border} group-hover:scale-110 transition-transform duration-300`}>
                                    {stat.icon}
                                </div>
                                {stat.isAlert && stats.cheatingDetected > 0 && (
                                    <span className="flex h-3 w-3 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                                    </span>
                                )}
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-white tracking-tight mb-1">{stat.value}</h3>
                                <p className="text-sm font-medium text-slate-400 uppercase tracking-wide">{stat.label}</p>
                            </div>
                            <div className={`absolute bottom-0 left-0 h-1 w-full rounded-b-2xl bg-gradient-to-r ${stat.isAlert ? 'from-rose-500/0 via-rose-500 to-rose-500/0' : 'from-blue-500/0 via-blue-500 to-blue-500/0'} opacity-0 group-hover:opacity-100 transition-opacity`} />
                        </div>
                    ))}
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Recent Exams Table */}
                    <div className="xl:col-span-2 bg-[#131B2D] rounded-3xl border border-white/5 overflow-hidden flex flex-col shadow-xl">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#131B2D]">
                            <div>
                                <h2 className="text-xl font-bold text-white">Recent Exams</h2>
                                <p className="text-sm text-slate-400 mt-1">Manage your latest assessments</p>
                            </div>
                            <Link href="/exams">
                                <button className="px-5 py-2.5 bg-[#1F2937] hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-all border border-white/5 flex items-center gap-2 group hover:-translate-y-0.5 shadow-lg">
                                    View All
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform group-hover:text-white" />
                                </button>
                            </Link>
                        </div>

                        <div className="flex-1 overflow-x-auto min-h-[350px]">
                            {recentExams.length === 0 ? (
                                <div className="p-8 text-center text-slate-400">
                                    <ListChecks className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No exams yet. Create your first exam!</p>
                                    <Link href="/exams/create">
                                        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors">
                                            Create Exam
                                        </button>
                                    </Link>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse table-fixed">
                                    <thead>
                                        <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-500 bg-[#1A2438]/50">
                                            <th className="px-6 py-4 font-semibold w-[70%]">Exam Details</th>
                                            <th className="px-6 py-4 font-semibold text-right w-[30%]">Stats</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {recentExams.map((exam) => (
                                            <tr key={exam.id} className="group hover:bg-white/[0.02] transition-colors relative">
                                                <td className="px-6 py-5">
                                                    <Link href={`/exams/${exam.id}`} className="absolute inset-0 z-10" aria-label={`View ${exam.title}`} />
                                                    <div className="flex items-center gap-4 relative z-0">
                                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-blue-500/10 flex items-center justify-center text-blue-400 shadow-inner group-hover:scale-105 transition-transform flex-shrink-0">
                                                            <Code className="w-6 h-6" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <h3 className="text-white font-bold text-sm group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                                                <span className="truncate">{exam.title}</span>
                                                                <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider border ${
                                                                    exam.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                                }`}>
                                                                    {exam.status}
                                                                </span>
                                                            </h3>
                                                            <p className="text-slate-500 text-xs mt-0.5 truncate">{exam.code} • {exam.questions} questions</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right relative z-0">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="text-sm font-bold text-white">{exam.participants} Users</span>
                                                        <span className="text-[11px] text-slate-400 font-medium bg-[#1A2438] border border-white/5 px-2 py-0.5 rounded">
                                                            Avg: <span className="text-blue-400 font-bold">{exam.avgScore}%</span>
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Recent Activity Feed */}
                    <div className="bg-[#131B2D] rounded-3xl border border-white/5 flex flex-col h-full shadow-xl">
                        <div className="p-8 border-b border-white/5">
                            <h2 className="text-xl font-bold text-white">Live Activity</h2>
                            <p className="text-sm text-slate-400 mt-1">Real-time monitoring feed</p>
                        </div>
                        <div className="flex-1 p-6 relative">
                            {recentActivity.length === 0 ? (
                                <div className="text-center text-slate-400 py-8">
                                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No activity yet</p>
                                </div>
                            ) : (
                                <>
                                    <div className="absolute left-[2.25rem] top-8 bottom-8 w-px bg-white/5" />
                                    <div className="space-y-6">
                                        {recentActivity.map((activity) => (
                                            <div key={activity.id} className="relative pl-8 group">
                                                <div className={`absolute left-[-0.35rem] top-0 w-5 h-5 rounded-full border-4 border-[#131B2D] z-10 box-content ${activity.type === 'violation' ? 'bg-rose-500' : activity.type === 'exam_complete' ? 'bg-emerald-500' : 'bg-blue-500'
                                                    } shadow-lg group-hover:scale-110 transition-transform`} />

                                                <div className="p-4 rounded-2xl bg-[#1A2438] border border-white/5 hover:border-white/10 transition-colors shadow-sm">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white/10">
                                                                {activity.avatar}
                                                            </div>
                                                            <span className="text-sm font-semibold text-white">{activity.user}</span>
                                                        </div>
                                                        <span className="text-xs text-slate-500 font-medium bg-[#0B1121] px-2 py-1 rounded-md border border-white/5">{activity.time}</span>
                                                    </div>

                                                    <p className="text-sm text-slate-300 leading-relaxed pl-10">
                                                        {activity.type === 'exam_complete' && (
                                                            <span>Completed <span className="text-emerald-400 font-bold">"{activity.exam}"</span> with a score of <span className="font-bold text-white bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{activity.score}%</span></span>
                                                        )}
                                                        {activity.type === 'violation' && (
                                                            <span>Violated rules in <span className="text-rose-400 font-bold">"{activity.exam}"</span>: <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-xs font-bold border border-rose-500/20 uppercase">{activity.violation}</span></span>
                                                        )}
                                                        {activity.type === 'exam_start' && (
                                                            <span>Started taking <span className="text-blue-400 font-bold">"{activity.exam}"</span></span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Action Grid */}
                <div className="mt-10 mb-8">
                    <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider text-sm flex items-center gap-2">
                        <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Link href="/exams/create">
                            <div className="h-full p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white cursor-pointer hover:shadow-2xl hover:shadow-blue-500/25 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group border border-white/10">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <ListChecks className="w-24 h-24" />
                                </div>
                                <div className="relative z-10">
                                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm shadow-inner">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-lg font-bold">Create Exam</h4>
                                    <p className="text-blue-100 text-sm mt-1 opacity-90">Design new assessment</p>
                                </div>
                            </div>
                        </Link>

                        <Link href="/admin/proctoring">
                            <div className="h-full p-6 rounded-2xl bg-[#131B2D] border border-white/5 text-white cursor-pointer hover:border-purple-500/50 hover:bg-[#1A2438] transition-all duration-300 group shadow-lg">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-purple-500/20">
                                    <Video className="w-6 h+6" />
                                </div>
                                <h4 className="text-lg font-bold group-hover:text-purple-400 transition-colors">Start Monitoring</h4>
                                <p className="text-slate-400 text-sm mt-1">View active sessions</p>
                            </div>
                        </Link>

                        {userRole === 'admin' && (
                            <Link href="/admin/users">
                                <div className="h-full p-6 rounded-2xl bg-[#131B2D] border border-white/5 text-white cursor-pointer hover:border-emerald-500/50 hover:bg-[#1A2438] transition-all duration-300 group shadow-lg">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-emerald-500/20">
                                        <UserPlus className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-lg font-bold group-hover:text-emerald-400 transition-colors">Manage Users</h4>
                                    <p className="text-slate-400 text-sm mt-1">View all users</p>
                                </div>
                            </Link>
                        )}

                        {userRole === 'admin' && (
                            <Link href="/admin/analytics">
                                <div className="h-full p-6 rounded-2xl bg-[#131B2D] border border-white/5 text-white cursor-pointer hover:border-orange-500/50 hover:bg-[#1A2438] transition-all duration-300 group shadow-lg">
                                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-orange-500/20">
                                        <Download className="w-6 h-6" />
                                    </div>
                                    <h4 className="text-lg font-bold group-hover:text-orange-400 transition-colors">Export Report</h4>
                                    <p className="text-slate-400 text-sm mt-1">Download statistics</p>
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
