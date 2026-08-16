'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewStudent() {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [studentClass, setStudentClass] = useState('10')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSave() {
    setError('')
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, code, class: studentClass }),
    })
    if (res.ok) router.push('/teacher')
    else { const data = await res.json(); setError(data.message || 'Something went wrong.') }
  }

  return (
    <div className="page" style={{ maxWidth: '400px' }}>
      <Link href="/teacher" className="back-link">← Back</Link>
      <h1 className="page-title" style={{ marginBottom: '20px' }}>Add a student</h1>
      <input type="text" placeholder="Student name" value={name} onChange={e => setName(e.target.value)} />
      <input type="text" placeholder="Login code (e.g. roll number)" value={code} onChange={e => setCode(e.target.value)} />
      <select value={studentClass} onChange={e => setStudentClass(e.target.value)}>
        <option value="9">Class 9</option>
        <option value="10">Class 10</option>
        <option value="11">Class 11</option>
        <option value="12">Class 12</option>
      </select>
      <button className="btn btn-primary" onClick={handleSave}>Add student</button>
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}
