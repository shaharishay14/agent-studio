interface SubmitButtonProps {
  isLoading: boolean
  loadingText: string
  text: string
  icon: React.ComponentType<{ className?: string }>
}

export const SubmitButton = ({ isLoading, loadingText, text, icon: Icon }: SubmitButtonProps) => {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:from-purple-600 hover:via-pink-600 hover:to-orange-500 active:scale-[0.98] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-150 shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          {loadingText}
        </>
      ) : (
        <>
          <Icon className="w-4 h-4 drop-shadow-lg" />
          {text}
        </>
      )}
    </button>
  )
}

