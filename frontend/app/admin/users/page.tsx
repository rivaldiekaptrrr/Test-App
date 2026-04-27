'use client'

import { useState, useEffect } from 'react'
import { getAuthToken, isDemoMode } from '@/lib/db/client'
import { PageLoading } from '@/components/Loading'
import Link from 'next/link'
import {
    ChevronLeft,
    Plus,
    Users,
    UserCheck,
    GraduationCap,
    Search,
    Edit2,
    Trash2,
    X,
    User
} from 'lucide-react'

// Mock Data for Demo Mode
const demoUsers = [
    { id: '1', full_name: 'Dr. Alan Turing', email: 'teacher@demo.com', role: 'teacher', created_at: '2023-01-15T10:00:00Z', status: 'active' },
    { id: '2', full_name: 'John Student', email: 'student@demo.com', role: 'student', created_at: '2023-01-20T14:30:00Z', status: 'active' },
    { id: '3', full_name: 'Alice Wonder', email: 'alice@example.com', role: 'student', created_at: '2023-02-01T09:15:00Z', status: 'pending' },
    { id: '4', full_name: 'Prof. Einstein', email: 'albert@university.edu', role: 'teacher', created_at: '2023-01-10T08:45:00Z', status: 'active' },
]

export default function UserManagementPage() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState('all') // all, teacher, student
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [newUser, setNewUser] = useState({ full_name: '', email: '', role: 'student', password: '' })
    const [editingUser, setEditingUser] = useState<any>(null)
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        setLoading(true)
        const demo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
        if (demo) {
            // Simulate delay
            setTimeout(() => {
                setUsers(demoUsers)
                setLoading(false)
            }, 800)
            return
        }

        try {
            const token = getAuthToken()
            const res = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.error || 'Failed to fetch users')
            }

            const data = await res.json()
            setUsers(data.users || [])
        } catch (error: any) {
            console.error('Error fetching users:', error)
            alert('Failed to load users: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setActionLoading(true)

        if (isDemoMode) {
            setTimeout(() => {
                const mockUser = {
                    id: Math.random().toString(),
                    ...newUser,
                    created_at: new Date().toISOString(),
                    status: 'active'
                }
                setUsers([mockUser, ...users])
                setShowAddModal(false)
                setNewUser({ full_name: '', email: '', role: 'student', password: '' })
                setActionLoading(false)
                alert('User created successfully (Demo)')
            }, 1000)
            return
        }

        // Real implementation requires Backend Function or complex Auth handling
        // For now, we simulate profile creation (In real app, use supabase.auth.admin.createUser via Edge Function)
        alert('Creating users via Admin Panel requires backend integration. In this version, please ask users to Sign Up manually.')
        setActionLoading(false)
    }

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return

        if (isDemoMode) {
            setUsers(users.filter(u => u.id !== userId))
            return
        }

        // Implementation Note: Deleting from 'auth.users' needs Service Role.
        // Deleting from 'profiles' can be done if RLS allows.
        alert('Deleting users requires backend integration.')
    }

    const handleEditUser = (user: any) => {
        setEditingUser({ ...user })
        setShowEditModal(true)
    }

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setActionLoading(true)

        if (isDemoMode) {
            setTimeout(() => {
                setUsers(users.map(u => u.id === editingUser.id ? editingUser : u))
                setShowEditModal(false)
                setEditingUser(null)
                setActionLoading(false)
                alert('User updated successfully (Demo)')
            }, 1000)
            return
        }

        try {
            // Updated to avoid direct Supabase calls. In a full version, 
            // you'd call a PATCH /api/admin/users/[id] endpoint here.
            alert('Updating users requires a dedicated API endpoint. Please use the Add User feature or update directly in DB for now.')
        } catch (error) {
            console.error('Error updating user:', error)
            alert('Failed to update user')
        } finally {
            setActionLoading(false)
        }
    }

    // Filter Users
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesRole = roleFilter === 'all' || user.role === roleFilter
        return matchesSearch && matchesRole
    })

    const roleStats = {
        total: users.length,
        teachers: users.filter(u => u.role === 'teacher').length,
        students: users.filter(u => u.role === 'student').length
    }

    if (loading) return <PageLoading title="Loading Users..." />

    return (
        <div className="min-h-screen bg-[#0B1121] text-slate-100 p-8 lg:p-10">
            {/* Back Button */}
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group text-sm font-medium">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
            </Link>

            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">User Management</h1>
                    <p className="text-slate-400 mt-2">Manage all teachers and students in the organization</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5"
                >
                    <Plus className="w-5 h-5" />
                    Add User
                </button>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#131B2D] border border-white/5 p-6 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Users</p>
                        <p className="text-3xl font-bold text-white mt-2">{roleStats.total}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                        <Users className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-[#131B2D] border border-white/5 p-6 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Teachers</p>
                        <p className="text-3xl font-bold text-white mt-2">{roleStats.teachers}</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                        <UserCheck className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-[#131B2D] border border-white/5 p-6 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Students</p>
                        <p className="text-3xl font-bold text-white mt-2">{roleStats.students}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 border border-purple-500/20">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-[#131B2D] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                    />
                </div>
                <div className="flex bg-[#131B2D] p-1 rounded-xl border border-white/10">
                    {['all', 'teacher', 'student'].map((role) => (
                        <button
                            key={role}
                            onClick={() => setRoleFilter(role)}
                            className={`px-6 py-2 rounded-lg font-medium capitalize transition-all text-sm ${roleFilter === role
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-[#131B2D] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-500 bg-[#1A2438]/50">
                                <th className="px-8 py-4 font-semibold">User</th>
                                <th className="px-6 py-4 font-semibold">Role</th>
                                <th className="px-6 py-4 font-semibold">Created</th>
                                <th className="px-6 py-4 font-semibold text-center">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-white ring-2 ring-white/5 capitalize">
                                                    {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-white">{user.full_name || 'No Name'}</p>
                                                    <p className="text-slate-400 text-sm">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${user.role === 'teacher'
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-slate-400 text-sm">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="inline-flex w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors border border-transparent hover:border-white/10"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center text-slate-400">
                                        No users found matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#131B2D] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl p-8 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Add User</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={newUser.full_name}
                                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#0B1120] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-600"
                                    placeholder="e.g. John Doe"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#0B1120] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-600"
                                    placeholder="e.g. john@example.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Role</label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#0B1120] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                                >
                                    {actionLoading ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && editingUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#131B2D] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl p-8 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Edit User</h2>
                            <button onClick={() => { setShowEditModal(false); setEditingUser(null); }} className="text-slate-400 hover:text-white transition">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={editingUser.full_name}
                                    onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#0B1120] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-600"
                                    placeholder="e.g. John Doe"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={editingUser.email}
                                    disabled
                                    className="w-full px-4 py-3 bg-[#0B1120] border border-white/10 rounded-xl text-slate-500 cursor-not-allowed"
                                    placeholder="e.g. john@example.com"
                                />
                                <p className="text-xs text-slate-500 mt-1">Email cannot be changed from this panel</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Role</label>
                                <select
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                    className="w-full px-4 py-3 bg-[#0B1120] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setEditingUser(null); }}
                                    className="flex-1 py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                                >
                                    {actionLoading ? 'Updating...' : 'Update User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
