'use client'

import { useEffect, useState } from 'react'

type Emotion = 'happy' | 'sad' | 'neutral' | 'excited' | 'thinking'

type MascotProps = {
  emotion?: Emotion
  size?: 'small' | 'medium' | 'large'
  animate?: boolean
}

export function Mascot({ emotion = 'neutral', size = 'medium', animate = false }: MascotProps) {
  const [bounce, setBounce] = useState(false)

  useEffect(() => {
    if (!animate) return
    setBounce(true)
    const timer = setTimeout(() => setBounce(false), 600)
    return () => clearTimeout(timer)
  }, [animate, emotion])

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32',
  }

  return (
    <div className={`${sizeClasses[size]} ${bounce ? 'animate-bounce' : ''}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Tail — striped, curving to the left behind the body */}
        <path
          d="M 12 72 Q -4 55 8 32 Q 22 22 28 40"
          fill="#4b5563"
          stroke="#1f2937"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path
          d="M 10 64 Q 4 55 12 46"
          stroke="#18181b"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 6 52 Q 1 45 10 38"
          stroke="#18181b"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Body + belly */}
        <ellipse cx="50" cy="72" rx="28" ry="22" fill="#4b5563" />
        <ellipse cx="50" cy="76" rx="16" ry="13" fill="#d4d4d8" />

        {/* Left arm (always at rest) */}
        <ellipse cx="23" cy="70" rx="5" ry="9" fill="#4b5563" />

        {/* Feet */}
        <ellipse cx="40" cy="92" rx="7" ry="4" fill="#4b5563" />
        <ellipse cx="60" cy="92" rx="7" ry="4" fill="#4b5563" />

        {/* Right arm — raised to chin while thinking, otherwise at rest */}
        {emotion === 'thinking' ? (
          <>
            <ellipse
              cx="74"
              cy="60"
              rx="5"
              ry="10"
              fill="#4b5563"
              transform="rotate(-35 74 60)"
            />
            <circle cx="67" cy="54" r="4.5" fill="#4b5563" />
            <circle cx="67" cy="53" r="1" fill="#d4d4d8" />
          </>
        ) : (
          <ellipse cx="77" cy="70" rx="5" ry="9" fill="#4b5563" />
        )}

        {/* Head + fluffy cheeks */}
        <circle cx="50" cy="40" r="26" fill="#6b7280" />
        <circle cx="28" cy="46" r="7" fill="#6b7280" />
        <circle cx="72" cy="46" r="7" fill="#6b7280" />

        {/* Ears with pink inner */}
        <polygon points="28,24 32,9 40,22" fill="#4b5563" />
        <polygon points="60,22 68,9 72,24" fill="#4b5563" />
        <polygon points="31,22 33,14 37,20" fill="#fca5a5" />
        <polygon points="63,20 67,14 69,22" fill="#fca5a5" />

        {/* Signature black eye mask */}
        <path
          d="M 24 36 Q 30 28 50 30 Q 70 28 76 36 Q 75 46 50 46 Q 25 46 24 36 Z"
          fill="#18181b"
        />

        {/* Muzzle (light patch) + nose */}
        <ellipse cx="50" cy="55" rx="14" ry="9" fill="#e5e7eb" />
        <ellipse cx="50" cy="49" rx="3" ry="2.3" fill="#18181b" />

        {/* Rosy cheeks when happy */}
        {emotion === 'happy' && (
          <>
            <ellipse cx="28" cy="52" rx="4" ry="2.5" fill="#fda4af" opacity="0.6" />
            <ellipse cx="72" cy="52" rx="4" ry="2.5" fill="#fda4af" opacity="0.6" />
          </>
        )}

        {/* Eyes */}
        {emotion === 'happy' && (
          <>
            <path d="M 34 38 Q 38 34 42 38" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 58 38 Q 62 34 66 38" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        )}
        {emotion === 'excited' && (
          <>
            <circle cx="38" cy="38" r="4" fill="#fff" />
            <circle cx="62" cy="38" r="4" fill="#fff" />
            <circle cx="39" cy="37" r="1.5" fill="#18181b" />
            <circle cx="63" cy="37" r="1.5" fill="#18181b" />
          </>
        )}
        {emotion === 'sad' && (
          <>
            <circle cx="38" cy="40" r="3" fill="#fff" />
            <circle cx="62" cy="40" r="3" fill="#fff" />
            <path d="M 34 34 L 40 36" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <path d="M 60 36 L 66 34" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {emotion === 'thinking' && (
          <>
            <circle cx="38" cy="38" r="3.5" fill="#fff" />
            <circle cx="62" cy="38" r="3.5" fill="#fff" />
            <circle cx="39" cy="36" r="1.8" fill="#18181b" />
            <circle cx="63" cy="36" r="1.8" fill="#18181b" />
            <path d="M 58 30 Q 62 27 67 30" stroke="#fff" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.9" />
          </>
        )}
        {emotion === 'neutral' && (
          <>
            <circle cx="38" cy="38" r="3" fill="#fff" />
            <circle cx="62" cy="38" r="3" fill="#fff" />
          </>
        )}

        {/* Mouth */}
        {emotion === 'happy' && (
          <path d="M 42 56 Q 50 63 58 56" stroke="#18181b" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
        {emotion === 'excited' && (
          <path d="M 40 56 Q 50 66 60 56 Q 50 60 40 56 Z" fill="#7f1d1d" stroke="#18181b" strokeWidth="1.5" />
        )}
        {emotion === 'sad' && (
          <path d="M 42 62 Q 50 56 58 62" stroke="#18181b" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
        {emotion === 'thinking' && (
          <>
            <path d="M 46 58 Q 50 56 54 58" stroke="#18181b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <circle cx="54" cy="58" r="1" fill="#18181b" />
          </>
        )}
        {emotion === 'neutral' && (
          <path d="M 44 58 Q 50 60 56 58" stroke="#18181b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        )}

        {/* Sparkles when excited */}
        {emotion === 'excited' && (
          <>
            <text x="10" y="18" fontSize="10" fill="#fbbf24">✨</text>
            <text x="82" y="20" fontSize="10" fill="#fbbf24">⭐</text>
          </>
        )}

        {/* Tear when sad */}
        {emotion === 'sad' && (
          <path d="M 36 44 Q 34 50 32 44 Z" fill="#60a5fa" opacity="0.8" />
        )}

        {/* Thought bubble when thinking */}
        {emotion === 'thinking' && (
          <>
            <circle cx="82" cy="18" r="2.2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />
            <circle cx="87" cy="12" r="3.2" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.8" />
            <circle cx="94" cy="6" r="6" fill="#fff" stroke="#94a3b8" strokeWidth="1" />
            <text x="90.5" y="9.8" fontSize="8" fill="#334155" fontWeight="800">?</text>
          </>
        )}
      </svg>
    </div>
  )
}
