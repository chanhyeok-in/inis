'use client'

export default function StyledButton({ children, onClick, disabled = false, ...props }) {
  const styles = {
    backgroundColor: 'white',
    color: 'black',
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease-in-out',
    transform: disabled ? 'translateY(0)' : 'translateY(-2px)',
    opacity: disabled ? 0.7 : 1,
  }

  const hoverStyles = {
    transform: 'translateY(-3px)',
    boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15)',
  }

  const activeStyles = {
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={styles}
      onMouseOver={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, hoverStyles)
        }
      }}
      onMouseOut={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, { transform: styles.transform, boxShadow: styles.boxShadow })
        }
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, activeStyles)
        }
      }}
      onMouseUp={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, hoverStyles)
        }
      }}
      {...props}
    >
      {children}
    </button>
  )
}
