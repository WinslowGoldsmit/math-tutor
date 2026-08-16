'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CHARACTERS = [
  'kai', 'mira', 'arjun', 'zara', 'reo', 'anika', 'dev', 'suki', 'neel', 'lina',
  'rohan', 'priya', 'zen', 'maya', 'vikram', 'isha', 'leo', 'tara', 'sameer', 'nia'
]

const NAMES: Record<string, string> = {
  kai: 'Kai', mira: 'Mira', arjun: 'Arjun', zara: 'Zara', reo: 'Reo',
  anika: 'Anika', dev: 'Dev', suki: 'Suki', neel: 'Neel', lina: 'Lina',
  rohan: 'Rohan', priya: 'Priya', zen: 'Zen', maya: 'Maya', vikram: 'Vikram',
  isha: 'Isha', leo: 'Leo', tara: 'Tara', sameer: 'Sameer', nia: 'Nia'
}

// Initials fallback color per character
const COLORS: Record<string, string> = {
  kai: '#3D7BF5', mira: '#F5A623', arjun: '#34A853', zara: '#EA4335',
  reo: '#FF6B00', anika: '#7C4DFF', dev: '#00BCD4', suki: '#E91E63',
  neel: '#1F4247', lina: '#795548', rohan: '#607D8B', priya: '#9C27B0',
  zen: '#455A64', maya: '#FF5722', vikram: '#3F51B5', isha: '#009688',
  leo: '#FF9800', tara: '#8BC34A', sameer: '#F44336', nia: '#673AB7'
}

export default function AvatarPicker() {
  const [saving, setSaving] = useState(false)
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set())
  const router = useRouter()

  async function choose(avatar: string) {
    setSaving(true)
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar }),
    })
    router.refresh()
  }

  function handleImageError(name: string) {
    setBrokenImages(prev => new Set([...prev, name]))
  }

  return (
    <div className="card anim-scale-in" style={{ padding: '20px', marginBottom: '24px' }}>
      <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px', textAlign: 'center' }}>
        Choose your character
      </p>
      <p style={{ fontSize: '12px', color: 'var(--ink-3)', marginBottom: '16px', textAlign: 'center' }}>
        This is how you&apos;ll appear in Zenko.
      </p>
      <div className="avatar-grid">
        {CHARACTERS.map(c => (
          <button
            key={c}
            className="avatar-option"
            onClick={() => choose(c)}
            disabled={saving}
            title={NAMES[c]}
            aria-label={`Choose ${NAMES[c]} as your character`}
          >
            {brokenImages.has(c) ? (
              // Graceful fallback: colored circle with initial
              <div style={{
                width: '100%', height: '100%', borderRadius: '6px',
                background: COLORS[c] ?? '#3D7BF5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: '16px',
                fontFamily: 'var(--font-display)'
              }}>
                {NAMES[c].charAt(0)}
              </div>
            ) : (
              <img
                src={`/avatars/${c}.png`}
                alt={NAMES[c]}
                onError={() => handleImageError(c)}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
