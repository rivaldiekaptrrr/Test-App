/**
 * Auto-grading utility for essay questions using keyword matching
 */

// Common stopwords to ignore (Indonesian + English)
const STOPWORDS = new Set([
    // Indonesian
    'dan', 'atau', 'yang', 'adalah', 'pada', 'di', 'ke', 'dari', 'untuk',
    'dengan', 'dalam', 'oleh', 'akan', 'sebagai', 'ini', 'itu', 'tersebut',
    'dapat', 'telah', 'sudah', 'belum', 'tidak', 'bukan', 'juga', 'lebih',
    'sangat', 'ada', 'jika', 'maka', 'karena', 'sehingga', 'bahwa', 'antara',
    // English
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'should', 'could', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
])

/**
 * Extract keywords from text
 */
export function extractKeywords(text: string, minLength: number = 3): string[] {
    if (!text || typeof text !== 'string') return []

    // Convert to lowercase and split into words
    const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Remove punctuation
        .split(/\s+/)
        .filter(word => word.length >= minLength)
        .filter(word => !STOPWORDS.has(word))

    // Remove duplicates
    return Array.from(new Set(words))
}

/**
 * Simple stemming for common patterns
 */
export function stemWord(word: string): string {
    // Indonesian suffixes
    if (word.endsWith('kan')) return word.slice(0, -3)
    if (word.endsWith('an')) return word.slice(0, -2)
    if (word.endsWith('i')) return word.slice(0, -1)

    // English suffixes
    if (word.endsWith('ing')) return word.slice(0, -3)
    if (word.endsWith('ed')) return word.slice(0, -2)
    if (word.endsWith('s') && word.length > 3) return word.slice(0, -1)

    return word
}

/**
 * Calculate keyword match percentage between student answer and expected answer
 */
export function calculateKeywordMatch(
    studentAnswer: string,
    expectedAnswer: string,
    customKeywords?: string[]
): {
    matchPercentage: number
    matchedKeywords: string[]
    totalKeywords: number
    studentKeywords: string[]
} {
    // Extract keywords from expected answer
    let expectedKeywords = customKeywords && customKeywords.length > 0
        ? customKeywords.map(k => k.toLowerCase().trim())
        : extractKeywords(expectedAnswer)

    // Extract keywords from student answer
    const studentKeywords = extractKeywords(studentAnswer)

    // Stem both sets of keywords
    const stemmedExpected = expectedKeywords.map(stemWord)
    const stemmedStudent = studentKeywords.map(stemWord)

    // Find matches
    const matchedKeywords: string[] = []
    stemmedExpected.forEach((expectedWord, index) => {
        if (stemmedStudent.includes(expectedWord)) {
            matchedKeywords.push(expectedKeywords[index])
        }
    })

    // Calculate percentage
    const matchPercentage = expectedKeywords.length > 0
        ? (matchedKeywords.length / expectedKeywords.length) * 100
        : 0

    return {
        matchPercentage: Math.round(matchPercentage * 100) / 100, // Round to 2 decimals
        matchedKeywords,
        totalKeywords: expectedKeywords.length,
        studentKeywords
    }
}

/**
 * Calculate score based on match percentage and thresholds
 */
export function calculateAutoGradedScore(
    matchPercentage: number,
    maxPoints: number,
    minThreshold: number = 0.5
): {
    score: number
    tier: 'full' | 'high' | 'medium' | 'low' | 'fail'
    percentage: number
} {
    let scorePercentage = 0
    let tier: 'full' | 'high' | 'medium' | 'low' | 'fail' = 'fail'

    if (matchPercentage >= 100) {
        scorePercentage = 1.0
        tier = 'full'
    } else if (matchPercentage >= 75) {
        scorePercentage = 0.75
        tier = 'high'
    } else if (matchPercentage >= 50) {
        scorePercentage = 0.50
        tier = 'medium'
    } else if (matchPercentage >= minThreshold * 100) {
        scorePercentage = minThreshold
        tier = 'low'
    } else {
        scorePercentage = 0
        tier = 'fail'
    }

    const score = Math.round(maxPoints * scorePercentage * 100) / 100

    return {
        score,
        tier,
        percentage: scorePercentage * 100
    }
}

/**
 * Auto-grade essay question
 */
export function autoGradeEssay(
    studentAnswer: string,
    expectedAnswer: string,
    customKeywords: string[] | undefined,
    maxPoints: number,
    minThreshold: number = 0.5
): {
    score: number
    matchPercentage: number
    tier: string
    matchedKeywords: string[]
    totalKeywords: number
    feedback: string
} {
    const match = calculateKeywordMatch(studentAnswer, expectedAnswer, customKeywords)
    const grading = calculateAutoGradedScore(match.matchPercentage, maxPoints, minThreshold)

    let feedback = ''
    if (grading.tier === 'full') {
        feedback = '✅ Excellent! All key concepts covered.'
    } else if (grading.tier === 'high') {
        feedback = '👍 Good answer! Most key concepts covered.'
    } else if (grading.tier === 'medium') {
        feedback = '⚠️ Partial credit. Some key concepts missing.'
    } else if (grading.tier === 'low') {
        feedback = '⚠️ Minimal points awarded. Many key concepts missing.'
    } else {
        feedback = '❌ Answer does not meet minimum requirements.'
    }

    return {
        score: grading.score,
        matchPercentage: match.matchPercentage,
        tier: grading.tier,
        matchedKeywords: match.matchedKeywords,
        totalKeywords: match.totalKeywords,
        feedback
    }
}

/**
 * Format keywords for display
 */
export function formatKeywords(keywords: string[]): string {
    if (!keywords || keywords.length === 0) return 'None'
    return keywords.map(k => `"${k}"`).join(', ')
}
