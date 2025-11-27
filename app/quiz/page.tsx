'use client'

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Mascot } from '@/components/mascot'
import { addQuizResult, type QuizResult } from '@/lib/profile-manager'

type Question = {
  factor1: number
  factor2: number
  answer: number
  operation: 'multiply' | 'divide'
}

function generateRandomQuestion(tables: number[], operation: 'multiply' | 'divide'): Question {
  const table = tables[Math.floor(Math.random() * tables.length)]
  const factor = Math.floor(Math.random() * 10) + 1

  if (operation === 'multiply') {
    return {
      factor1: table,
      factor2: factor,
      answer: table * factor,
      operation: 'multiply'
    }
  } else {
    // For division: (table × factor) ÷ table = factor
    // Display as: dividend ÷ divisor = answer
    const dividend = table * factor
    return {
      factor1: dividend,
      factor2: table,
      answer: factor,
      operation: 'divide'
    }
  }
}

function generateQuestionSet(tables: number[], count: number, operation: 'multiply' | 'divide'): Question[] {
  // First, generate all possible facts for selected tables
  const allFacts: Question[] = []
  tables.forEach(table => {
    for (let i = 1; i <= 10; i++) {
      if (operation === 'multiply') {
        allFacts.push({
          factor1: table,
          factor2: i,
          answer: table * i,
          operation: 'multiply'
        })
      } else {
        // For division: (table × i) ÷ table = i
        const dividend = table * i
        allFacts.push({
          factor1: dividend,
          factor2: table,
          answer: i,
          operation: 'divide'
        })
      }
    }
  })

  // Shuffle all facts
  const shuffled = [...allFacts].sort(() => Math.random() - 0.5)

  // If we need more questions than available facts, repeat and shuffle again
  if (count <= shuffled.length) {
    return shuffled.slice(0, count)
  } else {
    const questions: Question[] = [...shuffled]
    while (questions.length < count) {
      const remaining = count - questions.length
      const additionalShuffled = [...allFacts].sort(() => Math.random() - 0.5)
      questions.push(...additionalShuffled.slice(0, remaining))
    }
    return questions
  }
}

// Confetti component
function Confetti() {
  const [confettiPieces] = useState(() => Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: ['#58cc02', '#1cb0f6', '#ffc800', '#ff4b4b', '#ce82ff'][Math.floor(Math.random() * 5)]
  })))

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {confettiPieces.map(piece => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 rounded-full animate-confetti"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`
          }}
        />
      ))}
    </div>
  )
}

// Sound effects using Web Audio API
function playSound(type: 'correct' | 'incorrect' | 'complete') {
  if (typeof window === 'undefined') return
  
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const audioContext = new AudioContextClass()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  if (type === 'correct') {
    // Happy ascending tone
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1) // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2) // G5
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  } else if (type === 'incorrect') {
    // Descending tone
    oscillator.frequency.setValueAtTime(392, audioContext.currentTime) // G4
    oscillator.frequency.setValueAtTime(349.23, audioContext.currentTime + 0.1) // F4
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2)
  } else if (type === 'complete') {
    // Victory fanfare
    const frequencies = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
    frequencies.forEach((freq, i) => {
      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()
      osc.connect(gain)
      gain.connect(audioContext.destination)
      osc.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.15)
      gain.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.15)
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.3)
      osc.start(audioContext.currentTime + i * 0.15)
      osc.stop(audioContext.currentTime + i * 0.15 + 0.3)
    })
  }
}

