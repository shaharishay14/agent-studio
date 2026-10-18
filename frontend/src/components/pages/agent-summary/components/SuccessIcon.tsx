import { CheckCircle2, Sparkles } from 'lucide-react';

function SuccessIcon() {
  return (
    <div className="flex justify-center pt-8 pb-4 relative">
      {/* Background Sparkles */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2">
        <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse absolute -top-8 -left-12" />
        <Sparkles className="w-4 h-4 text-purple-400 animate-pulse absolute -top-6 right-8 animation-delay-300" />
        <Sparkles className="w-5 h-5 text-pink-400 animate-pulse absolute top-2 -right-16 animation-delay-500" />
        <Sparkles className="w-4 h-4 text-blue-400 animate-pulse absolute top-0 left-12 animation-delay-700" />
      </div>
      
      {/* Main Icon */}
      <div className="relative z-10">
        {/* Outer glow ring */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 rounded-full blur-2xl opacity-40 animate-pulse"></div>
        
        {/* Middle ring */}
        <div className="absolute -inset-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-lg opacity-60 animate-spin-slow"></div>
        
        {/* Icon container */}
        <div className="relative bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 rounded-full p-5 shadow-2xl transform hover:scale-110 transition-transform duration-300">
          <CheckCircle2 className="w-14 h-14 text-white drop-shadow-lg" />
        </div>
      </div>
    </div>
  );
}

export default SuccessIcon;

