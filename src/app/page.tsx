import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { data, error } = await supabase.from('chapters').select('*')

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Supabase Connection Test</h1>
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      {!error && <p>Connected successfully. Chapters found: {data.length}</p>}
    </div>
  )
}