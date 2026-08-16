'use client'

export default function ChangeAvatarButton() {
  async function handle() {
    const confirmed = window.confirm('Change your character? Your current one will be cleared.')
    if (!confirmed) return
    await fetch('/api/profile', { method: 'DELETE' })
    window.location.reload()
  }

  return (
    <button
      onClick={handle}
      style={{
        background: 'none', border: 'none', color: 'var(--ink-3)',
        fontSize: '11px', cursor: 'pointer', marginBottom: '16px',
        display: 'block', textDecoration: 'underline', textDecorationStyle: 'dotted'
      }}
    >
      Change character
    </button>
  )
}
