// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase, isDemoMode } from '@/lib/supabase/client'

interface TestResult {
    name: string
    status: 'success' | 'error' | 'pending'
    message: string
    details?: any
}

export default function TestDatabasePage() {
    const [tests, setTests] = useState<TestResult[]>([])
    const [isRunning, setIsRunning] = useState(false)

    const updateTest = (name: string, status: 'success' | 'error' | 'pending', message: string, details?: any) => {
        setTests(prev => {
            const existing = prev.find(t => t.name === name)
            if (existing) {
                return prev.map(t => t.name === name ? { name, status, message, details } : t)
            }
            return [...prev, { name, status, message, details }]
        })
    }

    const runTests = async () => {
        setIsRunning(true)
        setTests([])

        // Test 1: Backend Health Check
        updateTest('Backend Health', 'pending', 'Checking backend server...')
        try {
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
            const response = await fetch(`${backendUrl}/health`)
            const data = await response.json()

            if (response.ok) {
                updateTest('Backend Health', 'success', `Backend is running (uptime: ${data.uptime_seconds}s)`, data)
            } else {
                updateTest('Backend Health', 'error', 'Backend returned error', data)
            }
        } catch (error: any) {
            updateTest('Backend Health', 'error', `Backend not accessible: ${error.message}`)
        }

        // Test 2: Supabase Connection
        updateTest('Supabase Connection', 'pending', 'Testing Supabase connection...')
        try {
            if (!supabase) {
                updateTest('Supabase Connection', 'error', 'Supabase client not initialized. Check environment variables or disable demo mode.', {
                    isDemoMode,
                    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
                    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'
                })
            } else {
                const { data, error } = await supabase.from('profiles').select('count').limit(1)

                if (error) {
                    updateTest('Supabase Connection', 'error', `Supabase error: ${error.message}`, error)
                } else {
                    updateTest('Supabase Connection', 'success', 'Supabase connected successfully!', data)
                }
            }
        } catch (error: any) {
            updateTest('Supabase Connection', 'error', `Connection failed: ${error.message}`)
        }

        // Test 3: Database Tables
        updateTest('Database Tables', 'pending', 'Checking database tables...')
        try {
            if (!supabase) {
                updateTest('Database Tables', 'error', 'Supabase client not initialized. Cannot check tables.', {
                    note: 'Enable production mode and set Supabase credentials to test database tables'
                })
            } else {
                const tables = ['profiles', 'organizations', 'exams', 'exam_sessions', 'cheating_logs']
                const results: any = {}

                for (const table of tables) {
                    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
                    results[table] = error ? `❌ Error: ${error.message}` : `✅ ${count || 0} rows`
                }

                const allSuccess = Object.values(results).every((r: any) => r.startsWith('✅'))
                updateTest(
                    'Database Tables',
                    allSuccess ? 'success' : 'error',
                    allSuccess ? 'All tables accessible' : 'Some tables have issues',
                    results
                )
            }
        } catch (error: any) {
            updateTest('Database Tables', 'error', `Failed to check tables: ${error.message}`)
        }

        // Test 4: Authentication
        updateTest('Authentication', 'pending', 'Testing Supabase Auth...')
        try {
            if (!supabase) {
                updateTest('Authentication', 'error', 'Supabase client not initialized. Cannot check authentication.', {
                    note: 'Enable production mode and set Supabase credentials to test authentication'
                })
            } else {
                const { data: { session } } = await supabase.auth.getSession()

                if (session) {
                    updateTest('Authentication', 'success', `Logged in as: ${session.user.email}`, session.user)
                } else {
                    updateTest('Authentication', 'success', 'No active session (not logged in)', null)
                }
            }
        } catch (error: any) {
            updateTest('Authentication', 'error', `Auth check failed: ${error.message}`)
        }

        // Test 5: Storage Configuration
        updateTest('Environment Config', 'pending', 'Checking environment variables...')
        const config = {
            'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
            'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
            'NEXT_PUBLIC_API_URL': process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
            'NEXT_PUBLIC_DEMO_MODE': process.env.NEXT_PUBLIC_DEMO_MODE || 'false'
        }

        const allSet = config['NEXT_PUBLIC_SUPABASE_URL'] === '✅ Set' &&
            config['NEXT_PUBLIC_SUPABASE_ANON_KEY'] === '✅ Set'

        updateTest(
            'Environment Config',
            allSet ? 'success' : 'error',
            allSet ? 'All required env vars are set' : 'Some env vars are missing',
            config
        )

        setIsRunning(false)
    }

    useEffect(() => {
        runTests()
    }, [])

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700 px-8 py-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-gray-400 hover:text-white transition">
                            ← Back
                        </Link>
                        <h1 className="text-3xl font-bold">🔧 Database Test Center</h1>
                    </div>
                    <button
                        onClick={runTests}
                        disabled={isRunning}
                        className={`px-6 py-3 rounded-lg font-medium transition ${isRunning
                            ? 'bg-gray-600 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {isRunning ? '⏳ Testing...' : '🔄 Run Tests Again'}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-8 max-w-6xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
                    <p className="text-gray-400">
                        This page performs comprehensive checks on your database and backend connections.
                    </p>
                </div>

                {/* Test Results */}
                <div className="space-y-4">
                    {tests.map((test, index) => (
                        <div
                            key={index}
                            className={`p-6 rounded-xl border-2 transition-all ${test.status === 'success'
                                ? 'bg-green-500/10 border-green-500/50'
                                : test.status === 'error'
                                    ? 'bg-red-500/10 border-red-500/50'
                                    : 'bg-yellow-500/10 border-yellow-500/50 animate-pulse'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-2xl">
                                            {test.status === 'success' ? '✅' : test.status === 'error' ? '❌' : '⏳'}
                                        </span>
                                        <h3 className="text-xl font-bold">{test.name}</h3>
                                    </div>
                                    <p className={`text-sm ${test.status === 'success' ? 'text-green-400' :
                                        test.status === 'error' ? 'text-red-400' : 'text-yellow-400'
                                        }`}>
                                        {test.message}
                                    </p>

                                    {/* Details */}
                                    {test.details && (
                                        <details className="mt-4">
                                            <summary className="cursor-pointer text-gray-400 hover:text-white text-sm">
                                                Show Details
                                            </summary>
                                            <pre className="mt-2 p-4 bg-gray-800 rounded-lg text-xs overflow-auto max-h-64">
                                                {JSON.stringify(test.details, null, 2)}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {tests.length === 0 && !isRunning && (
                        <div className="text-center py-12 text-gray-400">
                            Click "Run Tests Again" to start testing...
                        </div>
                    )}
                </div>

                {/* Summary */}
                {tests.length > 0 && !isRunning && (
                    <div className="mt-8 p-6 bg-gray-800 rounded-xl border border-gray-700">
                        <h3 className="text-lg font-bold mb-4">Test Summary</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-4 bg-green-500/20 rounded-lg">
                                <div className="text-3xl font-bold text-green-400">
                                    {tests.filter(t => t.status === 'success').length}
                                </div>
                                <div className="text-sm text-gray-400 mt-1">Passed</div>
                            </div>
                            <div className="p-4 bg-red-500/20 rounded-lg">
                                <div className="text-3xl font-bold text-red-400">
                                    {tests.filter(t => t.status === 'error').length}
                                </div>
                                <div className="text-sm text-gray-400 mt-1">Failed</div>
                            </div>
                            <div className="p-4 bg-yellow-500/20 rounded-lg">
                                <div className="text-3xl font-bold text-yellow-400">
                                    {tests.filter(t => t.status === 'pending').length}
                                </div>
                                <div className="text-sm text-gray-400 mt-1">Pending</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Troubleshooting */}
                <div className="mt-8 p-6 bg-blue-500/10 border-2 border-blue-500/50 rounded-xl">
                    <h3 className="text-lg font-bold mb-3">🔍 Troubleshooting Guide</h3>
                    <ul className="space-y-2 text-sm text-gray-300">
                        <li>• <strong>Backend not accessible:</strong> Make sure backend server is running (go run cmd/server/main.go)</li>
                        <li>• <strong>Supabase error:</strong> Check your .env file has correct NEXT_PUBLIC_SUPABASE_URL and ANON_KEY</li>
                        <li>• <strong>Table errors:</strong> Run database migrations in Supabase SQL Editor (database/schema.sql)</li>
                        <li>• <strong>Auth issues:</strong> Login first at /login page if testing with real authentication</li>
                    </ul>
                </div>
            </main>
        </div>
    )
}
