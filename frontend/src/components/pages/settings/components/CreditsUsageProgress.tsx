import useDarkModeStore from '../../../../../store/darkmode.store'

interface CreditsUsageProgressProps {
  creditsUsed: number
  totalCredits: number
  isLoading: boolean
}

export const CreditsUsageProgress = ({ creditsUsed, totalCredits, isLoading }: CreditsUsageProgressProps) => {
  const { isDarkMode } = useDarkModeStore()
  const totalCreditsSum = totalCredits + creditsUsed

  return (
    <div className={`p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl border ${
      isDarkMode 
        ? 'bg-gray-800/50 border-gray-700' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <p className={`text-xs sm:text-sm font-medium ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Credits Used This Period
        </p>
        <p className={`text-xl sm:text-2xl font-bold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {isLoading ? '...' : `${creditsUsed} / ${totalCreditsSum}`}
        </p>
      </div>
      
      {/* Progress Bar */}
      <div className={`w-full h-2 rounded-full overflow-hidden ${
        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
      }`}>
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
          style={{ 
            width: totalCreditsSum > 0
              ? `${Math.min((creditsUsed / totalCreditsSum) * 100, 100)}%` 
              : '0%' 
          }}
        />
      </div>
    </div>
  )
}

