'use client'

import { useEffect, useState } from 'react'

type MascotProps = {
  emotion?: 'happy' | 'sad' | 'neutral' | 'excited' | 'thinking'
  size?: 'small' | 'medium' | 'large'
  animate?: boolean
}

export function Mascot({ emotion = 'neutral', size = 'medium', animate = false }: MascotProps) {
  const [bounce, setBounce] = useState(false)

  useEffect(() => {
    if (!animate) return
    
    const startBounce = () => {
      setBounce(true)
      const timer = setTimeout(() => setBounce(false), 600)
      return timer
    }
    
    const timer = startBounce()
    return () => clearTimeout(timer)
  }, [animate, emotion])

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  }

  const getEyeExpression = () => {
    switch (emotion) {
      case 'happy':
      case 'excited':
        return (
          <>
            {/* Happy eyes - curved */}
            <path d="M 25 35 Q 30 30 35 35" stroke="#2d3748" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 65 35 Q 70 30 75 35" stroke="#2d3748" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        )
      case 'sad':
        return (
          <>
            {/* Sad eyes */}
            <circle cx="30" cy="35" r="3" fill="#2d3748" />
            <circle cx="70" cy="35" r="3" fill="#2d3748" />
            <path d="M 25 32 L 28 30" stroke="#2d3748" strokeWidth="2" strokeLinecap="round" />
            <path d="M 65 32 L 68 30" stroke="#2d3748" strokeWidth="2" strokeLinecap="round" />
          </>
        )
      case 'thinking':
        return (
          <>
            {/* Thinking eyes - looking up */}
            <circle cx="30" cy="32" r="3" fill="#2d3748" />
            <circle cx="70" cy="32" r="3" fill="#2d3748" />
          </>
        )
      default:
        return (
          <>
            {/* Normal eyes */}
            <circle cx="30" cy="35" r="4" fill="#2d3748" />
            <circle cx="70" cy="35" r="4" fill="#2d3748" />
          </>
        )
    }
  }

  const getMouthExpression = () => {
    switch (emotion) {
      case 'happy':
        return <path d="M 35 55 Q 50 65 65 55" stroke="#2d3748" strokeWidth="3" fill="none" strokeLinecap="round" />
      case 'excited':
        return (
          <>
            <path d="M 35 55 Q 50 70 65 55" stroke="#2d3748" strokeWidth="3" fill="none" strokeLinecap="round" />
            <circle cx="50" cy="60" r="15" fill="#ff6b6b" opacity="0.3" />
          </>
        )
      case 'sad':
        return <path d="M 35 65 Q 50 55 65 65" stroke="#2d3748" strokeWidth="3" fill="none" strokeLinecap="round" />
      case 'thinking':
        return <line x1="40" y1="60" x2="60" y2="60" stroke="#2d3748" strokeWidth="2" strokeLinecap="round" />
      default:
        return <path d="M 40 60 Q 50 62 60 60" stroke="#2d3748" strokeWidth="2" fill="none" strokeLinecap="round" />
    }
  }

  return (
    <div className={`${sizeClasses[size]} ${bounce ? 'animate-bounce' : ''}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Main body - cute blob shape */}
        <ellipse cx="50" cy="55" rx="35" ry="40" fill="#58cc02" />
        
        {/* Face area */}
        <ellipse cx="50" cy="45" rx="30" ry="25" fill="#7ed321" />
        
        {/* Cheeks */}
        {(emotion === 'happy' || emotion === 'excited') && (
          <>
            <circle cx="20" cy="50" r="6" fill="#ff6b6b" opacity="0.3" />
            <circle cx="80" cy="50" r="6" fill="#ff6b6b" opacity="0.3" />
          </>
        )}
        
        {/* Eyes */}
        {getEyeExpression()}
        
        {/* Mouth */}
        {getMouthExpression()}
        
        {/* Small arms */}
        <ellipse cx="15" cy="60" rx="8" ry="15" fill="#58cc02" transform="rotate(-20 15 60)" />
        <ellipse cx="85" cy="60" rx="8" ry="15" fill="#58cc02" transform="rotate(20 85 60)" />
        
        {/* Excited sparkles */}
        {emotion === 'excited' && (
          <>
            <text x="10" y="20" fontSize="12" fill="#ffd700">✨</text>
            <text x="80" y="25" fontSize="12" fill="#ffd700">✨</text>
            <text x="45" y="10" fontSize="12" fill="#ffd700">⭐</text>
          </>
        )}
        
        {/* Thinking bubble */}
        {emotion === 'thinking' && (
          <>
            <circle cx="75" cy="15" r="2" fill="#cbd5e0" />
            <circle cx="82" cy="10" r="3" fill="#cbd5e0" />
            <circle cx="90" cy="8" r="5" fill="#e2e8f0" stroke="#cbd5e0" strokeWidth="1" />
          </>
        )}
      </svg>
    </div>
  )
}
