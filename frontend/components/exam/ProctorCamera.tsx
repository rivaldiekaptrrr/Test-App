'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { uploadSnapshot, logViolation } from '@/lib/api/golang-client'
import { getAuthToken } from '@/lib/db/client'

// Demo mode logic
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

// Type-only reference for face-api — loaded dynamically at runtime
type FaceApiModule = typeof import('@vladmandic/face-api')

interface ProctorCameraProps {
    sessionId: string
    interval?: number // seconds
    enabled?: boolean
    onError?: (error: string) => void
}

export function ProctorCamera({
    sessionId,
    interval = 30,
    enabled = true,
    onError
}: ProctorCameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [isRecording, setIsRecording] = useState(false)
    const [snapshotCount, setSnapshotCount] = useState(0)
    const [modelsLoaded, setModelsLoaded] = useState(false)
    const [faceCount, setFaceCount] = useState<number | null>(null)
    const [warning, setWarning] = useState<string | null>(null)
    const faceApiRef = useRef<FaceApiModule | null>(null)

    // Load AI Models dynamically (client-side only) to avoid SSR crash
    useEffect(() => {
        const loadModels = async () => {
            try {
                // Dynamic import ensures this never runs on the server
                const faceapi = await import('@vladmandic/face-api')
                faceApiRef.current = faceapi
                await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
                setModelsLoaded(true)
                console.log('Face detection models loaded successfully')
            } catch (err) {
                console.error('Failed to load face detection models', err)
            }
        }
        loadModels()
    }, [])

    // Initialize camera
    useEffect(() => {
        if (!enabled) return

        const initCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                })
                setStream(mediaStream)
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream
                }
                setIsRecording(true)
            } catch (err) {
                const errorMsg = 'Camera access denied. Proctoring requires camera permission.'
                console.error(errorMsg, err)
                onError?.(errorMsg)
            }
        }

        initCamera()

        return () => {
            stream?.getTracks().forEach(track => track.stop())
        }
    }, [enabled])

    // Capture and upload snapshots
    const captureSnapshot = useCallback(async () => {
        if (!stream || !videoRef.current || !enabled) return

        try {
            const canvas = document.createElement('canvas')
            const video = videoRef.current

            // Wait for video to be ready
            if (video.readyState !== video.HAVE_ENOUGH_DATA) {
                return
            }

            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext('2d')

            if (!ctx) return

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

            // Convert to blob
            canvas.toBlob(async (blob) => {
                if (!blob) return

                try {
                    // Get auth token (works in both demo and production mode)
                    const token = await getAuthToken()

                    // Upload to Golang backend (in demo mode, this just logs)
                    await uploadSnapshot(sessionId, blob, token)
                    setSnapshotCount(prev => prev + 1)

                    console.log(`Snapshot ${snapshotCount + 1} captured${isDemoMode ? ' (demo mode)' : ''}`)
                } catch (error) {
                    console.error('Failed to upload snapshot:', error)
                    onError?.('Failed to upload proctoring snapshot')
                }
            }, 'image/jpeg', 0.8)
        } catch (error) {
            console.error('Snapshot capture error:', error)
        }
    }, [stream, sessionId, enabled, snapshotCount, onError])

    // Setup interval for snapshots
    useEffect(() => {
        if (!enabled || !isRecording) return

        const intervalId = setInterval(captureSnapshot, interval * 1000)

        return () => clearInterval(intervalId)
    }, [interval, enabled, isRecording, captureSnapshot])

    // Setup interval for real-time face detection
    useEffect(() => {
        if (!enabled || !isRecording || !modelsLoaded) return

        let isDetecting = false

        const detectFaces = async () => {
            if (!videoRef.current || isDetecting) return
            
            if (videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) return

            isDetecting = true
            try {
                const faceapi = faceApiRef.current
                if (!faceapi) return

                // Detect faces
                const detections = await faceapi.detectAllFaces(
                    videoRef.current,
                    new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
                )
                
                const count = detections.length
                setFaceCount(count)

                // Check violations
                if (count > 1) {
                    setWarning('Multiple faces detected!')
                    const token = await getAuthToken()
                    await logViolation(sessionId, 'multiple_faces', { count }, token).catch(console.error)
                } else if (count === 0) {
                    setWarning('No face detected!')
                } else {
                    setWarning(null)
                }
            } catch (err) {
                console.error('Face detection error:', err)
            } finally {
                isDetecting = false
            }
        }

        const intervalId = setInterval(detectFaces, 2000) // Scan every 2 seconds

        return () => clearInterval(intervalId)
    }, [enabled, isRecording, modelsLoaded, sessionId])

    if (!enabled) return null

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="relative w-48 h-36 border-2 border-green-500 rounded-lg overflow-hidden shadow-lg bg-black">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                />

                {/* Recording indicator */}
                {isRecording && (
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <div className="flex items-center gap-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium w-fit">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            REC
                        </div>
                        {modelsLoaded && faceCount !== null && (
                            <div className="flex items-center gap-1 bg-black/60 text-white px-2 py-1 rounded text-[10px]">
                                👤 {faceCount}
                            </div>
                        )}
                    </div>
                )}

                {/* Snapshot count */}
                <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    Snapshots: {snapshotCount}
                </div>

                {/* Demo mode indicator */}
                {isDemoMode && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-medium">
                        DEMO
                    </div>
                )}
            </div>

            {/* Camera label */}
            <p className="text-xs text-center mt-1 text-slate-400 font-medium flex items-center justify-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${modelsLoaded ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                {modelsLoaded ? 'AI Proctoring Active' : 'Loading AI...'}
            </p>

            {/* Warning popup */}
            {warning && (
                <div className="absolute -top-12 right-0 bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-bounce whitespace-nowrap border border-rose-400">
                    ⚠️ {warning}
                </div>
            )}
        </div>
    )
}
