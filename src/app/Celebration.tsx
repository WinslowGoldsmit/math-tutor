'use client'

import { useEffect, useState } from 'react'

const COLORS = ['#3D7BF5', '#7C4DFF', '#34A853', '#F5A623', '#EA4335']

export default function Celebration() {
  const [pieces, setPieces] = useState<{ id: number; x: number; color: string; delay: number }[]>([])

  useEffect(() => {
    const p = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 0.4,
    }))
    setPieces(p)
    const t = setTimeout(() => setPieces([]), 1500)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.x}%`,
            top: '60%',
            background: p.color,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </>
  )
}
