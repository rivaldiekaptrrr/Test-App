/**
 * Auto-save hook for exam answers
 * Saves answers automatically with debouncing on change
 */

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface UseAutoSaveOptions {
    sessionId: string
    answers: Record<string, any>
    enabled?: boolean
    debounceMs?: number
}

interface AutoSaveStatus {
    saving: boolean
    lastSaved: Date | null
    error: string | null
}

export function useAutoSave({
    sessionId,
    answers,
    enabled = true,
    debounceMs = 3000
}: UseAutoSaveOptions) {
    const [status, setStatus] = useState<AutoSaveStatus>({
        saving: false,
        lastSaved: null,
        error: null
    })

    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
    const previousAnswersRef = useRef<string>(JSON.stringify(answers))

    const saveAnswers = async () => {
        if (!supabase || !enabled) return

        try {
            setStatus(prev => ({ ...prev, saving: true, error: null }))

            const { error } = await supabase
                .from('exam_sessions')
                .update({
                    answers,
                    updated_at: new Date().toISOString()
                })
                .eq('id', sessionId)

            if (error) throw error

            setStatus({
                saving: false,
                lastSaved: new Date(),
                error: null
            })

            console.log('✅ Auto-saved answers:', Object.keys(answers).length, 'questions')
        } catch (error: any) {
            console.error('❌ Auto-save failed:', error)
            setStatus(prev => ({
                ...prev,
                saving: false,
                error: error.message
            }))
        }
    }

    useEffect(() => {
        if (!enabled) return

        const currentAnswers = JSON.stringify(answers)

        // Only save if answers actually changed
        if (currentAnswers !== previousAnswersRef.current) {
            // Clear existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            // Set new timeout for debounced save
            timeoutRef.current = setTimeout(() => {
                saveAnswers()
            }, debounceMs)

            // Update previous answers reference
            previousAnswersRef.current = currentAnswers
        }

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [answers, enabled, debounceMs])

    // Manual save function (for submit)
    const forceSave = async () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        await saveAnswers()
    }

    return {
        ...status,
        forceSave
    }
}
