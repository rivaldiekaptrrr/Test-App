// @ts-nocheck
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { getAuthToken, isDemoMode } from '@/lib/db/client'
import LoadingSpinner from '@/components/Loading'
import {
    ChevronLeft,
    User,
    Video,
    Bell,
    Building,
    Lock,
    Key,
    Mail,
    HardDrive,
    AlertTriangle,
    CheckCircle,
    AlertCircle,
    Trash2
} from 'lucide-react'

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('profile')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [showToast, setShowToast] = useState(false)
    const [toastMessage, setToastMessage] = useState('')
    const [toastType, setToastType] = useState<'success' | 'error'>('success')

    // Demo/Real form states
    const [profile, setProfile] = useState({
        fullName: '',
        email: '',
        role: 'Administrator',
        avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff'
    })

    const [organization, setOrganization] = useState({
        name: '',
        domain: '',
        storagePath: ''
    })

    const [proctoring, setProctoring] = useState({
        cameraInterval: 30,
        maxTabSwitches: 2,
        enableFaceDetection: true,
        enablePhoneDetection: false,
        autoBlockOnViolation: true
    })

    const [notifications, setNotifications] = useState({
        emailOnViolation: true,
        emailOnCompletion: true,
        dailyReport: false
    })

    // Security settings state
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    })

    // Email change state (separate from profile display email)
    const [emailChange, setEmailChange] = useState({
        newEmail: '',
        emailPending: false
    })

    // LOAD DATA
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            try {
                // LOAD DEMO DATA
                if (isDemoMode) {
                    setIsLoggedIn(true) // Demo mode is always "logged in"
                    const savedProfile = localStorage.getItem('demo_profile')
                    if (savedProfile) {
                        setProfile(JSON.parse(savedProfile))
                    } else {
                        // Default Demo Data
                        setProfile({
                            fullName: 'Admin Demo',
                            email: 'admin@demo.com',
                            role: 'Administrator',
                            avatar: 'https://ui-avatars.com/api/?name=Admin+Demo&background=0D8ABC&color=fff'
                        })
                    }

                    const savedOrg = localStorage.getItem('demo_organization')
                    if (savedOrg) {
                        setOrganization(JSON.parse(savedOrg))
                    } else {
                        setOrganization({
                            name: 'Demo University',
                            domain: 'demo.edu',
                            storagePath: './uploads/demo'
                        })
                    }

                    // Load saved proctoring/notifications
                    const savedProctoring = localStorage.getItem('demo_proctoring')
                    if (savedProctoring) setProctoring(JSON.parse(savedProctoring))

                    const savedNotifications = localStorage.getItem('demo_notifications')
                    if (savedNotifications) setNotifications(JSON.parse(savedNotifications))

                } else {
                    // LOAD REAL DATA FROM INTERNAL API
                    const token = getAuthToken()
                    if (!token) {
                        setIsLoggedIn(false)
                        return
                    }

                    setIsLoggedIn(true)

                    const res = await fetch('/api/settings', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                    const data = await res.json()
                    
                    if (res.ok) {
                        if (data.profile) {
                            setProfile({
                                fullName: data.profile.full_name || '',
                                email: data.profile.email || '',
                                role: data.profile.role || 'User',
                                avatar: data.profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.profile.full_name || 'User')}&background=0D8ABC&color=fff`
                            })
                        }
                        
                        if (data.organization) {
                            setOrganization({
                                name: data.organization.name || '',
                                domain: data.organization.domain || '',
                                storagePath: data.organization.storage_path || ''
                            })
                        } else {
                            setOrganization({
                                name: 'My Organization',
                                domain: '',
                                storagePath: './uploads'
                            })
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading settings:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [])

    // Toast notification function
    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setToastMessage(message)
        setToastType(type)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
    }

    // Save handlers
    const handleSaveProfile = async () => {
        if (isSaving) return
        setIsSaving(true)

        try {
            // Validation
            if (!profile.fullName.trim()) {
                showNotification('Full name is required', 'error')
                return
            }

            if (isDemoMode) {
                // DEMO MODE
                localStorage.setItem('demo_profile', JSON.stringify(profile))
                showNotification('Profile updated successfully! (Demo)')
            } else {
                // REAL MODE
                const token = getAuthToken()
                if (!token) {
                    showNotification('You must be logged in to save', 'error')
                    return
                }

                const res = await fetch('/api/settings', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        type: 'profile',
                        payload: { fullName: profile.fullName }
                    })
                })

                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.error || 'Failed to update profile')
                }
                
                showNotification('Profile updated successfully!')
            }
        } catch (error: any) {
            console.error('Save profile error:', error)
            showNotification(`Failed to save profile: ${error.message || 'Unknown error'}`, 'error')
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveProctoring = () => {
        try {
            // Validation
            if (proctoring.cameraInterval < 5) {
                showNotification('Camera interval must be at least 5 seconds', 'error')
                return
            }
            if (proctoring.maxTabSwitches < 0) {
                showNotification('Max tab switches cannot be negative', 'error')
                return
            }

            // Save to localStorage (works for both modes as fallback)
            if (typeof window !== 'undefined') {
                localStorage.setItem('demo_proctoring', JSON.stringify(proctoring))
            }

            if (isDemoMode) {
                showNotification('Proctoring settings saved! (Demo)')
            } else {
                // In real mode, proctoring settings are per-exam, not global user settings
                // Save locally for now, will apply when creating/editing exams
                showNotification('Proctoring defaults saved locally (will apply to new exams)')
            }
        } catch (error) {
            showNotification('Failed to save settings', 'error')
        }
    }

    const handleSaveNotifications = () => {
        try {
            // Save to localStorage (works for both modes)
            if (typeof window !== 'undefined') {
                localStorage.setItem('demo_notifications', JSON.stringify(notifications))
            }

            if (isDemoMode) {
                showNotification('Notification preferences saved! (Demo)')
            } else {
                // Notification settings not yet in database schema
                // Saved locally for now
                showNotification('Notification preferences saved locally (DB integration coming soon)')
            }
        } catch (error) {
            showNotification('Failed to save notifications', 'error')
        }
    }

    const handleSaveOrganization = async () => {
        try {
            if (!organization.name.trim()) {
                showNotification('Organization name is required', 'error')
                return
            }

            if (isDemoMode) {
                // DEMO MODE
                localStorage.setItem('demo_organization', JSON.stringify(organization))
                showNotification('Organization settings saved! (Demo)')
            } else {
                // REAL MODE
                const token = getAuthToken()
                if (!token) {
                    showNotification('You must be logged in to save', 'error')
                    return
                }

                const res = await fetch('/api/settings', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        type: 'organization',
                        payload: organization
                    })
                })

                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.error || 'Failed to update organization')
                }
                
                showNotification('Organization settings updated successfully!')
            }
        } catch (error: any) {
            console.error('Save org error:', error)
            showNotification(`Failed to save organization: ${error.message}`, 'error')
        }
    }

    const handleChangePassword = async () => {
        try {
            if (isDemoMode) {
                showNotification('Password change is disabled in Demo Mode', 'error')
                return
            }
            if (!passwords.current.trim()) {
                showNotification('Current password is required', 'error')
                return
            }
            if (!passwords.new.trim() || passwords.new.length < 6) {
                showNotification('New password must be at least 6 characters', 'error')
                return
            }
            if (passwords.new !== passwords.confirm) {
                showNotification('New passwords do not match', 'error')
                return
            }
            
            const token = getAuthToken()
            if (!token) return

            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: 'password',
                    payload: { current: passwords.current, new: passwords.new }
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to update password')
            }

            setPasswords({ current: '', new: '', confirm: '' })
            showNotification('Password updated successfully!')
        } catch (error: any) {
            console.error('Password change error:', error)
            showNotification(`Failed to change password: ${error.message}`, 'error')
        }
    }

    const handleChangeEmail = async () => {
        if (isSaving) return
        setIsSaving(true)

        try {
            if (isDemoMode) {
                showNotification('Email change is disabled in Demo Mode', 'error')
                return
            }
            if (!emailChange.newEmail.trim() || !emailChange.newEmail.includes('@')) {
                showNotification('Please enter a valid email address', 'error')
                return
            }
            if (emailChange.newEmail === profile.email) {
                showNotification('New email is same as current email', 'error')
                return
            }
            
            // For now, return a placeholder success since changing email requires more complex auth flows
            showNotification('Email update capability requires additional verification logic in internal API.', 'error')
            
        } catch (error: any) {
            console.error('Email change error:', error)
            showNotification(`Failed to change email: ${error.message}`, 'error')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0B1121] text-slate-100">
            {/* Header */}
            <header className="bg-[#0F1623] border-b border-white/5 px-8 py-5 sticky top-0 z-30">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-slate-400 hover:text-white transition group flex items-center gap-1 text-sm font-medium">
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Dashboard
                        </Link>
                        <div className="h-6 w-px bg-white/10 mx-2"></div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Settings</h1>
                    </div>
                    {isDemoMode && (
                        <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-full border border-amber-500/20 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            Demo Mode
                        </span>
                    )}
                </div>
            </header>

            <div className="flex min-h-[calc(100vh-73px)]">
                {/* Sidebar */}
                <aside className="w-64 bg-[#0F1623] border-r border-white/5 hidden md:block">
                    <nav className="p-4 space-y-1">
                        {[
                            { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
                            { id: 'proctoring', label: 'Proctoring', icon: <Video className="w-5 h-5" /> },
                            { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
                            { id: 'organization', label: 'Organization', icon: <Building className="w-5 h-5" /> },
                            { id: 'security', label: 'Security', icon: <Lock className="w-5 h-5" /> },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-400'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                                    }`}
                            >
                                <span className="text-lg opacity-80">{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8 overflow-y-auto">
                    {/* Loading State */}
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <LoadingSpinner text="Loading settings..." />
                        </div>
                    ) : !isLoggedIn && !isDemoMode ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center bg-[#131B2D] p-10 rounded-3xl border border-white/5 border-dashed">
                                <Lock className="w-16 h-16 text-slate-500 mb-4 mx-auto" />
                                <h3 className="text-xl font-bold text-white mb-2">Login Required</h3>
                                <p className="text-slate-400 mb-6 text-sm">You need to be logged in to access settings.</p>
                                <Link href="/login">
                                    <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-600/20">
                                        Go to Login
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-in-up">
                            {/* Profile Settings */}
                            {activeTab === 'profile' && (
                                <div className="max-w-3xl">
                                    <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Profile Settings</h2>
                                    <div className="bg-[#131B2D] rounded-2xl p-8 border border-white/5 shadow-xl">
                                        {/* Avatar */}
                                        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-white/5">
                                            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-4xl text-white font-bold shadow-lg ring-4 ring-[#131B2D]">
                                                {profile.fullName.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <button className="px-5 py-2.5 bg-[#1F2937] text-white rounded-xl text-sm font-semibold hover:bg-white/10 border border-white/10 transition">
                                                    Change Photo
                                                </button>
                                                <p className="text-slate-500 text-xs mt-2">JPG, PNG or GIF. Max 2MB</p>
                                            </div>
                                        </div>

                                        {/* Form Fields */}
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Full Name</label>
                                                    <input
                                                        type="text"
                                                        value={profile.fullName}
                                                        onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                                                        className="w-full px-4 py-3 bg-[#0B1120] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Role</label>
                                                    <input
                                                        type="text"
                                                        value={profile.role}
                                                        disabled
                                                        className="w-full px-4 py-3 bg-[#0B1120]/50 border border-white/5 rounded-xl text-slate-500 cursor-not-allowed"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Email</label>
                                                <input
                                                    type="email"
                                                    value={profile.email}
                                                    disabled
                                                    className="w-full px-4 py-3 bg-[#0B1120]/50 border border-white/5 rounded-xl text-slate-500 cursor-not-allowed"
                                                />
                                                <p className="text-slate-500 text-xs mt-2">
                                                    To change your login email, go to <button type="button" onClick={() => setActiveTab('security')} className="text-blue-400 hover:text-blue-300 font-medium hover:underline transition-colors">Security settings</button>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                                            <button
                                                onClick={handleSaveProfile}
                                                disabled={isSaving}
                                                className={`px-8 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg ${isSaving
                                                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                                    : 'bg-blue-600 text-white hover:bg-blue-500 hover:-translate-y-0.5 shadow-blue-600/20'
                                                    }`}
                                            >
                                                {isSaving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Proctoring Settings */}
                            {activeTab === 'proctoring' && (
                                <div className="max-w-3xl">
                                    <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Proctoring Settings</h2>
                                    <div className="bg-[#131B2D] rounded-2xl p-8 border border-white/5 shadow-xl space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                                                    Camera Snapshot Interval (seconds)
                                                </label>
                                                <input
                                                    type="number"
                                                    value={proctoring.cameraInterval}
                                                    onChange={(e) => setProctoring({ ...proctoring, cameraInterval: parseInt(e.target.value) })}
                                                    className="w-full px-4 py-3 bg-[#0B1120] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                                />
                                                <p className="text-slate-500 text-xs mt-2">How often to capture camera snapshots</p>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                                                    Max Tab Switches Allowed
                                                </label>
                                                <input
                                                    type="number"
                                                    value={proctoring.maxTabSwitches}
                                                    onChange={(e) => setProctoring({ ...proctoring, maxTabSwitches: parseInt(e.target.value) })}
                                                    className="w-full px-4 py-3 bg-[#0B1120] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                                />
                                                <p className="text-slate-500 text-xs mt-2">Set to 0 to completely disable tab switching</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Detection Features</h3>

                                            {[
                                                { label: 'Face Detection', desc: 'Detect if student face is visible', setting: 'enableFaceDetection' },
                                                { label: 'Phone Detection', desc: 'AI detection for mobile phone usage', setting: 'enablePhoneDetection' },
                                                { label: 'Auto-block on Violation', desc: 'Automatically terminate exam after max violations', setting: 'autoBlockOnViolation' },
                                            ].map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-4 bg-[#0B1120]/50 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                                    <div>
                                                        <p className="text-white font-medium">{item.label}</p>
                                                        <p className="text-slate-400 text-sm">{item.desc}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setProctoring({ ...proctoring, [item.setting]: !proctoring[item.setting as keyof typeof proctoring] })}
                                                        className={`w-14 h-7 rounded-full transition-all duration-300 relative ${proctoring[item.setting as keyof typeof proctoring]
                                                            ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]'
                                                            : 'bg-[#1F2937]'
                                                            }`}
                                                    >
                                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm ${proctoring[item.setting as keyof typeof proctoring]
                                                            ? 'left-8'
                                                            : 'left-1'
                                                            }`}></div>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <button
                                                onClick={handleSaveProctoring}
                                                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5"
                                            >
                                                Save Proctoring Settings
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notifications */}
                            {activeTab === 'notifications' && (
                                <div className="max-w-3xl">
                                    <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Notification Settings</h2>
                                    <div className="bg-[#131B2D] rounded-2xl p-8 border border-white/5 shadow-xl space-y-4">
                                        {[
                                            { key: 'emailOnViolation', label: 'Email on Violation', desc: 'Get notified when a violation is detected' },
                                            { key: 'emailOnCompletion', label: 'Email on Completion', desc: 'Get notified when a student completes an exam' },
                                            { key: 'dailyReport', label: 'Daily Report', desc: 'Receive daily summary of exam activities' },
                                        ].map((item) => (
                                            <div key={item.key} className="flex items-center justify-between p-4 bg-[#0B1120]/50 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                                <div>
                                                    <p className="text-white font-medium">{item.label}</p>
                                                    <p className="text-slate-400 text-sm">{item.desc}</p>
                                                </div>
                                                <button
                                                    onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                                                    className={`w-14 h-7 rounded-full transition-all duration-300 relative ${notifications[item.key as keyof typeof notifications]
                                                        ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]'
                                                        : 'bg-[#1F2937]'
                                                        }`}
                                                >
                                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm ${notifications[item.key as keyof typeof notifications]
                                                        ? 'left-8'
                                                        : 'left-1'
                                                        }`}></div>
                                                </button>
                                            </div>
                                        ))}

                                        <div className="pt-6 mt-4 border-t border-white/5 flex justify-end">
                                            <button
                                                onClick={handleSaveNotifications}
                                                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 hover:-translate-y-0.5"
                                            >
                                                Save Preferences
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Organization */}
                            {activeTab === 'organization' && (
                                <div className="max-w-3xl">
                                    <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Organization Settings</h2>
                                    <div className="bg-[#131B2D] rounded-2xl p-8 border border-white/5 shadow-xl space-y-6">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Organization Name</label>
                                            <div className="relative">
                                                <Building className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                                                <input
                                                    type="text"
                                                    value={organization.name}
                                                    onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-3 bg-[#0B1120] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Storage Path</label>
                                            <div className="relative">
                                                <HardDrive className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                                                <input
                                                    type="text"
                                                    value={organization.storagePath}
                                                    onChange={(e) => setOrganization({ ...organization, storagePath: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-3 bg-[#0B1120] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                                                />
                                            </div>
                                            <p className="text-slate-500 text-xs mt-2">Where proctoring snapshots are stored</p>
                                        </div>

                                        <div className="pt-6 border-t border-white/5 flex justify-end">
                                            <button
                                                onClick={handleSaveOrganization}
                                                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 hover:-translate-y-0.5"
                                            >
                                                Update Organization
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Security */}
                            {activeTab === 'security' && (
                                <div className="max-w-3xl">
                                    <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Security Settings</h2>
                                    <div className="bg-[#131B2D] rounded-2xl p-8 border border-white/5 shadow-xl space-y-8">
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                <Key className="w-5 h-5 text-blue-500" /> Change Password
                                            </h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Current Password</label>
                                                    <input
                                                        type="password"
                                                        value={passwords.current}
                                                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                                        placeholder="••••••••"
                                                        className="w-full px-4 py-3 bg-[#0B1120] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">New Password</label>
                                                        <input
                                                            type="password"
                                                            value={passwords.new}
                                                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                                            placeholder="••••••••"
                                                            className="w-full px-4 py-3 bg-[#0B1120] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Confirm New Password</label>
                                                        <input
                                                            type="password"
                                                            value={passwords.confirm}
                                                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                                            placeholder="••••••••"
                                                            className="w-full px-4 py-3 bg-[#0B1120] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex justify-end">
                                                <button
                                                    onClick={handleChangePassword}
                                                    disabled={isDemoMode}
                                                    className={`px-6 py-2.5 rounded-xl font-bold transition text-sm ${isDemoMode
                                                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                                        : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20'}`}
                                                >
                                                    {isDemoMode ? 'Password Change Disabled (Demo)' : 'Update Password'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Change Email Section */}
                                        <div className="pt-8 border-t border-white/5">
                                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                <Mail className="w-5 h-5 text-blue-500" /> Change Email
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Current Email</label>
                                                        <input
                                                            type="email"
                                                            value={profile.email}
                                                            disabled
                                                            className="w-full px-4 py-3 bg-[#0B1120]/50 border border-white/5 rounded-xl text-slate-500 cursor-not-allowed"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">New Email</label>
                                                        <input
                                                            type="email"
                                                            value={emailChange.newEmail}
                                                            onChange={(e) => setEmailChange({ ...emailChange, newEmail: e.target.value })}
                                                            placeholder="newemail@example.com"
                                                            disabled={isDemoMode}
                                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${isDemoMode
                                                                ? 'bg-[#0B1120]/50 border-white/5 text-slate-500 cursor-not-allowed'
                                                                : 'bg-[#0B1120] border-white/10 text-white'
                                                                }`}
                                                        />
                                                    </div>
                                                </div>
                                                {emailChange.emailPending && (
                                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                                                        <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                        </svg>
                                                        <p className="text-amber-400 text-sm">
                                                            Verification email sent! Check your new email inbox and click the confirmation link.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-4 flex justify-end">
                                                <button
                                                    onClick={handleChangeEmail}
                                                    disabled={isDemoMode || isSaving}
                                                    className={`px-6 py-2.5 rounded-xl font-bold transition text-sm ${isDemoMode || isSaving
                                                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                                        : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20'
                                                        }`}
                                                >
                                                    {isDemoMode ? 'Email Change Disabled (Demo)' : isSaving ? 'Sending...' : 'Change Email'}
                                                </button>
                                            </div>
                                            {!isDemoMode && (
                                                <p className="text-slate-500 text-xs mt-3 text-right">
                                                    A confirmation link will be sent to your new email address.
                                                </p>
                                            )}
                                        </div>

                                        <div className="pt-8 border-t border-white/5">
                                            <h3 className="text-lg font-bold text-rose-500 mb-4 flex items-center gap-2">
                                                <span>⚠️</span> Danger Zone
                                            </h3>
                                            <div className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-center justify-between">
                                                <div>
                                                    <p className="text-white font-bold mb-1">Delete Account</p>
                                                    <p className="text-slate-400 text-sm">
                                                        Once you delete your account, there is no going back. Please be certain.
                                                    </p>
                                                </div>
                                                <button className="px-5 py-2.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-sm font-bold hover:bg-rose-500 hover:text-white transition-all">
                                                    Delete Account
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Toast Notification */}
            {showToast && (
                <div className="fixed bottom-8 right-8 z-50 animate-slide-up">
                    <div className={`px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-md flex items-center gap-3 ${toastType === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}>
                        <span className="text-xl">
                            {toastType === 'success' ? '✅' : '⚠️'}
                        </span>
                        <p className="font-bold text-sm tracking-wide">{toastMessage}</p>
                    </div>
                </div>
            )}
        </div>
    )
}
