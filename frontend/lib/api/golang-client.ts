// Golang API client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export async function uploadSnapshot(sessionId: string, imageBlob: Blob, token: string) {
    // In demo mode, just log and return success
    if (isDemoMode) {
        console.log('[DEMO MODE] Snapshot upload simulated:', { sessionId, size: imageBlob.size })
        return {
            success: true,
            file_path: `demo/exam1/user1/${new Date().toISOString()}.jpg`,
            size_kb: Math.round(imageBlob.size / 1024)
        }
    }

    const formData = new FormData()
    formData.append('session_id', sessionId)
    formData.append('timestamp', new Date().toISOString())
    formData.append('image', imageBlob, 'snapshot.jpg')

    const response = await fetch(`${API_BASE_URL}/proctoring/snapshot`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    })

    if (!response.ok) {
        throw new Error('Failed to upload snapshot')
    }

    return response.json()
}

export async function logViolation(
    sessionId: string,
    violationType: string,
    metadata: Record<string, any>,
    token: string,
    snapshot?: string
) {
    // In demo mode, just log and return success
    if (isDemoMode) {
        console.warn('[DEMO MODE] Violation logged:', { sessionId, violationType, metadata })
        return {
            success: true,
            log_id: `demo-log-${Date.now()}`,
            auto_blocked: metadata.count >= 3
        }
    }

    const response = await fetch(`${API_BASE_URL}/proctoring/violation`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            session_id: sessionId,
            violation_type: violationType,
            metadata,
            snapshot,
        }),
    })

    if (!response.ok) {
        throw new Error('Failed to log violation')
    }

    return response.json()
}

export async function getSnapshotUrl(
    orgId: string,
    examId: string,
    userId: string,
    filename: string,
    token: string
): Promise<string> {
    if (isDemoMode) {
        return `demo/snapshots/${filename}`
    }
    return `${API_BASE_URL}/files/proctoring/${orgId}/${examId}/${userId}/${filename}?token=${token}`
}
