import { Mail, Crown, Users, User } from 'lucide-react'
import useDarkModeStore from '../../../../../store/darkmode.store'
import { useUserStore } from '../../../../../store/user.store'

export const AccountInformation = () => {
  const { isDarkMode } = useDarkModeStore()
  const { user } = useUserStore()

  return (
    <div className={`rounded-xl sm:rounded-2xl border p-4 sm:p-5 md:p-6 ${
      isDarkMode 
        ? 'bg-gray-900/50 border-gray-800' 
        : 'bg-white border-gray-200 shadow-lg'
    }`}>
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
        <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center ${
          isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
        }`}>
          <Users className={`w-4 h-4 sm:w-5 sm:h-5 ${
            isDarkMode ? 'text-blue-400' : 'text-blue-600'
          }`} />
        </div>
        <h2 className={`text-lg sm:text-xl md:text-2xl font-bold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Account Information
        </h2>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {/* Username */}
        <div className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
            }`}>
              <User className={`w-4 h-4 sm:w-5 sm:h-5 ${
                isDarkMode ? 'text-purple-400' : 'text-purple-600'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs sm:text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Username
              </p>
              <p className={`text-sm sm:text-base font-medium truncate ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {user?.username || 'Not available'}
              </p>
            </div>
          </div>
        </div>

        {/* Email */}
        <div className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <Mail className={`w-4 h-4 sm:w-5 sm:h-5 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs sm:text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Email Address
              </p>
              <p className={`text-sm sm:text-base font-medium truncate ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {user?.email || 'Not available'}
              </p>
            </div>
          </div>
        </div>

        {/* Current Plan */}
        <div className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border ${
          isDarkMode 
            ? 'bg-gray-800/50 border-gray-700' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isDarkMode ? 'bg-yellow-500/20' : 'bg-yellow-100'
            }`}>
              <Crown className={`w-4 h-4 sm:w-5 sm:h-5 ${
                isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs sm:text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Current Plan
              </p>
              <p className={`text-sm sm:text-base font-medium truncate ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Free
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

