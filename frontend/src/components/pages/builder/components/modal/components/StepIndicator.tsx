import { type LucideIcon } from 'lucide-react';
import useDarkModeStore from '../../../../../../../store/darkmode.store';

interface Step {
  number: number;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const { isDarkMode } = useDarkModeStore();

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => {
        const StepIcon = step.icon;
        const isActive = currentStep === step.number;
        const isPast = currentStep > step.number;
        
        return (
          <div key={step.number} className={`flex items-center transition-all duration-300 ${
            isActive ? 'flex-1' : 'flex-shrink-0'
          }`}>
            {/* Collapsed State (Future or Past Steps) */}
            {!isActive ? (
              <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-bold text-xs sm:text-sm transition-all ${
                isPast
                  ? isDarkMode
                    ? 'bg-green-500 text-white border-2 border-green-400/50'
                    : 'bg-green-600 text-white border-2 border-green-500/50'
                  : isDarkMode
                    ? 'bg-gray-800 text-gray-500 border-2 border-gray-700'
                    : 'bg-gray-200 text-gray-500 border-2 border-gray-300'
              }`}>
                {isPast ? '✓' : step.number}
              </div>
            ) : (
              /* Expanded State (Current Step) */
              <div className={`w-full p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all border ${
                isDarkMode
                  ? 'bg-purple-500/20 border-purple-500/50'
                  : 'bg-purple-50 border-purple-300'
              }`}>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-bold text-xs sm:text-sm flex-shrink-0 ${
                    isDarkMode
                      ? 'bg-purple-500 text-white'
                      : 'bg-purple-600 text-white'
                  }`}>
                    {step.number}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs sm:text-sm font-semibold truncate ${
                      isDarkMode ? 'text-purple-300' : 'text-purple-700'
                    }`}>
                      {step.title}
                    </div>
                    <div className={`hidden sm:block text-xs truncate ${
                      isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    }`}>
                      {step.subtitle}
                    </div>
                  </div>
                  
                  <StepIcon className={`hidden sm:block w-5 h-5 flex-shrink-0 ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                </div>
              </div>
            )}
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={`h-[2px] w-3 mx-1 transition-all ${
                currentStep > step.number
                  ? isDarkMode
                    ? 'bg-green-500'
                    : 'bg-green-600'
                  : isDarkMode
                    ? 'bg-gray-700'
                    : 'bg-gray-300'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default StepIndicator;

