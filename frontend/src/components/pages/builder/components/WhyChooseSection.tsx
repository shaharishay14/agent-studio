import { useState, useEffect } from 'react';
import { Zap, Sparkles, Users, Target, Settings, Share2 } from 'lucide-react';
import useDarkModeStore from '../../../../../store/darkmode.store';

interface Feature {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
}

const features: Feature[] = [
  {
    icon: Zap,
    iconColor: 'text-yellow-400',
    title: 'Fast Creation',
    description: 'Build agents in just 3 clicks with our streamlined process',
    badge: '3 clicks to agent',
    badgeColor: 'text-yellow-400',
  },
  {
    icon: Sparkles,
    iconColor: 'text-cyan-400',
    title: 'Simple',
    description: 'No complex setup or technical knowledge required - just describe what you want',
    badge: 'No technical skills needed',
    badgeColor: 'text-cyan-400',
  },
  {
    icon: Users,
    iconColor: 'text-pink-400',
    title: 'Fits Everyone',
    description: 'Perfect for technical, non-technical users, and businesses',
    badge: 'Everyone can use it',
    badgeColor: 'text-pink-400',
  },
  {
    icon: Target,
    iconColor: 'text-green-400',
    title: 'Mission Focus',
    description: 'Lightweight, specific agents that deliver real value',
    badge: 'Lightweight & specific',
    badgeColor: 'text-green-400',
  },
  {
    icon: Settings,
    iconColor: 'text-blue-400',
    title: 'Personalized',
    description: 'Fully customizable agents that adapt to your unique needs',
    badge: 'Fully customizable',
    badgeColor: 'text-blue-400',
  },
  {
    icon: Share2,
    iconColor: 'text-purple-400',
    title: 'Shareable',
    description: 'Create once, share everywhere - collaborate effortlessly',
    badge: 'Share everywhere',
    badgeColor: 'text-purple-400',
  },
];

function WhyChooseSection() {
  const { isDarkMode } = useDarkModeStore();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      // Random index
      const randomIndex = Math.floor(Math.random() * features.length);
      setActiveIndex(randomIndex);
      
      // Reset after 1 second
      setTimeout(() => {
        setActiveIndex(null);
      }, 1000);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-20">
      <div className="text-center mb-16">
        <h2 className={`text-5xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Why Choose{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500">
            Agent Studio
          </span>
          <span className={`${isDarkMode ? 'text-yellow-400' : 'text-orange-500'}`}>?</span>
        </h2>
        <div className="w-32 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full mt-4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          const isActive = activeIndex === index;
          
          return (
            <div
              key={index}
              className={`relative rounded-2xl p-6 backdrop-blur-sm transition-all duration-300 min-h-[280px] ${
                isActive ? 'shake' : ''
              } ${
                isDarkMode
                  ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50'
                  : 'bg-gradient-to-br from-white/80 to-purple-50/50 shadow-lg'
              } ${
                isActive
                  ? 'border-2 border-blue-500 shadow-lg shadow-blue-500/50'
                  : isDarkMode
                    ? 'border border-gray-700/50'
                    : 'border border-purple-200'
              }`}
            >
              <div className="flex flex-col items-start">
                <div className={`mb-4 ${feature.iconColor}`}>
                  <Icon size={40} strokeWidth={2} />
                </div>
                
                <h3 className={`text-2xl font-bold mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {feature.title}
                </h3>
                
                <p className={`text-base mb-4 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {feature.description}
                </p>
                
                <p className={`text-sm font-medium ${feature.badgeColor}`}>
                  {feature.badge}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </section>
  );
}

export default WhyChooseSection;

