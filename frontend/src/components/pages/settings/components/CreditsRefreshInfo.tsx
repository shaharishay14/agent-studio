import { Calendar, RefreshCw } from 'lucide-react'
import useDarkModeStore from '../../../../../store/darkmode.store'

interface CreditsRefreshInfoProps {
  creditRefreshDate?: string
  nextRefreshDate?: string
  isLoading: boolean
}

export const CreditsRefreshInfo = ({ 
  creditRefreshDate, 
  nextRefreshDate, 
  isLoading 
}: CreditsRefreshInfoProps) => {
  const { isDarkMode } = useDarkModeStore()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
        <div className={`h-10 sm:h-12 rounded-lg animate-pulse ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
        }`} />
        <div className={`h-10 sm:h-12 rounded-lg animate-pulse ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
        }`} />
      </div>
    )
  }

  return (
    <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
      {/* Last Refresh Date */}
      {creditRefreshDate && (
        <div className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg ${
          isDarkMode 
            ? 'bg-gray-800/50 border border-gray-700' 
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
          }`}>
            <Calendar className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[10px] sm:text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Last Refreshed
            </p>
            <p className={`text-xs sm:text-sm font-medium truncate ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {formatDate(creditRefreshDate)}
            </p>
          </div>
        </div>
      )}

      {/* Next Refresh Date */}
      {nextRefreshDate && (
        <div className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg ${
          isDarkMode 
            ? 'bg-gray-800/50 border border-gray-700' 
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
          }`}>
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
              isDarkMode ? 'text-purple-400' : 'text-purple-600'
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[10px] sm:text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Next Refresh
            </p>
            <p className={`text-xs sm:text-sm font-medium truncate ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {formatDate(nextRefreshDate)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

