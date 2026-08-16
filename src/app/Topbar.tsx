import LogoutButton from './LogoutButton'

export default function Topbar({ role = 'student', name }: { role?: 'student' | 'teacher'; name?: string }) {
  return (
    <div className="topbar">
      <span className={`topbar-brand ${role === 'teacher' ? 'topbar-teacher' : ''}`}>Zenko</span>
      {name && <span style={{ fontSize: '12px', color: 'var(--ink-3)' }}>{name}</span>}
      <LogoutButton />
    </div>
  )
}
