import Link from 'next/link'
import Image from 'next/image'
import LogoutButton from './LogoutButton'

export default function Topbar({ role = 'student', name }: { role?: 'student' | 'teacher'; name?: string }) {
  const home = role === 'teacher' ? '/teacher' : '/student'

  return (
    <div className="topbar">
      <Link href={home} className="topbar-logo" aria-label="Zenko home">
        <Image
          src="/logo-icon.png"
          alt="Zenko"
          width={28}
          height={28}
          style={{ borderRadius: '7px', display: 'block' }}
          priority
        />
        <span className={`topbar-brand ${role === 'teacher' ? 'topbar-teacher' : ''}`}>Zenko</span>
      </Link>
      <div className="topbar-right">
        {name && <span className="topbar-name">{name}</span>}
        <LogoutButton />
      </div>
    </div>
  )
}
