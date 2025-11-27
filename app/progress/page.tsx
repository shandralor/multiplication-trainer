'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mascot } from '@/components/mascot'
import { ProfileSelector } from '@/components/profile-selector'
import {
  getCurrentProfile,
  initializeProfiles,
  getLeaderboard,
  exportProfile,
  importProfile,
  type UserProfile,

} from '@/lib/profile-manager'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export default function ProgressPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [exportCode, setExportCode] = useState('')
  const [importCode, setImportCode] = useState('')
  const [leaderboardMode, setLeaderboardMode] = useState<'quiz' | 'timed'>('quiz')
  const [leaderboardOperation, setLeaderboardOperation] = useState<'multiply' | 'divide'>('multiply')

  const loadProfile = useCallback(() => {
    const currentProfile = getCurrentProfile()
    setProfile(currentProfile)
  }, [])

  useEffect(() => {
    initializeProfiles()
    loadProfile()
  }, [loadProfile])

  const handleExport = () => {
    if (!profile) return
    const code = exportProfile(profile.id)
    setExportCode(code)
    setShowExportDialog(true)
  }

  const handleImport = () => {
    if (!importCode.trim()) return
    const success = importProfile(importCode)
    if (success) {
      alert('Profiel succesvol geïmporteerd!')
      setShowImportDialog(false)
      setImportCode('')
      loadProfile()
    } else {
      alert('Ongeldige code. Probeer het opnieuw.')
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportCode)
    alert('Code gekopieerd naar klembord!')
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 flex items-center justify-center">
        <p>Laden...</p>
      </div>
    )
  }

  const leaderboard = getLeaderboard(leaderboardMode, leaderboardOperation, 10)
  const totalAccuracy = profile.totalQuestions > 0
    ? Math.round((profile.totalCorrect / profile.totalQuestions) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  ← Terug
                </Button>
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Mijn Voortgang
              </h1>
            </div>
            <ProfileSelector onProfileChange={loadProfile} />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-2 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-3">
                <Mascot emotion="excited" size="medium" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Huidige Streak</p>
              <p className="text-4xl font-bold text-orange-600">🔥 {profile.currentStreak}</p>
              <p className="text-xs text-gray-500 mt-1">dagen achter elkaar</p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Totaal Quizzen</p>
              <p className="text-4xl font-bold text-green-600">{profile.totalQuizzes}</p>
              <p className="text-xs text-gray-500 mt-1">{profile.totalQuestions} vragen beantwoord</p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Nauwkeurigheid</p>
              <p className="text-4xl font-bold text-blue-600">{totalAccuracy}%</p>
              <p className="text-xs text-gray-500 mt-1">{profile.totalCorrect} goed van {profile.totalQuestions}</p>
            </CardContent>
          </Card>
        </div>

        {/* Best Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">🏆 Beste Quiz Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Multiplication */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1">
                    <span className="text-lg">×</span> Vermenigvuldigen
                  </p>
                  {profile.bestScores.quiz.multiply ? (
                    <div className="space-y-1 pl-6">
                      <div className="text-2xl font-bold text-green-600">
                        {profile.bestScores.quiz.multiply.percentage}%
                      </div>
                      <p className="text-xs text-gray-600">
                        {profile.bestScores.quiz.multiply.score}/{profile.bestScores.quiz.multiply.total} vragen · Tafels: {profile.bestScores.quiz.multiply.tables.join(', ')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(profile.bestScores.quiz.multiply.date).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 pl-6">Nog niet geoefend</p>
                  )}
                </div>
                {/* Division */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1">
                    <span className="text-lg">÷</span> Delen
                  </p>
                  {profile.bestScores.quiz.divide ? (
                    <div className="space-y-1 pl-6">
                      <div className="text-2xl font-bold text-green-600">
                        {profile.bestScores.quiz.divide.percentage}%
                      </div>
                      <p className="text-xs text-gray-600">
                        {profile.bestScores.quiz.divide.score}/{profile.bestScores.quiz.divide.total} vragen · Tafels: {profile.bestScores.quiz.divide.tables.join(', ')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(profile.bestScores.quiz.divide.date).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 pl-6">Nog niet geoefend</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">⏱️ Beste Tijd Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Multiplication */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1">
                    <span className="text-lg">×</span> Vermenigvuldigen
                  </p>
                  {profile.bestScores.timed.multiply ? (
                    <div className="space-y-1 pl-6">
                      <div className="text-2xl font-bold text-yellow-600">
                        {profile.bestScores.timed.multiply.percentage}%
                      </div>
                      <p className="text-xs text-gray-600">
                        {profile.bestScores.timed.multiply.score}/{profile.bestScores.timed.multiply.total} vragen · {profile.bestScores.timed.multiply.timePerQuestion}s
                      </p>
                      <p className="text-xs text-gray-500">
                        Tafels: {profile.bestScores.timed.multiply.tables.join(', ')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(profile.bestScores.timed.multiply.date).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 pl-6">Nog niet geoefend</p>
                  )}
                </div>
                {/* Division */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-1">
                    <span className="text-lg">÷</span> Delen
                  </p>
                  {profile.bestScores.timed.divide ? (
                    <div className="space-y-1 pl-6">
                      <div className="text-2xl font-bold text-yellow-600">
                        {profile.bestScores.timed.divide.percentage}%
                      </div>
                      <p className="text-xs text-gray-600">
                        {profile.bestScores.timed.divide.score}/{profile.bestScores.timed.divide.total} vragen · {profile.bestScores.timed.divide.timePerQuestion}s
                      </p>
                      <p className="text-xs text-gray-500">
                        Tafels: {profile.bestScores.timed.divide.tables.join(', ')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(profile.bestScores.timed.divide.date).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 pl-6">Nog niet geoefend</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table Mastery */}
        <Card className="border-2 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-lg">📚 Tafel Beheersing</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Multiplication */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-1">
                <span className="text-lg">×</span> Vermenigvuldigen
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(table => {
                  const stats = profile.tableStats[table]?.multiply
                  const accuracy = stats && stats.attempts > 0
                    ? Math.round((stats.correct / stats.attempts) * 100)
                    : 0
                  const hasData = stats && stats.attempts > 0

                  return (
                    <div
                      key={`multiply-${table}`}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        hasData
                          ? accuracy >= 80
                            ? 'bg-green-50 border-green-500 dark:bg-green-900/20'
                            : accuracy >= 60
                            ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20'
                            : 'bg-red-50 border-red-500 dark:bg-red-900/20'
                          : 'bg-gray-50 border-gray-300 dark:bg-gray-800'
                      }`}
                    >
                      <div className="text-2xl font-bold mb-1">{table}</div>
                      {hasData ? (
                        <>
                          <div className="text-sm font-semibold">{accuracy}%</div>
                          <div className="text-xs text-gray-500">
                            {stats.attempts} vragen
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-400">Nog niet geoefend</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Division */}
            <div>
              <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-1">
                <span className="text-lg">÷</span> Delen
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(table => {
                  const stats = profile.tableStats[table]?.divide
                  const accuracy = stats && stats.attempts > 0
                    ? Math.round((stats.correct / stats.attempts) * 100)
                    : 0
                  const hasData = stats && stats.attempts > 0

                  return (
                    <div
                      key={`divide-${table}`}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        hasData
                          ? accuracy >= 80
                            ? 'bg-green-50 border-green-500 dark:bg-green-900/20'
                            : accuracy >= 60
                            ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20'
                            : 'bg-red-50 border-red-500 dark:bg-red-900/20'
                          : 'bg-gray-50 border-gray-300 dark:bg-gray-800'
                      }`}
                    >
                      <div className="text-2xl font-bold mb-1">{table}</div>
                      {hasData ? (
                        <>
                          <div className="text-sm font-semibold">{accuracy}%</div>
                          <div className="text-xs text-gray-500">
                            {stats.attempts} vragen
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-400">Nog niet geoefend</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card className="border-2 shadow-lg mb-6">
          <CardHeader>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">🏅 Klassement (Dit Apparaat)</CardTitle>
              </div>
              <div className="flex gap-2 flex-wrap">
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <Button
                    size="sm"
                    variant={leaderboardMode === 'quiz' ? 'default' : 'ghost'}
                    onClick={() => setLeaderboardMode('quiz')}
                    className="text-xs"
                  >
                    Quiz
                  </Button>
                  <Button
                    size="sm"
                    variant={leaderboardMode === 'timed' ? 'default' : 'ghost'}
                    onClick={() => setLeaderboardMode('timed')}
                    className="text-xs"
                  >
                    Tijd
                  </Button>
                </div>
                <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <Button
                    size="sm"
                    variant={leaderboardOperation === 'multiply' ? 'default' : 'ghost'}
                    onClick={() => setLeaderboardOperation('multiply')}
                    className="text-xs"
                  >
                    × Vermenigvuldigen
                  </Button>
                  <Button
                    size="sm"
                    variant={leaderboardOperation === 'divide' ? 'default' : 'ghost'}
                    onClick={() => setLeaderboardOperation('divide')}
                    className="text-xs"
                  >
                    ÷ Delen
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.profile.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      entry.profile.id === profile.id
                        ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                        : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold w-8">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                      <div>
                        <div className="font-semibold">{entry.profile.name}</div>
                        <div className="text-xs text-gray-500">
                          Tafels: {entry.result.tables.join(', ')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">
                        {entry.result.percentage}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {entry.result.score}/{entry.result.total}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">
                Nog geen scores beschikbaar
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Results */}
        <Card className="border-2 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="text-lg">📅 Recente Resultaten</CardTitle>
          </CardHeader>
          <CardContent>
            {profile.recentResults.length > 0 ? (
              <div className="space-y-2">
                {profile.recentResults.slice(0, 10).map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {result.mode === 'quiz' ? '📝' : result.mode === 'timed' ? '⏱️' : '♾️'}
                      </span>
                      <div>
                        <div className="text-sm font-medium flex items-center gap-2">
                          <span>{result.mode === 'quiz' ? 'Quiz' : result.mode === 'timed' ? 'Tijd' : 'Oefen'} Modus</span>
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                            {result.operation === 'multiply' ? '×' : '÷'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Tafels: {result.tables.join(', ')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        result.percentage >= 80 ? 'text-green-600' : result.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {result.percentage}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(result.date).toLocaleDateString('nl-NL')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">
                Nog geen resultaten
              </p>
            )}
          </CardContent>
        </Card>

        {/* Export/Import */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">💾 Backup & Delen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button onClick={handleExport} variant="outline" className="flex-1">
                📤 Exporteer Profiel
              </Button>
              <Button onClick={() => setShowImportDialog(true)} variant="outline" className="flex-1">
                📥 Importeer Profiel
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Gebruik deze functies om je voortgang naar een ander apparaat over te zetten
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profiel Exporteren</DialogTitle>
            <DialogDescription>
              Kopieer deze code om je profiel op een ander apparaat te importeren
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg break-all font-mono text-sm">
              {exportCode}
            </div>
            <Button onClick={copyToClipboard} className="w-full">
              📋 Kopieer Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profiel Importeren</DialogTitle>
            <DialogDescription>
              Plak de exportcode om een profiel te importeren
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              placeholder="Plak de code hier..."
              className="font-mono"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowImportDialog(false)} className="flex-1">
                Annuleren
              </Button>
              <Button onClick={handleImport} disabled={!importCode.trim()} className="flex-1">
                Importeren
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
