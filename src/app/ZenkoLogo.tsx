/**
 * Zenko mark — a geometric fox face (zenko = the good fox spirit).
 * Pure SVG, so there is no PNG to upload and it stays crisp at any size.
 */
export default function ZenkoLogo({
  size = 26,
  variant = 'student',
}: {
  size?: number
  variant?: 'student' | 'teacher'
}) {
  const gradId = `zenko-grad-${variant}`
  const from = variant === 'teacher' ? '#7C4DFF' : '#3D7BF5'
  const to = variant === 'teacher' ? '#9C27B0' : '#7C4DFF'

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradId})`} />
      {/* ears */}
      <path d="M8 7.5 L13.5 12.5 L8 14.5 Z" fill="#fff" fillOpacity="0.95" />
      <path d="M24 7.5 L18.5 12.5 L24 14.5 Z" fill="#fff" fillOpacity="0.95" />
      {/* face */}
      <path
        d="M8 11.5 L16 14 L24 11.5 L24 17.5 C24 22 20.4 25.5 16 26.5 C11.6 25.5 8 22 8 17.5 Z"
        fill="#fff"
        fillOpacity="0.95"
      />
      {/* eyes + snout */}
      <circle cx="12.8" cy="17.6" r="1.35" fill={from} />
      <circle cx="19.2" cy="17.6" r="1.35" fill={from} />
      <path d="M16 20.6 L17.5 22.4 L16 23.6 L14.5 22.4 Z" fill={to} />
    </svg>
  )
}
