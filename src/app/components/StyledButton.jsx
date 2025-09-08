'use client'

export default function StyledButton({ children, onClick, disabled = false, faded = false, style, ...props }) {
  const baseClasses = 'px-6 py-3 font-bold text-black bg-white border border-gray-300 rounded-lg shadow-md'
  const transitionClasses = 'transition-all duration-150 ease-in-out transform'
  
  let stateClasses = '';
  let currentOpacity = 1;
  let currentCursor = 'pointer';

  if (disabled) {
    stateClasses = 'opacity-70 cursor-not-allowed';
    currentOpacity = 0.7;
    currentCursor = 'not-allowed';
  } else if (faded) {
    stateClasses = 'opacity-50'; // Faded but still clickable
    currentOpacity = 0.5;
    currentCursor = 'pointer';
  } else {
    stateClasses = 'hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm hover:shadow-lg';
  }

  const combinedClasses = `${baseClasses} ${transitionClasses} ${stateClasses}`

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={combinedClasses}
      style={{ ...style, opacity: currentOpacity, cursor: currentCursor }} // Apply custom style and calculated opacity/cursor
      {...props}
    >
      {children}
    </button>
  )
}