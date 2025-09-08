'use client'

export default function StyledButton({ children, onClick, disabled = false, ...props }) {
  const baseClasses = 'px-6 py-3 font-bold text-black bg-white border border-gray-300 rounded-lg shadow-md'
  const transitionClasses = 'transition-all duration-150 ease-in-out transform'
  const stateClasses = disabled
    ? 'opacity-70 cursor-not-allowed'
    : 'hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm hover:shadow-lg'

  const combinedClasses = `${baseClasses} ${transitionClasses} ${stateClasses}`

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={combinedClasses}
      {...props}
    >
      {children}
    </button>
  )
}
