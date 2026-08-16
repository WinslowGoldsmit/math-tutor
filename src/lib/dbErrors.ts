/**
 * Zenko — friendly database error messages.
 *
 * Supabase/Postgres errors are technical ("violates foreign key constraint
 * flashcards_topic_id_fkey"). Teachers should never see that. This maps the
 * known error codes to plain English.
 */

type PgError = { code?: string; message?: string; details?: string } | null | undefined

const FRIENDLY: Record<string, string> = {
  '23503': 'This still has items linked to it. Delete those first, or choose "Delete everything inside".',
  '23505': 'Something with that name or code already exists. Try a different one.',
  '23502': 'A required field was left empty.',
  '22P02': 'One of the values was the wrong type. Please check and try again.',
  '42703': 'A column is missing in the database. Run the SQL setup script in Supabase.',
  '42P01': 'A table is missing in the database. Run the SQL setup script in Supabase.',
  '42501': 'The database blocked this action (row level security). Check the table policy in Supabase.',
}

export function friendlyDbError(error: PgError, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback
  if (error.code && FRIENDLY[error.code]) return FRIENDLY[error.code]

  const msg = (error.message ?? '').toLowerCase()
  if (msg.includes('foreign key')) return FRIENDLY['23503']
  if (msg.includes('duplicate key')) return FRIENDLY['23505']
  if (msg.includes('column') && msg.includes('does not exist')) return FRIENDLY['42703']
  if (msg.includes('row-level security') || msg.includes('row level security')) return FRIENDLY['42501']
  if (msg.includes('invalid input syntax')) return FRIENDLY['22P02']

  return fallback
}

/** True when the error is a foreign-key violation (parent still has children). */
export function isForeignKeyError(error: PgError) {
  if (!error) return false
  if (error.code === '23503') return true
  return (error.message ?? '').toLowerCase().includes('foreign key')
}
