interface AuthButtonProps {
  text: string
  icon: React.ComponentType<{ className?: string }>
  type?: 'submit' | 'button'
}

export const AuthButton = ({ text, icon: Icon, type = 'submit' }: AuthButtonProps) => {
  return (
    <button
      type={type}
      className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:from-purple-600 hover:via-pink-600 hover:to-orange-500 active:scale-[0.98] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-150 shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
    >
      <Icon className="w-4 h-4 drop-shadow-lg" />
      {text}
    </button>
  )
}

