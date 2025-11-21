// Profile and progress tracking system

export type QuizResult = {
  id: string
  mode: 'quiz' | 'practice' | 'timed'
  tables: number[]
  score: number
  total: number
  percentage: number
  date: string
  timePerQuestion?: number
}

export type TableStats = {
  [table: number]: {
    attempts: number
    correct: number
    bestScore: number
  }
}

export type UserProfile = {
  id: string
  name: string
  createdAt: string
  lastActive: string
  totalQuizzes: number
  totalQuestions: number
  totalCorrect: number
  currentStreak: number
  lastPracticeDate: string
  bestScores: {
    quiz: QuizResult | null
    timed: QuizResult | null
  }
  tableStats: TableStats
  recentResults: QuizResult[]
}

const STORAGE_KEY = 'tafel-trainer-profiles'
const CURRENT_PROFILE_KEY = 'tafel-trainer-current-profile'

// Get all profiles
export function getAllProfiles(): UserProfile[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

// Save all profiles
function saveAllProfiles(profiles: UserProfile[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
}

// Get current profile ID
export function getCurrentProfileId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(CURRENT_PROFILE_KEY)
}

// Set current profile
export function setCurrentProfileId(id: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CURRENT_PROFILE_KEY, id)
}

// Get current profile
export function getCurrentProfile(): UserProfile | null {
  const profiles = getAllProfiles()
  const currentId = getCurrentProfileId()
  if (!currentId) return null
  return profiles.find(p => p.id === currentId) || null
}

// Create new profile
export function createProfile(name: string): UserProfile {
  const profile: UserProfile = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    totalQuizzes: 0,
    totalQuestions: 0,
    totalCorrect: 0,
    currentStreak: 0,
    lastPracticeDate: '',
    bestScores: {
      quiz: null,
      timed: null
    },
    tableStats: {},
    recentResults: []
  }

  const profiles = getAllProfiles()
  profiles.push(profile)
  saveAllProfiles(profiles)
  setCurrentProfileId(profile.id)
  
  return profile
}

// Update profile
export function updateProfile(profileId: string, updates: Partial<UserProfile>) {
  const profiles = getAllProfiles()
  const index = profiles.findIndex(p => p.id === profileId)
  if (index === -1) return

  profiles[index] = {
    ...profiles[index],
    ...updates,
    lastActive: new Date().toISOString()
  }
  
  saveAllProfiles(profiles)
}

// Delete profile
export function deleteProfile(profileId: string) {
  const profiles = getAllProfiles()
  const filtered = profiles.filter(p => p.id !== profileId)
  saveAllProfiles(filtered)
  
  // If deleted profile was current, switch to first available or null
  if (getCurrentProfileId() === profileId) {
    if (filtered.length > 0) {
      setCurrentProfileId(filtered[0].id)
    } else {
      localStorage.removeItem(CURRENT_PROFILE_KEY)
    }
  }
}

// Calculate streak
function calculateStreak(lastPracticeDate: string): number {
  if (!lastPracticeDate) return 0
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const lastDate = new Date(lastPracticeDate)
  lastDate.setHours(0, 0, 0, 0)
  
  const diffTime = today.getTime() - lastDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  // If last practice was today or yesterday, streak continues
  if (diffDays <= 1) {
    return 1 // Will be incremented by addQuizResult if it's a new day
  }
  
  // Streak broken
  return 0
}

// Add quiz result to profile
export function addQuizResult(result: QuizResult) {
  const profile = getCurrentProfile()
  if (!profile) return

  const today = new Date().toISOString().split('T')[0]
  const lastPractice = profile.lastPracticeDate.split('T')[0]
  
  // Update streak
  let newStreak = profile.currentStreak
  if (lastPractice !== today) {
    // New day
    const streak = calculateStreak(profile.lastPracticeDate)
    newStreak = streak > 0 ? profile.currentStreak + 1 : 1
  }

  // Update table stats
  const tableStats = { ...profile.tableStats }
  result.tables.forEach(table => {
    if (!tableStats[table]) {
      tableStats[table] = { attempts: 0, correct: 0, bestScore: 0 }
    }
    tableStats[table].attempts += result.total
    tableStats[table].correct += result.score
    const currentPercentage = (tableStats[table].correct / tableStats[table].attempts) * 100
    tableStats[table].bestScore = Math.max(tableStats[table].bestScore, currentPercentage)
  })

  // Update best scores
  const bestScores = { ...profile.bestScores }
  if (result.mode === 'quiz') {
    if (!bestScores.quiz || result.percentage > bestScores.quiz.percentage) {
      bestScores.quiz = result
    }
  } else if (result.mode === 'timed') {
    if (!bestScores.timed || result.percentage > bestScores.timed.percentage) {
      bestScores.timed = result
    }
  }

  // Add to recent results (keep last 20)
  const recentResults = [result, ...profile.recentResults].slice(0, 20)

  updateProfile(profile.id, {
    totalQuizzes: profile.totalQuizzes + 1,
    totalQuestions: profile.totalQuestions + result.total,
    totalCorrect: profile.totalCorrect + result.score,
    currentStreak: newStreak,
    lastPracticeDate: new Date().toISOString(),
    bestScores,
    tableStats,
    recentResults
  })
}

// Get leaderboard (top scores from all profiles)
export function getLeaderboard(mode: 'quiz' | 'timed', limit: number = 10): Array<{
  profile: UserProfile
  result: QuizResult
}> {
  const profiles = getAllProfiles()
  const entries: Array<{ profile: UserProfile; result: QuizResult }> = []

  profiles.forEach(profile => {
    const bestScore = profile.bestScores[mode]
    if (bestScore) {
      entries.push({ profile, result: bestScore })
    }
  })

  // Sort by percentage (descending), then by date (most recent first)
  entries.sort((a, b) => {
    if (b.result.percentage !== a.result.percentage) {
      return b.result.percentage - a.result.percentage
    }
    return new Date(b.result.date).getTime() - new Date(a.result.date).getTime()
  })

  return entries.slice(0, limit)
}

// Export profile data
export function exportProfile(profileId: string): string {
  const profiles = getAllProfiles()
  const profile = profiles.find(p => p.id === profileId)
  if (!profile) return ''
  
  const data = JSON.stringify(profile)
  return btoa(data) // Base64 encode
}

// Import profile data
export function importProfile(encodedData: string): boolean {
  try {
    const data = atob(encodedData) // Base64 decode
    const profile: UserProfile = JSON.parse(data)
    
    // Validate profile structure
    if (!profile.id || !profile.name) return false
    
    // Generate new ID to avoid conflicts
    profile.id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    
    const profiles = getAllProfiles()
    profiles.push(profile)
    saveAllProfiles(profiles)
    setCurrentProfileId(profile.id)
    
    return true
  } catch {
    return false
  }
}

// Initialize - ensure there's always a default profile
export function initializeProfiles(): UserProfile {
  const profiles = getAllProfiles()
  let currentProfile = getCurrentProfile()
  
  if (profiles.length === 0 || !currentProfile) {
    // Create default profile
    currentProfile = createProfile('Speler 1')
  }
  
  return currentProfile
}
