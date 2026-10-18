import { Wallet } from 'lucide-react'
import useDarkModeStore from '../../../../../store/darkmode.store'

interface CreditsInfoPopupProps {
  onClose: () => void
}

export const CreditsInfoPopup = ({ onClose }: CreditsInfoPopupProps) => {
  const { isDarkMode } = useDarkModeStore()

  return (
    <>
      <div className={`absolute top-12 sm:top-14 left-4 right-4 md:left-auto md:right-6 z-10 md:w-80 p-4 md:p-5 rounded-xl border shadow-2xl max-h-[70vh] overflow-y-auto ${
        isDarkMode 
          ? 'bg-gray-900 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <div className={`p-2 rounded-lg ${
            isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
          }`}>
            <Wallet className={`w-4 h-4 ${
              isDarkMode ? 'text-purple-400' : 'text-purple-600'
            }`} />
          </div>
          <h3 className={`font-bold text-base md:text-lg ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            How Credits Work
          </h3>
        </div>
        
        <div className={`text-xs md:text-sm space-y-2 md:space-y-3 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          <div>
            <p className="font-semibold mb-1 md:mb-2">Credits are consumed by:</p>
            <ul className="space-y-0.5 md:space-y-1 ml-3 md:ml-4">
              <li>• Each credit equals one interaction with an agent</li>
              <li>• Direct agent messages consume 1 credit</li>
              <li>• Workflow steps consume 1 credit per step</li>
              <li>• Trigger actions: Automated triggers that execute agents or workflows automatically (e.g., scheduled tasks, webhooks) consume 1 credit per execution</li>
              <li>• Credits reset monthly on your reset date</li>
            </ul>
          </div>
          
          <div>
            <p className="font-semibold mb-1 md:mb-2">What doesn't consume credits:</p>
            <ul className="space-y-0.5 md:space-y-1 ml-3 md:ml-4">
              <li>• Public agent interactions (shared/published agents)</li>
              <li>• WhatsApp interactions</li>
              <li>• Telegram bot interactions</li>
              <li>• Viewing or managing agents/workflows</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Overlay to close popup when clicking outside */}
      <div 
        className="fixed inset-0 z-[9]" 
        onClick={onClose}
      />
    </>
  )
}

