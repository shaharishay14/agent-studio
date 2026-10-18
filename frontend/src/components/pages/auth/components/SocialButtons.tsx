import { Github } from 'lucide-react'
import { GoogleIcon } from './GoogleIcon'
import useDarkModeStore from '../../../../../store/darkmode.store'

interface SocialButtonsProps {
  onGoogleClick: () => void
  onGithubClick: () => void
}

export const SocialButtons = ({ onGoogleClick, onGithubClick }: SocialButtonsProps) => {
  const { isDarkMode } = useDarkModeStore()

  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      {/* כפתור Google */}
      <button
        type="button"
        onClick={onGoogleClick}
        className={`w-14 h-14 active:scale-95 rounded-full flex items-center justify-center transition-all duration-150 border shadow-lg hover:shadow-xl group ${
          isDarkMode 
            ? 'bg-[#252525] hover:bg-[#2a2a2a] border-gray-800' 
            : 'bg-white hover:bg-gray-50 border-gray-300'
        }`}
        title="Continue with Google"
      >
        <GoogleIcon />
      </button>

      {/* כפתור GitHub */}
      <button
        type="button"
        onClick={onGithubClick}
        className={`w-14 h-14 active:scale-95 rounded-full flex items-center justify-center transition-all duration-150 border shadow-lg hover:shadow-xl group ${
          isDarkMode 
            ? 'bg-[#252525] hover:bg-[#2a2a2a] border-gray-800' 
            : 'bg-white hover:bg-gray-50 border-gray-300'
        }`}
        title="Continue with GitHub"
      >
        <Github className={`w-6 h-6 transition-transform group-hover:scale-110 ${
          isDarkMode ? 'text-white drop-shadow-md' : 'text-gray-900'
        }`} />
      </button>
    </div>
  )
}

