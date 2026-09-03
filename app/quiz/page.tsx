'use client'

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
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

  // Back goes up to the world you came from, not all the way home.
  const worldHref = operation === 'multiply' ? '/tafels' : '/delen'
  const worldClass = operation === 'multiply' ? 'world-tafels' : 'world-delen'
  const goHome = () => {
    window.location.href = worldHref
  }

  if (tables.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-vault world-tafels p-4 text-vault-ink">
        <Card className="vault-card w-full max-w-md rounded-2xl">
          <CardContent className="p-8 text-center">
            <Mascot emotion="sad" size="large" />
            <h2 className="mt-4 mb-2 font-display text-2xl font-extrabold tracking-tight">
              Geen tafels geselecteerd
            </h2>
            <p className="mb-6 text-sm text-vault-dim">Kies eerst je tafels om te beginnen!</p>
            <button
              onClick={goHome}
              className="w-full rounded-xl bg-world px-6 py-3 font-display font-bold text-vault-night transition-transform hover:-translate-y-px"
            >
              Terug naar de tafels
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-vault p-4 text-vault-ink">
        <Card className="vault-card w-full max-w-md rounded-2xl">
          <CardContent className="py-8">
            <p className="text-center font-mono text-xs text-vault-dim">Laden…</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (gameOver) {
    const percentage = Math.round((score / questions.length) * 100)
    
    return (
      <div className={`flex min-h-screen items-center justify-center bg-vault ${worldClass} p-4 text-vault-ink`}>
        {showConfetti && <Confetti />}
        <div className="w-full max-w-sm animate-slide-up text-center">
          <Mascot emotion={mascotEmotion} size="large" animate={true} />

          <h2 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-balance">
            {percentage >= 80 ? 'Geweldig!' : percentage >= 50 ? 'Goed gedaan!' : 'Blijf oefenen!'}
          </h2>

          {/* The score is the point of this screen, so it gets the size. */}
          <p className="mt-5 font-display text-[3.25rem] font-extrabold leading-none tabular tracking-tight text-world">
            {score}
            <span className="text-vault-dim">/{questions.length}</span>
          </p>
          <p className="mt-2 font-mono text-xs text-vault-dim">{percentage}% goed</p>

          <div className="mt-8 space-y-2">
            <button
              onClick={restart}
              className="w-full rounded-2xl bg-world py-3.5 font-display text-base font-extrabold tracking-tight text-vault-night transition-transform hover:-translate-y-px"
            >
              Nog een ronde
            </button>
            <button
              onClick={goHome}
              className="w-full rounded-2xl border border-vault-line bg-vault-card py-3 font-display text-sm font-bold text-vault-dim transition-colors hover:border-world hover:text-vault-ink"
            >
              Terug naar {operation === 'multiply' ? 'de tafels' : 'delen'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentQ = questions[currentQuestion]
  const totalQuestions = mode === 'quiz' ? questions.length : score + 1
  const progressPercentage = mode === 'quiz' ? ((currentQuestion + 1) / questions.length) * 100 : 0

  return (
    <div className={`min-h-screen bg-vault ${worldClass} text-vault-ink`}>
      {/* Header with progress */}
      <div className="sticky top-0 z-10 border-b border-vault-line bg-vault-night/90 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <button
              onClick={goHome}
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-vault-dim transition-colors hover:text-vault-ink"
            >
              ✕ Stop
            </button>
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-vault-dim">
              {mode === 'quiz' && `Vraag ${currentQuestion + 1} / ${questions.length}`}
              {mode === 'practice' && 'Oefenmodus'}
              {mode === 'timed' && 'Tijdmodus'}
            </p>
            <p className="font-mono text-[11px] tabular text-world">
              {score}/{totalQuestions}
            </p>
          </div>
          {mode === 'quiz' && (
            <div className="h-[3px] w-full overflow-hidden rounded-sm bg-vault-line">
              <div
                className="h-full rounded-sm bg-world transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-sm px-4 py-6">
        <div className="animate-slide-up">
            {/* Mascot */}
            <div className="mb-5 flex justify-center">
              <Mascot emotion={mascotEmotion} size="large" animate={animateMascot} />
            </div>

            {/* Timer for timed mode */}
            {mode === 'timed' && !showResult && (
              <div className="mb-5 text-center">
                <div
                  className={`inline-block rounded-full border px-5 py-2 font-mono text-xl font-semibold tabular ${
                    timeLeft <= 2
                      ? 'animate-pulse border-fout bg-fout/15 text-fout'
                      : 'border-brass bg-brass/15 text-brass'
                  }`}
                >
                  {timeLeft}s
                </div>
              </div>
            )}

            {/* Question */}
            <div className="mb-6 text-center">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-vault-dim">
                Wat is het antwoord?
              </p>
              <p className="mb-7 font-display text-[3.5rem] font-extrabold leading-none tabular tracking-tight">
                {currentQ.factor1}{' '}
                <span className="text-world">
                  {currentQ.operation === 'multiply' ? '×' : '÷'}
                </span>{' '}
                {currentQ.factor2}
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
                    className="h-16 rounded-2xl border border-vault-line bg-vault-card text-center font-mono text-3xl font-semibold tabular text-vault-ink focus-visible:border-world focus-visible:ring-0"
                    autoFocus
                  />

                  <button
                    onClick={checkAnswer}
                    disabled={userAnswer.trim() === ''}
                    className={`w-full rounded-2xl py-3.5 font-display text-base font-extrabold tracking-tight transition-all ${
                      userAnswer.trim() === ''
                        ? 'cursor-not-allowed border border-vault-line bg-vault-card text-vault-dim'
                        : 'bg-world text-vault-night hover:-translate-y-px'
                    }`}
                  >
                    Nakijken
                  </button>
                </div>
              ) : (
                <div
                  className={`mx-auto max-w-md rounded-2xl border p-5 ${
                    isCorrect
                      ? 'animate-celebrate border-goed bg-goed/10'
                      : 'animate-shake border-fout bg-fout/10'
                  }`}
                >
                  <p
                    className={`font-display text-2xl font-extrabold tracking-tight ${
                      isCorrect ? 'text-goed' : 'text-fout'
                    }`}
                  >
                    {isCorrect ? 'Goed zo!' : 'Bijna.'}
                  </p>
                  {!isCorrect && (
                    <p className="mt-2 mb-4 text-sm text-vault-dim">
                      Het juiste antwoord is{' '}
                      <span className="font-mono text-xl font-semibold tabular text-vault-ink">
                        {currentQ.answer}
                      </span>
                    </p>
                  )}
                  {mode !== 'timed' && (
                    <button
                      onClick={handleNextQuestion}
                      className="mt-4 w-full rounded-xl bg-world py-3 font-display font-bold text-vault-night transition-transform hover:-translate-y-px"
                    >
                      Volgende
                    </button>
                  )}
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  )
}

export default function Quiz() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-vault p-4 text-vault-ink">
        <Card className="vault-card w-full max-w-md rounded-2xl">
          <CardContent className="py-8">
            <p className="text-center font-mono text-xs text-vault-dim">Laden…</p>
          </CardContent>
        </Card>
      </div>
    }>
      <QuizContent />
    </Suspense>
  )
}
