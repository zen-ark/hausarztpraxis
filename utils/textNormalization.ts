// Text normalization utilities for better search and comprehension

interface NormalizationResult {
  normalized: string
  original: string
  corrections: string[]
}

// Common German typos and variations
const GERMAN_CORRECTIONS: Record<string, string> = {
  // Umlaut variations
  'gerat': 'gerät',
  'gerate': 'geräte',
  'bestellproxes': 'bestellprozess',
  'bestellproxess': 'bestellprozess',
  'bestellproxess': 'bestellprozess',
  'durchfuhrung': 'durchführung',
  'durchfuehrung': 'durchführung',
  'durchfuehrungen': 'durchführungen',
  'uberweisung': 'überweisung',
  'uberweisungen': 'überweisungen',
  'uberweisungs': 'überweisungs',
  'rezept': 'rezept',
  'rezepte': 'rezepte',
  'termin': 'termin',
  'termine': 'termine',
  'terminvereinbarung': 'terminvereinbarung',
  'terminvereinbarungen': 'terminvereinbarungen',
  
  // Common misspellings
  'hausarzt': 'hausarzt',
  'hausarztpraxis': 'hausarztpraxis',
  'praxis': 'praxis',
  'patient': 'patient',
  'patienten': 'patienten',
  'behandlung': 'behandlung',
  'behandlungen': 'behandlungen',
  'medikament': 'medikament',
  'medikamente': 'medikamente',
  'arzt': 'arzt',
  'arzte': 'ärzte',
  'krankenkasse': 'krankenkasse',
  'versicherung': 'versicherung',
  'krankheit': 'krankheit',
  'krankheiten': 'krankheiten',
  
  // Plural/singular variations
  'schritt': 'schritt',
  'schritte': 'schritte',
  'anleitung': 'anleitung',
  'anleitungen': 'anleitungen',
  'verfahren': 'verfahren',
  'prozess': 'prozess',
  'prozesse': 'prozesse',
  'ablauf': 'ablauf',
  'ablaufe': 'abläufe',
  'ablaufe': 'abläufe'
}

// Levenshtein distance calculation
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null))
  
  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i
  }
  
  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j
  }
  
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      )
    }
  }
  
  return matrix[b.length][a.length]
}

// Find closest match in dictionary
function findClosestMatch(word: string, dictionary: Record<string, string>, maxDistance = 2): string | null {
  let bestMatch = null
  let bestDistance = maxDistance + 1
  
  for (const [key, value] of Object.entries(dictionary)) {
    const distance = levenshteinDistance(word.toLowerCase(), key.toLowerCase())
    if (distance < bestDistance) {
      bestDistance = distance
      bestMatch = value
    }
  }
  
  return bestMatch
}

// Normalize text with typo correction and preprocessing
export function normalizeText(input: string): NormalizationResult {
  const original = input.trim()
  const corrections: string[] = []
  
  // Split into words and process each
  const words = original.split(/\s+/)
  const normalizedWords = words.map(word => {
    // Remove punctuation for matching
    const cleanWord = word.replace(/[^\wäöüßÄÖÜ]/g, '').toLowerCase()
    
    if (!cleanWord) return word
    
    // Check for exact matches first
    if (GERMAN_CORRECTIONS[cleanWord]) {
      const correction = GERMAN_CORRECTIONS[cleanWord]
      if (correction !== cleanWord) {
        corrections.push(`${word} → ${correction}`)
      }
      return correction
    }
    
    // Try to find close matches
    const closestMatch = findClosestMatch(cleanWord, GERMAN_CORRECTIONS)
    if (closestMatch && closestMatch !== cleanWord) {
      corrections.push(`${word} → ${closestMatch}`)
      return closestMatch
    }
    
    return word
  })
  
  const normalized = normalizedWords.join(' ')
  
  return {
    normalized,
    original,
    corrections
  }
}

// Enhanced normalization for search queries
export function normalizeSearchQuery(query: string): string {
  const result = normalizeText(query)
  
  // Additional preprocessing for search
  let processed = result.normalized
    .toLowerCase()
    .replace(/[^\wäöüß\s]/g, ' ') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
  
  return processed
}

// Detect if text contains procedural language
export function detectProceduralContent(text: string): boolean {
  const proceduralKeywords = [
    'schritt', 'step', 'vorgehen', 'durchführung', 'ablauf', 'verfahren',
    'anleitung', 'prozess', 'workflow', 'anweisung', 'richtlinie'
  ]
  
  const lowerText = text.toLowerCase()
  return proceduralKeywords.some(keyword => lowerText.includes(keyword))
}

// Extract step numbers and content
export function extractSteps(text: string): Array<{number: number, content: string, original: string}> {
  const steps: Array<{number: number, content: string, original: string}> = []
  
  // Match various step patterns
  const stepPatterns = [
    /(?:schritt|step)\s*(\d+)[:\.]?\s*(.+)/gi,
    /(\d+)\.\s*(.+)/g,
    /^[-•]\s*(.+)/gm,
    /^\*\s*(.+)/gm
  ]
  
  stepPatterns.forEach(pattern => {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const number = match[1] ? parseInt(match[1]) : steps.length + 1
      const content = match[2] || match[1]
      const original = match[0]
      
      if (content.trim()) {
        steps.push({
          number,
          content: content.trim(),
          original: original.trim()
        })
      }
    }
  })
  
  return steps
}
