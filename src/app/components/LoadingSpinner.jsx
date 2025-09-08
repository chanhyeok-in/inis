'use client'

export default function LoadingSpinner({ size = 40, color = '#0070f3' }) {
  const style = {
    display: 'inline-block',
    width: `${size}px`,
    height: `${size}px`,
    border: `4px solid rgba(0, 0, 0, 0.1)`,
    borderRadius: '50%',
    borderTopColor: color,
    animation: 'spin 1s ease-in-out infinite',
  }

  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={style}></div>
    </>
  )
}
