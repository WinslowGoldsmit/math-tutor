import Link from 'next/link'
import LogoutButton from './LogoutButton'
import ZenkoLogo from './ZenkoLogo'

export default function Topbar({ role = 'student', name }: { role?: 'student' | 'teacher'; name?: string }) {
  const home = role === 'teacher' ? '/teacher' : '/student'

  return (
    <div className="topbar">
      <Link href={home} className="topbar-logo" aria-label="Zenko home">
        <ZenkoLogo size={26} variant={role} />
        <span className={`topbar-brand ${role === 'teacher' ? 'topbar-teacher' : ''}`}>Zenko</span>
      </Link>
      <div className="topbar-right">
        {name && <span className="topbar-name">{name}</span>}
        <LogoutButton />
      </div>
    </div>
  )
}