function QuizContent() {
  const searchParams = useSearchParams()
  const tablesParam = searchParams.get('tables')
  const modeParam = searchParams.get('mode') || 'practice'
  const operationParam = searchParams.get('operation') || 'multiply'
  const timeParam = searchParams.get('time')
  const countParam = searchParams.get('count')

  const tables = useMemo(() =>
    tablesParam ? tablesParam.split(',').map(Number) : [],
    [tablesParam]
  )
  const mode = modeParam as 'quiz' | 'practice' | 'timed'
  const operation = operationParam as 'multiply' | 'divide'
  const timePerQuestion = timeParam ? parseInt(timeParam) : 5
  const questionCount = countParam ? parseInt(countParam) : 10

  const [questions, setQuestions] = useState<Question[]>(() => {
    if (tables.length > 0) {
      return mode === 'practice' ? [generateRandomQuestion(tables, operation)] : generateQuestionSet(tables, questionCount, operation)
    }
    return []
  })
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [timeLeft, setTimeLeft] = useState(timePerQuestion)
  const [showConfetti, setShowConfetti] = useState(false)
  const [mascotEmotion, setMascotEmotion] = useState<'happy' | 'sad' | 'neutral' | 'excited' | 'thinking'>('neutral')
  const [animateMascot, setAnimateMascot] = useState(false)

  const handleNextQuestion = useCallback(() => {
    setUserAnswer('')
    setShowResult(false)
    setTimeLeft(timePerQuestion)
    setMascotEmotion('neutral')
    
    if (mode === 'practice') {
      setQuestions([generateRandomQuestion(tables, operation)])
      setCurrentQuestion(0)
    } else if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setGameOver(true)
      const finalScore = score + (isCorrect ? 1 : 0)
      const percentage = Math.round((finalScore / questions.length) * 100)
      
      // Save result to profile (only for quiz and timed modes)
      const result: QuizResult = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        mode: mode as 'quiz' | 'timed',
        operation,
        tables,
        score: finalScore,
        total: questions.length,
        percentage,
        date: new Date().toISOString(),
        ...(mode === 'timed' && { timePerQuestion })
      }
      addQuizResult(result)
      
      if (percentage >= 80) {
        setShowConfetti(true)
        playSound('complete')
        setMascotEmotion('excited')
        setTimeout(() => setShowConfetti(false), 3000)
      } else if (percentage >= 50) {
        setMascotEmotion('happy')
      } else {
        setMascotEmotion('sad')
      }
    }
  }, [mode, tables, operation, timePerQuestion, currentQuestion, questions.length, score, isCorrect])

  // Timer for timed mode
  useEffect(() => {
    if (mode !== 'timed' || timeLeft <= 0 || gameOver || showResult) return

    const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft, mode, gameOver, showResult])

  // Handle timeout
  const isTimedOut = mode === 'timed' && timeLeft === 0 && !showResult
  
  useEffect(() => {
    if (!isTimedOut) return

    const handleTimeout = () => {
      setIsCorrect(false)
      setShowResult(true)
      setMascotEmotion('sad')
      setAnimateMascot(true)
      playSound('incorrect')
      
      setTimeout(() => {
        handleNextQuestion()
        setAnimateMascot(false)
      }, 1500)
    }
    
    handleTimeout()
  }, [isTimedOut, handleNextQuestion])

  // Enter key handler
  useEffect(() => {
    if (!showResult || mode === 'timed') return
    
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleNextQuestion()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showResult, mode, handleNextQuestion])

  const checkAnswer = () => {
    if (userAnswer.trim() === '') return
    
    const correct = parseInt(userAnswer) === questions[currentQuestion].answer
    setIsCorrect(correct)
    if (correct) {
      setScore(score + 1)
      setMascotEmotion('excited')
      playSound('correct')
    } else {
      setMascotEmotion('sad')
      playSound('incorrect')
    }
    setAnimateMascot(true)
    setShowResult(true)
    
    if (mode === 'timed') {
      setTimeout(() => {
        handleNextQuestion()
        setAnimateMascot(false)
      }, 1500)
    } else {
      setTimeout(() => setAnimateMascot(false), 600)
    }
  }

  const restart = () => {
    const newQuestions = mode === 'practice' ? [generateRandomQuestion(tables, operation)] : generateQuestionSet(tables, questionCount, operation)
    setQuestions(newQuestions)
    setCurrentQuestion(0)
    setScore(0)
    setUserAnswer('')
    setShowResult(false)
    setGameOver(false)
    setTimeLeft(timePerQuestion)
    setMascotEmotion('neutral')
    setShowConfetti(false)
  }

  const goHome = () => {
    window.location.href = '/'
  }

  if (tables.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <Mascot emotion="sad" size="large" />
            <h2 className="text-2xl font-bold mt-4 mb-2">Geen tafels geselecteerd</h2>
            <p className="text-gray-600 mb-6">Kies eerst je tafels om te beginnen!</p>
            <button
              onClick={goHome}
              className="w-full py-3 px-6 rounded-xl font-bold text-white shadow-lg transition-all duration-200 bg-gradient-primary hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              Terug naar Home
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <p className="text-center">Laden...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (gameOver) {
    const percentage = Math.round((score / questions.length) * 100)
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 flex items-center justify-center p-4">
        {showConfetti && <Confetti />}
        <Card className="w-full max-w-md shadow-xl animate-slide-up">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <Mascot emotion={mascotEmotion} size="large" animate={true} />
              
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  {percentage >= 80 ? '🎉 Geweldig!' : percentage >= 50 ? '👍 Goed gedaan!' : '💪 Blijf oefenen!'}
                </h2>
                <p className="text-gray-600">
                  {percentage >= 80 ? 'Fantastisch resultaat!' : percentage >= 50 ? 'Je bent goed bezig!' : 'Volgende keer beter!'}
                </p>
              </div>

              <div className={`p-6 rounded-2xl ${percentage >= 80 ? 'bg-gradient-success' : percentage >= 50 ? 'bg-gradient-primary' : 'bg-gradient-warning'}`}>
                <p className="text-6xl font-bold text-white mb-2">{percentage}%</p>
                <p className="text-white text-lg">
                  {score} van de {questions.length} vragen goed
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={restart}
                  className="w-full py-3 px-6 rounded-xl font-bold text-white shadow-lg transition-all duration-200 bg-gradient-success hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                >
                  🔄 Opnieuw Proberen
                </button>
                <button
                  onClick={goHome}
                  className="w-full py-3 px-6 rounded-xl font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
                >
                  ← Terug naar Home
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQ = questions[currentQuestion]
  const totalQuestions = mode === 'quiz' ? questions.length : score + 1
  const progressPercentage = mode === 'quiz' ? ((currentQuestion + 1) / questions.length) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50">
      {/* Header with progress */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <Button 
              onClick={goHome} 
              variant="ghost" 
              size="sm"
              className="text-gray-600 hover:text-gray-800"
            >
              ✕ Stop
            </Button>
            <div className="text-center flex-1">
              <p className="font-bold text-lg">
                {mode === 'quiz' && `Vraag ${currentQuestion + 1}/${questions.length}`}
                {mode === 'practice' && 'Oefen Modus'}
                {mode === 'timed' && 'Tijd Modus'}
              </p>
            </div>
            <div className="text-right min-w-[80px]">
              <p className="text-sm text-gray-600">Score</p>
              <p className="font-bold text-green-600">{score}/{totalQuestions}</p>
            </div>
          </div>
          {mode === 'quiz' && (
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-success transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="shadow-xl border-2 animate-slide-up">
          <CardContent className="p-8">
            {/* Mascot */}
            <div className="flex justify-center mb-6">
              <Mascot emotion={mascotEmotion} size="large" animate={animateMascot} />
            </div>

            {/* Timer for timed mode */}
            {mode === 'timed' && !showResult && (
              <div className="text-center mb-6">
                <div className={`inline-block px-6 py-3 rounded-full font-bold text-2xl ${
                  timeLeft <= 2 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-yellow-100 text-yellow-600'
                }`}>
                  ⏱️ {timeLeft}s
                </div>
              </div>
            )}

            {/* Question */}
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-4 text-lg">Wat is het antwoord?</p>
              <p className="text-6xl md:text-7xl font-bold text-gray-800 mb-8">
                {currentQ.factor1} {currentQ.operation === 'multiply' ? '×' : '÷'} {currentQ.factor2}
              </p>

              {!showResult ? (
                <div className="max-w-xs mx-auto space-y-4">
                  <Input
                    type="number"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !showResult) {
                        checkAnswer()
                      }
                    }}
                    placeholder="?"
                    disabled={showResult}
                    className="text-center text-4xl h-20 border-4 border-gray-300 rounded-2xl focus:border-blue-500"
                    autoFocus
                  />
                  
                  <button
                    onClick={checkAnswer}
                    disabled={userAnswer.trim() === ''}
                    className={`w-full py-3 px-6 rounded-xl font-bold shadow-lg transition-all duration-200 ${
                      userAnswer.trim() === '' 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-gradient-success text-white hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
                    }`}
                  >
                    Controleer
                  </button>
                </div>
              ) : (
                <div className={`max-w-md mx-auto p-6 rounded-2xl ${
                  isCorrect ? 'bg-green-50 border-4 border-green-500 animate-celebrate' : 'bg-red-50 border-4 border-red-500 animate-shake'
                }`}>
                  <p className={`text-3xl font-bold mb-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {isCorrect ? '✓ Perfect!' : '✗ Oeps!'}
                  </p>
                  {!isCorrect && (
                    <p className="text-xl text-gray-700 mb-4">
                      Het juiste antwoord is <span className="font-bold text-2xl">{currentQ.answer}</span>
                    </p>
                  )}
                  {mode !== 'timed' && (
                    <button
                      onClick={handleNextQuestion}
                      className={`w-full py-3 px-6 rounded-xl font-bold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 ${
                        isCorrect ? 'bg-gradient-success' : 'bg-gradient-primary'
                      }`}
                    >
                      Volgende →
                    </button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function Quiz() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <p className="text-center">Laden...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <QuizContent />
    </Suspense>
  )
}
