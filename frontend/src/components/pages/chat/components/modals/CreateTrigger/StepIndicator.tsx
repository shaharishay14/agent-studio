interface Step {
  num: number;
  title: string;
  subtitle: string;
}

interface StepIndicatorProps {
  currentStep: number;
  steps: Step[];
}

function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-start justify-between mb-10 px-4">
      {steps.map((s, index) => (
        <div key={s.num} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base transition-all duration-300 relative ${
              currentStep >= s.num
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-gray-800 text-gray-500 border-2 border-gray-700'
            }`}>
              {currentStep > s.num ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                s.num
              )}
            </div>
            <div className="mt-3 text-center max-w-[120px]">
              <div className={`text-xs font-bold mb-1 transition-colors ${
                currentStep >= s.num ? 'text-white' : 'text-gray-500'
              }`}>
                {s.title}
              </div>
              <div className="text-[10px] text-gray-500 leading-tight">
                {s.subtitle}
              </div>
            </div>
          </div>
          {index < steps.length - 1 && (
            <div className="relative flex items-center flex-1 mx-2 mt-[-50px]">
              <div className="h-[2px] w-full bg-gray-700" />
              <div className={`absolute h-[2px] transition-all duration-500 ${
                currentStep > s.num 
                  ? 'w-full bg-gradient-to-r from-orange-500 to-red-500' 
                  : 'w-0 bg-gradient-to-r from-orange-500 to-red-500'
              }`} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default StepIndicator;

