'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mascot } from '@/components/mascot'
import { ProfileSelector } from '@/components/profile-selector'
import { initializeProfiles, getCurrentProfile } from '@/lib/profile-manager'
import Link from 'next/link'

export default function Home() {
  const [selectedOperation, setSelectedOperation] = useState<'multiply' | 'divide'>('multiply')
  const [selectedTables, setSelectedTables] = useState<number[]>([])
  const [timePerQuestion, setTimePerQuestion] = useState(5)
  const [questionCount, setQuestionCount] = useState(10)
  const [streak, setStreak] = useState(0)
  const [totalQuizzes, setTotalQuizzes] = useState(0)
  const [mascotEmotion, setMascotEmotion] = useState<'happy' | 'sad' | 'neutral' | 'excited' | 'thinking'>('neutral')
  const [animate, setAnimate] = useState(false)

  const loadProfileData = useCallback(() => {
    const profile = getCurrentProfile()
    if (profile) {
      setStreak(profile.currentStreak)
      setTotalQuizzes(profile.totalQuizzes)
    }
  }, [])

  useEffect(() => {
    // Initialize profiles on mount
    initializeProfiles()
    loadProfileData()
  }, [loadProfileData])

  const toggleTable = (table: number) => {
    setSelectedTables(prev => {
      const newSelection = prev.includes(table)
        ? prev.filter(t => t !== table)
        : [...prev, table]
      
      // Animate mascot when selecting
      if (!prev.includes(table)) {
        setMascotEmotion('happy')
        setAnimate(true)
        setTimeout(() => {
          setMascotEmotion('neutral')
          setAnimate(false)
        }, 600)
      }
      
      return newSelection
    })
  }

  const selectAll = () => {
    setSelectedTables([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    setMascotEmotion('excited')
    setAnimate(true)
    setTimeout(() => {
      setMascotEmotion('neutral')
      setAnimate(false)
    }, 600)
  }

  const clearAll = () => {
    setSelectedTables([])
    setMascotEmotion('thinking')
    setAnimate(true)
    setTimeout(() => {
      setMascotEmotion('neutral')
      setAnimate(false)
    }, 600)
  }

  const startQuiz = (mode: 'quiz' | 'practice' | 'timed') => {
    if (selectedTables.length === 0) return
    const params = new URLSearchParams({
      tables: selectedTables.join(','),
      mode,
      operation: selectedOperation,
      count: questionCount.toString(),
      ...(mode === 'timed' && { time: timePerQuestion.toString() })
    })
    window.location.href = `/quiz?${params.toString()}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header with stats */}
      <div className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Tafel Trainer
            </h1>
            <div className="flex items-center gap-3">
              <Link href="/progress">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  📊 Mijn Voortgang
                </Button>
              </Link>
              <ProfileSelector onProfileChange={loadProfileData} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900 px-3 py-1 rounded-full">
              <span className="text-xl">🔥</span>
              <span className="font-bold text-orange-600 dark:text-orange-300 text-sm">{streak} dagen</span>
            </div>
            <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full">
              <span className="text-xl">✅</span>
              <span className="font-bold text-green-600 dark:text-green-300 text-sm">{totalQuizzes} quizzen</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Mascot and welcome message */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="flex justify-center mb-4">
            <Mascot emotion={mascotEmotion} size="large" animate={animate} />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Welkom terug!
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Kies je tafels en begin met oefenen
          </p>
        </div>

        {/* Operation selector */}
        <Card className="mb-6 border-2 shadow-xl animate-slide-up">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Kies je oefening
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedOperation('multiply')}
                className={`
                  py-4 rounded-xl font-bold text-lg transition-all duration-200
                  ${selectedOperation === 'multiply'
                    ? 'bg-gradient-success text-white shadow-lg scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">×</span>
                  <span>Vermenigvuldigen</span>
                </div>
              </button>
              <button
                onClick={() => setSelectedOperation('divide')}
                className={`
                  py-4 rounded-xl font-bold text-lg transition-all duration-200
                  ${selectedOperation === 'divide'
                    ? 'bg-gradient-success text-white shadow-lg scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">÷</span>
                  <span>Delen</span>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-2 shadow-xl animate-slide-up">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                Kies je tafels
              </h3>
              <div className="flex gap-2">
                <Button 
                  onClick={selectAll} 
                  variant="outline" 
                  size="sm"
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  Alles
                </Button>
                <Button 
                  onClick={clearAll} 
                  variant="outline" 
                  size="sm"
                  className="text-gray-600 border-gray-400 hover:bg-gray-50"
                >
                  Wissen
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-3 mb-4">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(table => (
                <button
                  key={table}
                  onClick={() => toggleTable(table)}
                  className={`
                    aspect-square rounded-2xl font-bold text-2xl transition-all duration-200
                    ${selectedTables.includes(table)
                      ? 'bg-gradient-success text-white shadow-lg scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {table}
                </button>
              ))}
            </div>

            {selectedTables.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg animate-slide-up">
                <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
                  ✨ Geselecteerd: <span className="font-bold">{selectedTables.sort((a, b) => a - b).join(', ')}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Question count and time selector - combined in one card */}
        <Card className="mb-4 border-2 shadow-xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:divide-x dark:divide-gray-700">
              {/* Question count */}
              <div className="md:pr-4">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Aantal vragen
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 20, 30, 50].map(count => (
                    <button
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      className={`
                        py-2 rounded-lg font-bold text-sm transition-all duration-200
                        ${questionCount === count
                          ? 'bg-gradient-primary text-white shadow-md scale-105'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }
                      `}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time per question */}
              <div className="md:pl-4 pt-4 md:pt-0 border-t md:border-t-0 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Tijd per vraag
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[3, 4, 5].map(seconds => (
                    <button
                      key={seconds}
                      onClick={() => setTimePerQuestion(seconds)}
                      className={`
                        py-2 rounded-lg font-bold text-sm transition-all duration-200
                        ${timePerQuestion === seconds
                          ? 'bg-gradient-warning text-gray-800 shadow-md scale-105'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }
                      `}
                    >
                      {seconds}s
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mode selection buttons - more compact */}
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <button
            onClick={() => startQuiz('quiz')}
            disabled={selectedTables.length === 0}
            className={`
              w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-200
              ${selectedTables.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-success text-white hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
              }
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">📝</span>
              <div className="text-left">
                <div>Quiz Modus</div>
                <div className="text-xs opacity-90">{questionCount} vragen, test jezelf!</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => startQuiz('practice')}
            disabled={selectedTables.length === 0}
            className={`
              w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-200
              ${selectedTables.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-primary text-white hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
              }
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">♾️</span>
              <div className="text-left">
                <div>Oefen Modus</div>
                <div className="text-xs opacity-90">Onbeperkt oefenen</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => startQuiz('timed')}
            disabled={selectedTables.length === 0}
            className={`
              w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-200
              ${selectedTables.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-warning text-gray-800 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
              }
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">⏱️</span>
              <div className="text-left">
                <div>Tijd Modus</div>
                <div className="text-xs opacity-90">{questionCount} vragen · {timePerQuestion}s per vraag</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
