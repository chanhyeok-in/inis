'use client'

export default function StyledButton({ children, onClick, disabled = false, ...props }) {
  const styles = {
    backgroundColor: 'white',
    color: 'black',
    border: '1px solid #dbdbdb',
    borderBottom: '3px solid #b5b5b5',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: '0 3px 5px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.15s ease-in-out',
    transform: disabled ? 'translateY(0)' : 'translateY(-2px)',
    opacity: disabled ? 0.7 : 1,
  }

  const hoverStyles = {
    transform: 'translateY(-3px)',
    boxShadow: '0 5px 8px rgba(0, 0, 0, 0.15)',
  }

  const activeStyles = {
    transform: 'translateY(0px)',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    borderBottom: '1px solid #b5b5b5',
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
          Object.assign(e.currentTarget.style, { transform: styles.transform, boxShadow: styles.boxShadow, borderBottom: styles.borderBottom })
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