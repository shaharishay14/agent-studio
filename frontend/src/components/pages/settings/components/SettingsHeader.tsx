import { Settings as SettingsIcon } from 'lucide-react'
import useDarkModeStore from '../../../../../store/darkmode.store'

export const SettingsHeader = () => {
  const { isDarkMode } = useDarkModeStore()

  return (
    <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 md:mb-12">
      <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center ${
        isDarkMode 
          ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
          : 'bg-gradient-to-br from-purple-400 to-pink-400'
      }`}>
        <SettingsIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
      </div>
      <div>
        <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Settings
        </h1>
        <p className={`text-sm sm:text-base md:text-lg ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Manage your account and preferences
        </p>
      </div>
    </div>
  )
}

